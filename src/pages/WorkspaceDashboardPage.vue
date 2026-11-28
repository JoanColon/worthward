<template>
  <q-page class="workspace-dashboard-page">
    <main class="dashboard-shell">
      <AppPageHeader :title="greeting" :subtitle="t('dashboard.snapshotSubtitle')" size="hero" />

      <FinancialSetupCard v-if="showSetup" :items="setupItems" class="setup-guide" />

      <section class="dashboard-grid" :aria-label="t('dashboard.ariaLabel')">
        <FinancialPositionCard
          v-if="financialPositionReady"
          :data="dashboardData"
          :history-points="historyPoints"
          :history-loading="historyLoading"
          :history-error="Boolean(historyError)"
          @open-assets="openSection('assets')"
          @open-liabilities="openSection('liabilities')"
        />
        <CostOfLifeCard
          v-if="cashFlowReady"
          class="cost-summary"
          :data="dashboardData"
          @open-expenses="openSection('expenses')"
          @open-income="openSection('income')"
        />
        <PlanSummaryCard
          v-if="setupComplete"
          class="plan-summary"
          :data="planData"
          :progress-data="progressData"
          :plan-route="{ name: 'plan', params: { workspaceId } }"
          :progress-route="{ name: 'progress', params: { workspaceId } }"
          :setup-route="{ name: 'setup', params: { workspaceId } }"
        />
      </section>

      <QuickLinksSection
        v-if="setupComplete"
        :workspace-id="workspaceId"
        :candidates="quickLinkCandidates"
      />
    </main>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CostOfLifeCard from '@/components/dashboard/CostOfLifeCard.vue'
import FinancialSetupCard from '@/components/dashboard/FinancialSetupCard.vue'
import FinancialPositionCard from '@/components/dashboard/FinancialPositionCard.vue'
import PlanSummaryCard from '@/components/dashboard/PlanSummaryCard.vue'
import QuickLinksSection from '@/components/dashboard/QuickLinksSection.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import { assetCategories } from '@/config/asset-categories'
import { expenseCategories } from '@/config/expense-categories'
import { incomeCategories } from '@/config/income-categories'
import { getLiabilityCategory } from '@/config/liability-categories'
import { DEMO_REFERENCE_DATE, isDemoWorkspaceId } from '@/domain/access/demo-workspace'
import { liabilityCategories } from '@/config/liability-categories'
import {
  extractPositionLiabilities,
  modeledLiabilitiesForPositions,
} from '@/domain/financial/calculation-context'
import { calculateDebtPayoffImpact } from '@/domain/financial/debt-payoff'
import {
  buildMonthlyFlowSeries,
  buildNetWorthSeries,
  buildProgressSeries,
  withCurrentPosition,
} from '@/domain/financial/history'
import {
  financialYearAvailableIncomeValue,
  financialYearExpenseNecessityValue,
  financialYearFlowValue,
  financialYearMonthValue,
} from '../../functions/shared/positions/annual-projection.js'
import {
  calculateCostOfLifeRatioPercent,
  calculateSavingsCapacity,
  calculateSavingsRatePercent,
} from '../../functions/shared/positions/metrics.js'
import { roundMoneyOrZero } from '../../functions/shared/core/money.js'
import {
  findLatestObservedPositionMonth,
  simulateAllocationStrategy,
  buildStrategyStartingPosition,
} from '../../functions/shared/plan/strategy-simulation.js'
import {
  calculateSavingsCapacityScenario,
  defaultStrategyScenario,
  normalizeStrategyForOptions,
} from '../../functions/shared/plan/what-if.js'
import { authUser } from '@/services/auth'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useAssetsStore } from '@/stores/assets-store'
import { useExpensesStore } from '@/stores/expenses-store'
import { useIncomeStore } from '@/stores/income-store'
import { useLiabilitiesStore } from '@/stores/liabilities-store'
import { useMilestonesStore } from '@/stores/milestones-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useWhatIfStore } from '@/stores/what-if-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'
import { financialModuleSetupStatus } from '@/domain/financial/model-categories'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const assetsStore = useAssetsStore()
const expensesStore = useExpensesStore()
const incomeStore = useIncomeStore()
const liabilitiesStore = useLiabilitiesStore()
const milestonesStore = useMilestonesStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const whatIfStore = useWhatIfStore()
const setupLoading = ref(true)

