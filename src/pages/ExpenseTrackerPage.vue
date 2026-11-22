<template>
  <q-page class="tracker-page">
    <main class="tracker-shell">
      <div v-if="pageLoading" class="state">
        <q-spinner color="primary" size="2rem" />
        <span>{{ t('expenseTracker.loading') }}</span>
      </div>

      <section v-else-if="trackingStore.error || pageError" class="state">
        <q-icon name="cloud_off" size="2rem" />
        <h1>{{ t('expenseTracker.errors.loadTitle') }}</h1>
        <p>{{ t('expenseTracker.errors.load') }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          :label="t('common.retry')"
          @click="loadPage(true)"
        />
      </section>

      <template v-else>
        <ExpensesSectionNav :workspace-id="activeWorkspaceId" :active="tab">
          <template #header="{ openInfo }">
            <header class="tracker-header">
              <div class="tracker-heading">
                <q-btn
                  flat
                  dense
                  no-caps
                  color="grey-7"
                  icon="arrow_back"
                  :label="t('expenseTracker.backToExpenses')"
                  :to="expensesRoute"
                  class="back-button"
                />
                <div class="tracker-title-row">
                  <h1>{{ t('expenseTracker.title') }}</h1>
                  <q-btn
                    flat
                    round
                    dense
                    icon="info_outline"
                    color="primary"
                    class="expenses-title-info"
                    :aria-label="t('expenses.views.info.action')"
                    @click="openInfo"
                  />
                </div>
              </div>
            </header>
          </template>
        </ExpensesSectionNav>

        <section class="monthly-overview">
          <ExpenseMonthMetric
            v-model="period"
            class="month-metric"
            :label="t('expenseTracker.review.month')"
          />
          <div class="monthly-metric">
            <span>{{ t('expenseTracker.summary.spent') }}</span>
            <strong>{{ formatCurrency(monthlySpent) }}</strong>
          </div>
          <div class="monthly-metric">
            <span>{{ t('expenseTracker.summary.planned') }}</span>
            <strong>{{ formatCurrency(reviewModelTotal) }}</strong>
          </div>
          <div class="monthly-metric" :class="{ over: monthlyRemaining < 0 }">
            <span>{{ t('expenseTracker.summary.remaining') }}</span>
            <strong>{{ formatCurrency(monthlyRemaining) }}</strong>
          </div>
        </section>

        <ExpenseTrackingPanel
          v-if="tab === 'record'"
          :categories="enabledCategories"
          @add="openAdd"
        />

        <ExpenseReviewPanel
          v-else
          :groups="reviewGroups"
          :can-use-all-tracked="Boolean(categoriesWithTrackedItems.length)"
          :saving="decisionSaving"
          @view-group="openReviewGroup"
          @use-all-tracked="requestApplyAllTracked"
        />
      </template>
    </main>

    <ExpenseTrackingEntryDialog
      v-if="activeSubcategory"
      v-model="entryDialog"
      :subcategory="activeSubcategory"
      :item="editingItem"
      :expense-items="activeExpenseItems"
      :period="period"
      :members="members"
      :preferred-member-id="authUser?.uid"
      :saving="trackingStore.saving"
      @save="saveEntry"
    />

    <ExpenseReviewDialog
      v-model="reviewDialog"
      :group="activeReviewGroup"
      :subcategory="activeSubcategory"
      :period-label="periodLabel"
      :decision-options="decisionOptions"
      :draft-decisions="draftDecisions"
      :saving="decisionSaving"
      :has-changes="hasDraftChanges"
      :tracked-items="activeTrackedItems"
      :expense-breakdown="activeExpenseBreakdown"
      :tracked-total="activeTrackedTotal"
      :can-mutate="canMutateActiveSubcategory"
      @back="activeSubcategory = null"
      @open-subcategory="openSubcategory"
      @set-decision="setDraftDecision"
      @save="saveDraftDecisions"
      @edit-item="openEdit"
      @delete-item="requestDelete"
    />

    <AppConfirmDialog
      v-model="applyAllDialog"
      :title="t('expenseTracker.review.applyAllConfirm.title')"
      :message="
        t('expenseTracker.review.applyAllConfirm.description', {
          period: periodLabel,
        })
      "
      :cancel-label="t('common.cancel')"
      :confirm-label="t('expenseTracker.review.applyAllConfirm.action')"
      confirm-icon="done_all"
      persistent
      :loading="decisionSaving"
      @confirm="applyAllTracked"
    />

    <AppConfirmDialog
      v-model="deleteDialog"
      :title="t('expenseTracker.delete.title')"
      :message="t('expenseTracker.delete.description')"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('common.delete')"
      confirm-color="negative"
      :loading="trackingStore.saving"
      @confirm="deleteEntry"
    />
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ExpenseMonthMetric from '@/components/expenses/ExpenseMonthMetric.vue'
import ExpenseReviewDialog from '@/components/expenses/ExpenseReviewDialog.vue'
import ExpenseTrackingEntryDialog from '@/components/expenses/ExpenseTrackingEntryDialog.vue'
import ExpenseTrackingPanel from '@/components/expenses/ExpenseTrackingPanel.vue'
import ExpenseReviewPanel from '@/components/expenses/ExpenseReviewPanel.vue'
import ExpensesSectionNav from '@/components/expenses/ExpensesSectionNav.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import {
  expenseTrackingCategories,
  groupedExpenseTrackingCategories,
  reviewExpenseTrackingCategories,
} from '@/config/expense-tracking-categories'
import { resolveExpenseTrackingValue } from '@/domain/financial/expense-tracking'
import { FINANCIAL_YEAR_TIME_ZONE } from '../../functions/shared/positions/annual-projection.js'
import { normalizeNonNegativeMoneyOrNull } from '../../functions/shared/core/money.js'
import { authUser } from '@/services/auth'
import { useExpenseTrackingStore } from '@/stores/expense-tracking-store'
import { useExpensesStore } from '@/stores/expenses-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'

const $q = useQuasar()
const { t, locale } = useI18n()
const route = useRoute()
const trackingStore = useExpenseTrackingStore()
const expensesStore = useExpensesStore()
const financialYearsStore = useFinancialYearsStore()
const workspaceStore = useWorkspaceStore()
const tab = computed(() =>
  route.query.view === 'review' || route.query.mode === 'reconcile' ? 'review' : 'record',
)
const period = ref(currentPeriod())
const pageError = ref(null)
const preparing = ref(false)
const entryDialog = ref(false)
const reviewDialog = ref(false)
const deleteDialog = ref(false)
const applyAllDialog = ref(false)
const activeReviewGroupId = ref(null)
const activeSubcategory = ref(null)
const editingItem = ref(null)
const deletingItem = ref(null)
const decisionSaving = ref(false)
const draftDecisions = ref({})
let loadRequestId = 0

const activeWorkspaceId = computed(() => String(route.params.workspaceId))
const workspace = computed(
  () => workspaceStore.workspaces.find(({ id }) => id === activeWorkspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map(({ id }) => id))
const allExpenseItems = computed(() =>
  expensesStore.enabledCategories
    .flatMap((categoryId) => expensesStore.itemsForCategory(categoryId))
    .filter(({ entryMode }) => entryMode !== 'simple'),
)
const enabledCategories = computed(() => {
  const enabled = new Set(trackingStore.enabledSubcategories)
  return availableTrackingCategories.value.filter(({ id }) => enabled.has(id))
})
const availableTrackingCategories = computed(() => {
  const usedSubcategories = new Set(allExpenseItems.value.map(({ subcategoryId }) => subcategoryId))
  return expenseTrackingCategories.filter(({ id }) => usedSubcategories.has(id))
})
const activeExpenseItems = computed(() =>
  allExpenseItems.value.filter(
    ({ subcategoryId }) => subcategoryId === activeSubcategory.value?.id,
  ),
)
const activeTrackedItems = computed(() =>
  activeSubcategory.value ? trackingStore.itemsFor(activeSubcategory.value.id) : [],
)
const activeTrackedTotal = computed(() =>
  activeSubcategory.value ? trackingStore.totalFor(activeSubcategory.value.id) : 0,
)
const activeExpenseBreakdown = computed(() =>
  activeExpenseItems.value.map((item) => ({
    ...item,
    trackedTotal: trackingStore.totalForItem(activeSubcategory.value?.id, item.id),
  })),
)
const reviewGroups = computed(() =>
  groupedExpenseTrackingCategories(
    reviewExpenseTrackingCategories(
      enabledCategories.value.map(({ id }) => id),
      trackingStore.month,
    ),
  ).map((group) => ({
    ...group,
    subcategories: group.subcategories.map((subcategory) => ({
      ...subcategory,
      itemCount: trackingStore.itemsFor(subcategory.id).length,
      trackedTotal: trackingStore.totalFor(subcategory.id),
      modelValue: modelValue(subcategory),
      decision: decisionFor(subcategory.id),
    })),
  })),
)
const activeReviewGroup = computed(
  () => reviewGroups.value.find(({ id }) => id === activeReviewGroupId.value) || null,
)
const hasDraftChanges = computed(() =>
  Boolean(
    activeReviewGroup.value?.subcategories.some(
      (subcategory) => draftDecisionFor(subcategory) !== subcategory.decision,
    ),
  ),
)
const reviewModelTotal = computed(() =>
  reviewGroups.value.reduce(
    (total, group) =>
      total + group.subcategories.reduce((groupTotal, item) => groupTotal + item.modelValue, 0),
    0,
  ),
)
const monthlySpent = computed(() => Number(trackingStore.month?.total || 0))
const monthlyRemaining = computed(() => reviewModelTotal.value - monthlySpent.value)
const canMutateActiveSubcategory = computed(() => isTrackingEnabled(activeSubcategory.value?.id))
const categoriesWithTrackedItems = computed(() =>
  enabledCategories.value.filter(({ id }) => trackingStore.itemsFor(id).length),
)
const pageLoading = computed(() => preparing.value || trackingStore.loading)
const expensesRoute = computed(() => ({
  name: 'expenses',
  params: { workspaceId: activeWorkspaceId.value },
}))
const selectedYear = computed(() => Number(period.value.slice(0, 4)))
const financialYear = computed(() =>
  financialYearsStore.get(activeWorkspaceId.value, selectedYear.value),
)
const decisionOptions = computed(() => [
  { label: t('expenseTracker.review.useTracked'), value: 'tracked' },
  { label: t('expenseTracker.review.keepModel'), value: 'model' },
  { label: t('expenseTracker.review.addBoth'), value: 'combined' },
])
const periodLabel = computed(() => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period.value)) return ''
  const [year, month] = period.value.split('-').map(Number)
  return new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
})