const workspaceId = computed(() => String(route.params.workspaceId))
const {
  currentMonth,
  currentYear,
  excludedLiabilityIds,
  financialYear,
  historyDocuments,
  historyError,
  historyLoading,
} = storeToRefs(milestonesStore)
const workspace = computed(
  () => workspaceStore.workspaces.find((candidate) => candidate.id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map((member) => member.id))
const selectedMemberId = computed({
  get: () => scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
  set: (memberId) => scopeStore.select(workspaceId.value, memberId),
})
const meaningfulHistoryDocuments = computed(() =>
  historyDocuments.value.map((document) => ({
    ...document,
    months: Object.fromEntries(
      Object.entries(document?.months || {}).filter(
        ([, month]) => month?.positionStatus !== 'current',
      ),
    ),
  })),
)
const observedHistoryPoints = computed(() =>
  buildNetWorthSeries(meaningfulHistoryDocuments.value, {
    throughPeriod: `${currentYear.value}-${currentMonth.value}`,
    memberId: selectedMemberId.value,
  }),
)
const historyPoints = computed(() =>
  observedHistoryPoints.value.length
    ? buildNetWorthSeries(
        withCurrentPosition(historyDocuments.value, financialYear.value, currentMonth.value),
        {
          throughPeriod: `${currentYear.value}-${currentMonth.value}`,
          memberId: selectedMemberId.value,
        },
      )
    : [],
)
const progressDocuments = computed(() => {
  if (!financialYear.value) return historyDocuments.value
  const year = Number(financialYear.value.year || financialYear.value.id)
  return [
    ...historyDocuments.value.filter((document) => Number(document?.year || document?.id) !== year),
    financialYear.value,
  ]
})
const progressHistoryOptions = computed(() => ({
  throughPeriod: `${currentYear.value}-${currentMonth.value}`,
  memberId: selectedMemberId.value,
  excludedLiabilityIds: excludedLiabilityIds.value,
}))
const progressPoints = computed(() =>
  buildProgressSeries(progressDocuments.value, progressHistoryOptions.value),
)
const progressFlowPoints = computed(() =>
  buildMonthlyFlowSeries(progressDocuments.value, progressHistoryOptions.value),
)
const progressEndPoint = computed(() => progressPoints.value.at(-1) || null)
const progressStartPoint = computed(() => {
  const end = progressEndPoint.value
  if (!end) return null
  const cutoff = periodIndex(end.period) - 12
  return (
    [...progressPoints.value].reverse().find(({ period }) => periodIndex(period) <= cutoff) ||
    progressPoints.value[0]
  )
})
const dashboardData = computed(() => {
  const assets = financialYearMonthValue(
    financialYear.value,
    currentMonth.value,
    'assets',
    selectedMemberId.value,
  )
  const liabilities = financialYearMonthValue(
    financialYear.value,
    currentMonth.value,
    'liabilities',
    selectedMemberId.value,
  )
  const income = financialYear.value
    ? financialYearAvailableIncomeValue(financialYear.value, selectedMemberId.value)
    : 0
  const annualCostOfLife = financialYear.value
    ? financialYearFlowValue(financialYear.value, 'expenses', selectedMemberId.value)
    : 0
  const savingsCapacity = roundMoneyOrZero(calculateSavingsCapacity(income, annualCostOfLife))

  return {
    assets,
    liabilities,
    income,
    monthlyIncome: income / 12,
    annualCost: annualCostOfLife,
    monthlyCost: annualCostOfLife / 12,
    savingsCapacity,
    monthlySavingsCapacity: savingsCapacity / 12,
    savingsRate: calculateSavingsRatePercent(savingsCapacity, income),
    costRatio: calculateCostOfLifeRatioPercent(annualCostOfLife, income),
    netWorth: financialYearMonthValue(
      financialYear.value,
      currentMonth.value,
      'netWorth',
      selectedMemberId.value,
    ),
  }
})
const workspaceSetupTotals = computed(() => ({
  assets: financialYearMonthValue(financialYear.value, currentMonth.value, 'assets'),
  liabilities: financialYearMonthValue(financialYear.value, currentMonth.value, 'liabilities'),
  income: financialYear.value ? financialYearAvailableIncomeValue(financialYear.value) : 0,
  expenses: financialYear.value ? financialYearFlowValue(financialYear.value, 'expenses') : 0,
}))
const progressData = computed(() => {
  const start = progressStartPoint.value
  const end = progressEndPoint.value
  const currentFlow = progressFlowPoints.value.at(-1)
  const hasComparison = Boolean(start && end && start.period !== end.period)
  const wealthChange = hasComparison ? end.netWorth - start.netWorth : null
  const currentNetWorth = Number(end?.netWorth ?? dashboardData.value.netWorth)
  const monthlySavings = Number(
    currentFlow?.savingsCapacity ?? dashboardData.value.monthlySavingsCapacity,
  )

  return [
    {
      id: 'wealth-creation',
      label: t('progress.evolution.wealthCreation.label'),
      value: wealthChange == null ? '—' : signedCurrency(wealthChange),
      icon: 'account_balance_wallet',
      tone: 'green',
      negative: wealthChange < 0,
    },
    {
      id: 'composition',
      label: t('progress.evolution.composition.label'),
      value: formatCurrency(currentNetWorth),
      icon: 'donut_large',
      tone: 'warning',
      negative: currentNetWorth < 0,
    },
    {
      id: 'freedom',
      label: t('progress.evolution.freedom.label'),
      value: formatYears(end?.yearsFunded),
      icon: 'shield',
      tone: 'purple',
      negative: false,
    },
    {
      id: 'cost-of-life',
      label: t('progress.evolution.costOfLife.label'),
      value: formatCurrency(monthlySavings),
      icon: 'savings',
      tone: 'blue',
      negative: monthlySavings < 0,
    },
  ]
})
const activeScenario = computed(
  () =>
    whatIfStore.config.scenarios.find(({ id }) => id === whatIfStore.config.activeScenarioId) ||
    whatIfStore.config.scenarios[0],
)
const planData = computed(() => {
  const hasSavedStrategy = Boolean(
    activeScenario.value && activeScenario.value.id !== defaultStrategyScenario.id,
  )
  const hasWhatIfInputs = dashboardData.value.income > 0 && dashboardData.value.annualCost > 0

  if (!hasSavedStrategy && !hasWhatIfInputs) return { state: 'empty' }

  const simulation = calculateSavingsCapacityScenario({
    availableIncome: dashboardData.value.income,
    costOfLife: dashboardData.value.annualCost,
    discretionary: financialYearExpenseNecessityValue(
      financialYear.value,
      'lifestyle',
      selectedMemberId.value,
    ),
    reductionPercent:
      whatIfStore.config.extraMonthlySavings > 0
        ? 0
        : whatIfStore.config.discretionaryReductionPercent,
    extraMonthlySavings: whatIfStore.config.extraMonthlySavings,
  })

  if (!hasSavedStrategy) {
    return {
      state: 'what-if',
      monthlyAmount: simulation.extraSavings,
      extraSavings: simulation.extraSavings,
    }
  }

  const positionMonth = findLatestObservedPositionMonth(financialYear.value, currentMonth.value)
  const liabilities = extractPositionLiabilities(
    financialYear.value,
    positionMonth,
    selectedMemberId.value,
    liabilityCategoryName,
  )
  const selectedDebt =
    liabilities.find(({ id }) => id === activeScenario.value.selectedLiabilityId) ||
    liabilities.find(({ categoryId }) => categoryId === 'mortgage') ||
    liabilities[0] ||
    null
  const selectedDebtModel = selectedDebt
    ? modeledLiabilitiesForPositions(
        [selectedDebt],
        liabilitiesStore.itemsForCategory('mortgage'),
        selectedMemberId.value,
      )[0] || selectedDebt
    : null
  const debtAvailable = Boolean(selectedDebt)
  const allocation = normalizeStrategyForOptions(activeScenario.value.allocation, {
    cash: true,
    debt: debtAvailable,
  })
  const projection = simulateAllocationStrategy({
    startingPosition: buildStrategyStartingPosition(
      financialYear.value,
      positionMonth,
      selectedMemberId.value,
    ),
    scenario: { ...activeScenario.value, allocation },
    simulatedMonthlySavings: Math.max(0, simulation.currentSavingsCapacity),
    simulatedMonthlyCost: simulation.monthlyCostOfLife,
    debtAvailable,
  })
  const debtPayoff = calculateDebtPayoffImpact({
    liability: selectedDebtModel,
    extraMonthlyPayment: (Math.max(0, simulation.currentSavingsCapacity) * allocation.debt) / 100,
    asOfDate: localToday(),
  })

  return {
    state: 'strategy',
    name: activeScenario.value.name,
    monthlyAmount: Math.max(0, simulation.currentSavingsCapacity),
    outcomes: [
      {
        id: 'cash',
        label: t('whatIf.cash.title'),
        result: strategyCashOutcome(projection.strategy, activeScenario.value.horizonYears),
      },
      {
        id: 'invest',
        label: t('whatIf.invest.title'),
        result:
          allocation.invest > 0
            ? t('plan.outcomes.inYears', {
                amount: formatCurrency(projection.strategy.investmentValue),
                years: activeScenario.value.horizonYears,
              })
            : t('plan.outcomes.notIncluded'),
      },
      {
        id: 'debt',
        label: t('whatIf.debt.title'),
        result:
          allocation.debt > 0
            ? debtOutcome(debtPayoff, debtAvailable, selectedDebt?.name)
            : t('plan.outcomes.notIncluded'),
      },
    ],
  }
})

const setupItems = computed(() => [
  setupItem(
    'assets',
    'inventory_2',
    'dashboard.setup.assets',
    financialModuleSetupStatus({
      setupCompleted: assetsStore.setupCompleted,
      enabledCategories: assetsStore.enabledCategories,
      total: workspaceSetupTotals.value.assets,
    }),
    workspaceSetupTotals.value.assets,
  ),
  setupItem(
    'liabilities',
    'request_quote',
    'dashboard.setup.liabilities',
    financialModuleSetupStatus({
      setupCompleted: liabilitiesStore.setupCompleted,
      enabledCategories: liabilitiesStore.enabledCategories,
      total: workspaceSetupTotals.value.liabilities,
    }),
    workspaceSetupTotals.value.liabilities,
  ),
  setupItem(
    'income',
    'payments',
    'dashboard.setup.income',
    financialModuleSetupStatus({
      setupCompleted: incomeStore.setupCompleted,
      enabledCategories: incomeStore.enabledCategories,
      total: workspaceSetupTotals.value.income,
    }),
    workspaceSetupTotals.value.income,
  ),
  setupItem(
    'expenses',
    'credit_card',
    'dashboard.setup.expenses',
    financialModuleSetupStatus({
      setupCompleted: expensesStore.setupCompleted,
      enabledCategories: expensesStore.enabledCategories,
      total: workspaceSetupTotals.value.expenses,
    }),
    workspaceSetupTotals.value.expenses,
  ),
])
const showSetup = computed(
  () => !setupLoading.value && setupItems.value.some(({ completed }) => !completed),
)
const financialPositionReady = computed(() => setupItemsReady(['assets', 'liabilities']))
const cashFlowReady = computed(() => setupItemsReady(['income', 'expenses']))
const setupComplete = computed(() => financialPositionReady.value && cashFlowReady.value)
const quickLinkCandidates = computed(() => [
  ...generalQuickLinks(),
  ...categoryQuickLinks(),
  ...investmentPortfolioQuickLinks(),
  ...mortgageQuickLinks(),
])
watch(workspaceId, loadDashboard, { immediate: true })

const greeting = computed(() => {
  const selectedMember = members.value.find((member) => member.id === selectedMemberId.value)
  const fallbackMember = members.value.find((member) => member.id === authUser.value?.uid)
  const name = firstName(
    displayNameForMember(selectedMember?.id) ||
      displayNameForMember(fallbackMember?.id) ||
      authUser.value?.displayName,
  )

  if (!name) return t('dashboard.greeting.fallback')
  return t('dashboard.greeting.personalized', { name })
})

function firstName(name = '') {
  const normalized = String(name).trim()
  if (!normalized || normalized.includes('@') || normalized.toLowerCase() === 'member') return ''
  const value = normalized.split(/\s+/)[0]
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : ''
}

function displayNameForMember(memberId) {
  return memberId ? workspace.value?.members?.[memberId]?.displayName || '' : ''
}

function openSection(section) {
  router.push({ name: section, params: { workspaceId: route.params.workspaceId } })
}

function generalQuickLinks() {
  const assetsGroup = t('dashboard.quickLinks.groups.assets')
  const liabilitiesGroup = t('dashboard.quickLinks.groups.liabilities')
  const incomeGroup = t('dashboard.quickLinks.groups.income')
  const expensesGroup = t('dashboard.quickLinks.groups.expenses')
  const planGroup = t('dashboard.quickLinks.groups.plan')
  const progressGroup = t('dashboard.quickLinks.groups.progress')
  const settingsGroup = t('dashboard.quickLinks.groups.settings')
  return [
    quickLink('assets', 'inventory_2', 'dashboard.quickLinks.destinations.assets', [assetsGroup]),
    quickLink('liabilities', 'account_balance', 'dashboard.quickLinks.destinations.liabilities', [
      liabilitiesGroup,
    ]),
    quickLink('income', 'payments', 'dashboard.quickLinks.destinations.income', [incomeGroup]),
    quickLink('expenses', 'receipt_long', 'dashboard.quickLinks.destinations.expenses', [
      expensesGroup,
    ]),
    quickLink('expense-tracker', 'add_card', 'dashboard.quickLinks.destinations.expenseTracker', [
      expensesGroup,
    ]),
    quickLink('plan', 'track_changes', 'dashboard.quickLinks.destinations.plan', [planGroup]),
    quickLink('what-if', 'tune', 'dashboard.quickLinks.destinations.whatIf', [planGroup]),
    quickLink('what-if-strategy', 'route', 'dashboard.quickLinks.destinations.strategy', [
      planGroup,
    ]),
    quickLink('progress', 'monitoring', 'dashboard.quickLinks.destinations.progress', [
      progressGroup,
    ]),
    quickLink('achievements', 'emoji_events', 'dashboard.quickLinks.destinations.achievements', [
      progressGroup,
    ]),
    quickLink('setup', 'settings', 'dashboard.quickLinks.destinations.setup', [settingsGroup]),
  ]
}

function categoryQuickLinks() {
  return [
    ...enabledCategoryLinks(
      assetCategories,
      assetsStore.enabledCategories,
      'asset-category',
      'dashboard.quickLinks.groups.assets',
    ),
    ...enabledCategoryLinks(
      liabilityCategories,
      liabilitiesStore.enabledCategories,
      'liability-category',
      'dashboard.quickLinks.groups.liabilities',
    ),
    ...enabledCategoryLinks(
      incomeCategories,
      incomeStore.enabledCategories,
      'income-category',
      'dashboard.quickLinks.groups.income',
    ),
    ...enabledCategoryLinks(
      expenseCategories,
      expensesStore.enabledCategories,
      'expense-category',
      'dashboard.quickLinks.groups.expenses',
    ),
  ]
}

function enabledCategoryLinks(categories, enabledIds, routeName, groupKey) {
  const enabled = new Set(enabledIds)
  return categories
    .filter(({ id }) => enabled.has(id))
    .map((category) => {
      const nestedGroup = categoryNestedGroup(routeName, category.id)
      return {
        id: `${routeName}:${category.id}`,
        label: nestedGroup
          ? t('dashboard.quickLinks.categoryOverview', { name: nestedGroup })
          : t(category.nameKey),
        icon: category.icon,
        path: nestedGroup ? [t(groupKey), nestedGroup] : [t(groupKey)],
        to: {
          name: routeName,
          params: { workspaceId: workspaceId.value, category: category.id },
        },
      }
    })
}

function investmentPortfolioQuickLinks() {
  return assetsStore.itemsForCategory('investment').map((asset) => {
    const name = itemName(asset, 'assets.subtypes', 'dashboard.quickLinks.destinations.investment')
    return {
      id: `investment-portfolio:${asset.id}`,
      label: t('dashboard.quickLinks.portfolioLabel', { name }),
      treeLabel: t('dashboard.quickLinks.destinations.portfolio'),
      icon: 'show_chart',
      path: [
        t('dashboard.quickLinks.groups.assets'),
        t('dashboard.quickLinks.groups.investments'),
        name,
      ],
      to: {
        name: 'investment-portfolio',
        params: { workspaceId: workspaceId.value, assetId: asset.id },
      },
    }
  })
}

function mortgageQuickLinks() {
  return liabilitiesStore.itemsForCategory('mortgage').map((liability) => {
    const name = itemName(
      liability,
      'liabilities.categories',
      'dashboard.quickLinks.destinations.mortgage',
    )
    return {
      id: `mortgage-detail:${liability.id}`,
      label: name,
      treeLabel: t('dashboard.quickLinks.destinations.mortgageDetails'),
      icon: 'house_siding',
      path: [
        t('dashboard.quickLinks.groups.liabilities'),
        t('dashboard.quickLinks.groups.mortgages'),
        name,
      ],
      to: {
        name: 'mortgage-detail',
        params: { workspaceId: workspaceId.value, liabilityId: liability.id },
      },
    }
  })
}

function categoryNestedGroup(routeName, categoryId) {
  if (routeName === 'asset-category' && categoryId === 'investment') {
    return t('dashboard.quickLinks.groups.investments')
  }
  if (routeName === 'liability-category' && categoryId === 'mortgage') {
    return t('dashboard.quickLinks.groups.mortgages')
  }
  return null
}

function quickLink(routeName, icon, labelKey, path) {
  return {
    id: `route:${routeName}`,
    label: t(labelKey),
    icon,
    path,
    to: { name: routeName, params: { workspaceId: workspaceId.value } },
  }
}

function itemName(item, subtypeNamespace, fallbackKey) {
  if (String(item?.itemName || '').trim()) return item.itemName.trim()
  if (item?.subcategoryId) return t(`${subtypeNamespace}.${item.subcategoryId}`)
  return t(fallbackKey)
}

function setupItem(key, icon, translationKey, status, total) {
  return {
    key,
    icon,
    title: t(`${translationKey}.title`),
    description: t(`${translationKey}.description`),
    status,
    completed: status === 'ready' || status === 'not-applicable',
    total,
    to: { name: key, params: { workspaceId: workspaceId.value } },
  }
}

function setupItemsReady(keys) {
  return (
    !setupLoading.value &&
    keys.every((key) => setupItems.value.find((item) => item.key === key)?.completed)
  )
}

async function loadDashboard(id) {
  setupLoading.value = true
  await Promise.allSettled([
    milestonesStore.load(id),
    assetsStore.loadCategory(id, 'investment'),
    liabilitiesStore.loadCategory(id, 'mortgage'),
    incomeStore.loadConfig(id),
    expensesStore.loadConfig(id),
    whatIfStore.load(id),
  ])
  if (id === workspaceId.value) setupLoading.value = false
}

function strategyCashOutcome(strategy, horizonYears) {
  return t('plan.outcomes.inYears', {
    amount: formatCurrency(strategy.cash),
    years: horizonYears,
  })
}

function debtOutcome(payoff, hasDebt, debtName) {
  if (!hasDebt) return t('plan.outcomes.noDebt')
  if (!payoff?.accelerated?.payoffDate) return t('plan.outcomes.modelUnavailable')
  return t('plan.outcomes.paidOffNamed', {
    name: debtName || t('whatIf.debt.title'),
    date: formatMonthYear(payoff.accelerated.payoffDate),
  })
}

function periodIndex(period) {
  const [year, month] = String(period || '')
    .split('-')
    .map(Number)
  return year * 12 + month - 1
}

function signedCurrency(value) {
  return `${value >= 0 ? '+' : '−'}${formatCurrency(Math.abs(value || 0))}`
}

function formatYears(value) {
  return t('progress.yearsValue', {
    value: new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value || 0),
  })
}