watch(
  [activeWorkspaceId, period],
  ([workspaceId, selectedPeriod]) => {
    if (workspaceId && /^\d{4}-(0[1-9]|1[0-2])$/.test(selectedPeriod)) loadPage()
  },
  { immediate: true },
)
watch(activeWorkspaceId, () => {
  period.value = currentPeriod()
})

async function loadPage(force = false) {
  const requestId = ++loadRequestId
  preparing.value = true
  pageError.value = null
  try {
    await Promise.all([
      // Always refresh the selected month so entries and decisions stay current.
      trackingStore.load(activeWorkspaceId.value, period.value, true),
      financialYearsStore.load(activeWorkspaceId.value, selectedYear.value, force),
      expensesStore.loadConfig(activeWorkspaceId.value, force),
    ])
    if (requestId !== loadRequestId) return
    await Promise.all(
      expensesStore.enabledCategories.map((categoryId) =>
        expensesStore.loadCategory(activeWorkspaceId.value, categoryId),
      ),
    )
  } catch (error) {
    if (requestId === loadRequestId) pageError.value = error
  } finally {
    if (requestId === loadRequestId) preparing.value = false
  }
}

function openAdd(subcategory) {
  if (!subcategory) return
  activeSubcategory.value = subcategory
  editingItem.value = null
  entryDialog.value = true
}

function openEdit(item) {
  if (!canMutateActiveSubcategory.value) return
  editingItem.value = item
  reviewDialog.value = false
  entryDialog.value = true
}

function isTrackingEnabled(subcategoryId) {
  return trackingStore.enabledSubcategories.includes(subcategoryId)
}

function openReviewGroup(group) {
  activeReviewGroupId.value = group.id
  activeSubcategory.value = null
  editingItem.value = null
  draftDecisions.value = Object.fromEntries(
    group.subcategories.map((subcategory) => [subcategory.id, subcategory.decision]),
  )
  reviewDialog.value = true
}

function openSubcategory(subcategory) {
  activeSubcategory.value = subcategory
  editingItem.value = null
}

function draftDecisionFor(subcategory) {
  return draftDecisions.value[subcategory.id] || subcategory.decision
}

function setDraftDecision(subcategory, decision) {
  draftDecisions.value = { ...draftDecisions.value, [subcategory.id]: decision }
}

async function saveDraftDecisions() {
  if (!activeReviewGroup.value || !hasDraftChanges.value || decisionSaving.value) return
  const decisions = Object.fromEntries(
    activeReviewGroup.value.subcategories
      .filter((subcategory) => draftDecisionFor(subcategory) !== subcategory.decision)
      .map((subcategory) => [subcategory.id, draftDecisionFor(subcategory)]),
  )
  decisionSaving.value = true
  try {
    await trackingStore.saveReconciliations(activeWorkspaceId.value, period.value, decisions)
    reviewDialog.value = false
    $q.notify({ type: 'positive', message: t('expenseTracker.sourcesUpdated'), position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: t('expenseTracker.errors.sourceSave'), position: 'top' })
  } finally {
    decisionSaving.value = false
  }
}

async function saveEntry(payload) {
  const itemId = editingItem.value?.id
  const saved = await persist(() =>
    itemId
      ? trackingStore.edit(
          activeWorkspaceId.value,
          period.value,
          activeSubcategory.value.id,
          itemId,
          payload,
          memberIds.value,
          allExpenseItems.value,
        )
      : trackingStore.add(
          activeWorkspaceId.value,
          period.value,
          activeSubcategory.value.id,
          payload,
          memberIds.value,
          allExpenseItems.value,
        ),
  )
  if (!saved) return
  entryDialog.value = false
  editingItem.value = null
}

function requestDelete(item) {
  deletingItem.value = item
  deleteDialog.value = true
}

async function deleteEntry() {
  if (!deletingItem.value || !activeSubcategory.value) return
  const saved = await persist(() =>
    trackingStore.remove(
      activeWorkspaceId.value,
      period.value,
      activeSubcategory.value.id,
      deletingItem.value.id,
    ),
  )
  if (saved) {
    deleteDialog.value = false
    deletingItem.value = null
  }
}

function modelValue(subcategory) {
  return resolvedValue(subcategory).model
}

function currentModelValue(subcategory) {
  return (
    normalizeNonNegativeMoneyOrNull(
      financialYear.value?.months?.[period.value.slice(5, 7)]?.expenses?.categories?.[
        subcategory.categoryId
      ]?.subcategories?.[subcategory.id]?.estimated,
    ) || 0
  )
}

function decisionFor(subcategoryId) {
  const subcategory = expenseTrackingCategories.find(({ id }) => id === subcategoryId)
  return subcategory ? resolvedValue(subcategory).source : 'model'
}

function reconciliationFor(subcategoryId) {
  return trackingStore.month?.reconciliation?.[subcategoryId] || null
}

function resolvedValue(subcategory) {
  const decision = reconciliationFor(subcategory.id)?.decision
  const hasActual =
    trackingStore.itemsFor(subcategory.id).length > 0 ||
    decision === 'tracked' ||
    decision === 'combined'
  return resolveExpenseTrackingValue(
    currentModelValue(subcategory),
    hasActual ? trackingStore.totalFor(subcategory.id) : null,
    decision,
  )
}

async function applyAllTracked() {
  if (decisionSaving.value) return
  decisionSaving.value = true
  try {
    const subcategoryIds = categoriesWithTrackedItems.value.map(({ id }) => id)
    await trackingStore.saveReconciliations(
      activeWorkspaceId.value,
      period.value,
      subcategoryIds,
      'tracked',
    )
    applyAllDialog.value = false
    $q.notify({ type: 'positive', message: t('expenseTracker.sourcesUpdated'), position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: t('expenseTracker.errors.sourceSave'), position: 'top' })
  } finally {
    decisionSaving.value = false
  }
}

function requestApplyAllTracked() {
  if (!categoriesWithTrackedItems.value.length || decisionSaving.value) return
  applyAllDialog.value = true
}

async function persist(operation, notify = true) {
  try {
    await operation()
    if (notify) {
      $q.notify({ type: 'positive', message: t('expenseTracker.saved'), position: 'top' })
    }
    return true
  } catch {
    $q.notify({ type: 'negative', message: t('expenseTracker.errors.save'), position: 'top' })
    return false
  }
}