function localToday() {
  if (isDemoWorkspaceId(workspaceId.value)) return DEMO_REFERENCE_DATE
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

function formatMonthYear(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function liabilityCategoryName(categoryId) {
  return t(getLiabilityCategory(categoryId)?.nameKey || 'whatIf.debt.title')
}
</script>

<style scoped lang="scss">
.workspace-dashboard-page {
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  padding: clamp(1.5rem, 3.5vw, 3rem);
  background: var(--color-page);
}

.dashboard-shell {
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(20rem, 1fr);
  gap: 1.15rem;
}

.financial-position-card {
  grid-column: 1 / -1;
}

.setup-guide {
  margin-bottom: 1.15rem;
}

@media (min-width: 1024px) {
  .workspace-dashboard-page {
    min-height: calc(100vh - 64px);
    min-height: calc(100dvh - 64px);
    padding: clamp(0.75rem, 1.8vh, 1.15rem) clamp(1rem, 2vw, 1.75rem);
  }

  .dashboard-shell {
    display: flex;
    flex-direction: column;
  }

  .dashboard-grid {
    grid-template-rows: auto auto;
    gap: clamp(0.65rem, 1.4vh, 0.9rem);
  }

  .dashboard-grid > * {
    min-height: 0;
  }

  .workspace-dashboard-page:has(.setup-guide) {
    min-height: calc(100dvh - 64px);
  }
}

@media (max-width: 1023px) {
  .workspace-dashboard-page {
    min-height: calc(100vh - 56px);
    min-height: calc(100dvh - 56px - env(safe-area-inset-top));
    padding-top: max(1.25rem, env(safe-area-inset-top));
    padding-right: max(1rem, env(safe-area-inset-right));
    padding-bottom: calc(var(--mobile-nav-height) + max(1.5rem, env(safe-area-inset-bottom)));
    padding-left: max(1rem, env(safe-area-inset-left));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .financial-position-card {
    grid-column: auto;
  }

  .plan-summary {
    display: none;
  }
}

@media (max-width: 699px) {
  .dashboard-grid {
    gap: 1rem;
  }
}

@media (max-width: 430px) {
  .workspace-dashboard-page {
    padding-right: max(0.75rem, env(safe-area-inset-right));
    padding-left: max(0.75rem, env(safe-area-inset-left));
  }
}
</style>