function currentPeriod() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: FINANCIAL_YEAR_TIME_ZONE,
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}`
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.tracker-page {
  @include financial-page;
}

.tracker-shell {
  @include financial-shell(wide);
}

.tracker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.tracker-header {
  @include financial-header;
  align-items: center;
}

.tracker-title-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.back-button {
  @include financial-back-button;
}

h1 {
  @include financial-title;
}

.state {
  display: grid;
  min-height: 18rem;
  place-content: center;
  justify-items: center;
  text-align: center;
}

.state p {
  color: var(--color-copy);
}

.monthly-overview {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  align-items: center;
  gap: 1.1rem 0;
  margin-top: 1.25rem;
  padding: 1.35rem 1.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.monthly-overview .month-metric {
  grid-column: 1 / 4;
  grid-row: 1;
  padding: 0;
  border-left: 0;
}

.monthly-overview .month-metric :deep(.metric-label) {
  display: none;
}

.monthly-overview .month-metric :deep(.metric-value) {
  justify-content: flex-start;
  gap: 0.7rem;
}

.monthly-overview .month-metric :deep(.metric-value strong) {
  font-size: 1.65rem;
  letter-spacing: -0.025em;
}

.monthly-overview .month-metric :deep(.metric-value .q-icon) {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.monthly-metric {
  display: grid;
  grid-row: 2;
  min-width: 0;
  padding: 0.35rem 1.25rem;
  border-left: 1px solid var(--color-line);
}

.monthly-overview .monthly-metric:nth-of-type(1) {
  grid-column: 1 / 3;
  border-left: 0;
}

.monthly-overview .monthly-metric:nth-of-type(2) {
  grid-column: 3 / 5;
}

.monthly-overview .monthly-metric:nth-of-type(3) {
  grid-column: 5 / 7;
}

.monthly-metric span {
  color: var(--color-copy);
  font-size: 0.82rem;
}

.monthly-metric strong {
  margin-top: 0.2rem;
  color: var(--color-ink);
  font-size: 1.65rem;
  line-height: 1.1;
}

.monthly-metric:last-child strong {
  color: var(--color-success);
}

.monthly-metric.over strong {
  color: var(--color-danger);
}

@media (min-width: (bp.$md-max + 1px)) {
  .monthly-overview {
    grid-template-columns: minmax(15rem, 1.35fr) repeat(3, minmax(7rem, 0.65fr));
    gap: 0;
    padding: 0.85rem 1rem;
  }

  .monthly-overview .month-metric {
    grid-column: 1;
    grid-row: 1;
  }

  .monthly-overview .month-metric :deep(.metric-value) {
    gap: 0.75rem;
  }

  .monthly-overview .month-metric :deep(.metric-value strong) {
    font-size: 1.25rem;
  }

  .monthly-overview .month-metric :deep(.metric-value .q-icon) {
    order: -1;
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--color-blue-soft);
    font-size: 1.15rem;
  }

  .monthly-overview .monthly-metric {
    grid-row: 1;
    padding: 0.15rem 1.15rem;
  }

  .monthly-overview .monthly-metric:nth-of-type(1) {
    grid-column: 2;
    border-left: 1px solid var(--color-line);
  }

  .monthly-overview .monthly-metric:nth-of-type(2) {
    grid-column: 3;
  }

  .monthly-overview .monthly-metric:nth-of-type(3) {
    grid-column: 4;
  }

  .monthly-overview .monthly-metric strong {
    font-size: 1.25rem;
  }
}

@media (max-width: bp.$md-max) {
  .monthly-overview {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .monthly-metric {
    grid-column: auto;
    min-width: 0;
  }
}

@media (max-width: bp.$xs-max) {
  .tracker-page {
    padding-right: max(0.75rem, env(safe-area-inset-right));
    padding-bottom: calc(var(--mobile-nav-height) + 1.5rem);
    padding-left: max(0.75rem, env(safe-area-inset-left));
  }

  .monthly-overview {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 1rem 0;
    margin-top: 0.85rem;
    padding: 1rem 0.75rem 0.75rem;
  }

  .monthly-metric {
    grid-column: auto;
    min-width: 0;
    padding: 0.15rem 0.55rem;
    text-align: center;
  }

  .month-metric {
    padding-left: 0;
    border-left: 0;
  }

  .monthly-metric strong {
    overflow: hidden;
    font-size: 1.2rem;
    text-overflow: ellipsis;
  }

  .monthly-metric span {
    font-size: 0.7rem;
  }

  .monthly-overview .month-metric :deep(.metric-value strong) {
    font-size: 1.4rem;
    letter-spacing: -0.025em;
  }

  .tracker-header {
    align-items: flex-end;
    gap: 0.75rem;
  }
}
</style>
