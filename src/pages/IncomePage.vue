<template>
  <q-page class="income-page">
    <main class="income-shell">
      <div v-if="pageLoading" class="state">
        <q-spinner color="primary" size="2rem" /><span>{{ t('income.loading') }}</span>
      </div>
      <section v-else-if="incomeStore.error || financialYearError" class="state">
        <q-icon name="cloud_off" size="2rem" />
        <h1>{{ t('income.errors.loadTitle') }}</h1>
        <p>{{ t('income.errors.load') }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          :label="t('common.retry')"
          @click="loadPage(true)"
        />
      </section>
      <IncomeCategorySetup
        v-else-if="!incomeStore.setupCompleted"
        :saving="saving"
        @save="completeSetup"
      />
      <template v-else>
        <AppPageHeader
          :title="t('income.title')"
          :back-label="t('navigation.backToWorkspaceHome')"
          :back-to="workspaceHomeRoute"
        />
        <FinancialOverviewCard
          tone="income"
          icon="payments"
          :label="t('income.totalIncome')"
          :formatted-total="formatCurrency(total)"
          :secondary-value="formatCurrency(total / 12)"
          :secondary-label="t('income.overview.averagePerMonth')"
          :comparison-label="t('income.availableIncome')"
          :comparison-value="formatCurrency(availableIncome)"
          :comparison-help="t('income.availableIncomeDescription')"
          :scope-label="scopeLabel"
          :chart-title="t('income.overview.breakdownTitle')"
          :total-label="t('dashboard.year')"
          :empty-label="t('income.overview.breakdownEmpty')"
          :entries="breakdownEntries"
        />
        <section class="category-list" :aria-label="t('income.enabledCategories')">
          <div class="mobile-table-period">
            <AppPeriodSwitch
              v-model="tablePeriod"
              variant="light"
              size="small"
              :options="tablePeriodOptions"
              :aria-label="t('dashboard.costOfLife.period')"
            />
          </div>
          <div class="category-table-heading" aria-hidden="true">
            <span>{{ t('income.overview.category') }}</span>
            <span class="annual-heading">{{ t('income.overview.annualAmount') }}</span>
            <span class="monthly-heading">{{ t('income.overview.monthlyAverage') }}</span>
            <span class="mobile-amount-heading">{{ tableAmountHeading }}</span>
          </div>
          <div class="category-rows">
            <div
              v-for="category in enabledCategories"
              :key="category.id"
              class="category-row"
              role="link"
              tabindex="0"
              @click="openCategory(category.id)"
              @keydown.enter.self="openCategory(category.id)"
              @keydown.space.self.prevent="openCategory(category.id)"
            >
              <div class="category-main">
                <span class="category-icon"><q-icon :name="category.icon" /></span>
                <span class="category-copy">
                  <strong>{{ t(category.nameKey) }}</strong>
                  <small>{{ categoryStatus(category.id) }}</small>
                </span>
              </div>
              <SimpleValueEditor
                :value="categoryTableValue(category.id)"
                :formatted-value="formatCurrency(categoryTableValue(category.id))"
                :formatted-period="t(tablePeriodKey)"
                :saving="isCategorySaving(category.id)"
                :disabled="!canQuickEdit(category.id)"
                :aria-label="
                  t('income.quickEdit.editLabel', {
                    category: t(category.nameKey),
                    value: formatCurrency(categoryAnnualValue(category.id)),
                  })
                "
                :title="t('income.quickEdit.title', { category: t(category.nameKey) })"
                :input-label="t('income.quickEdit.inputLabel')"
                :input-suffix="`/ ${t('dashboard.year')}`"
                :invalid-message="t('income.quickEdit.invalid')"
                @click="handleValueClick($event, category.id)"
                @save="saveSimpleIncome(category, $event)"
              />
              <span class="category-monthly">
                <strong>{{ formatCurrency(categoryAnnualValue(category.id) / 12) }}</strong>
                <small>/ {{ t('dashboard.month') }}</small>
              </span>
              <q-btn flat round dense icon="more_vert" color="grey-7" @click.stop>
                <q-menu>
                  <q-list dense>
                    <q-item clickable v-close-popup @click="openCategory(category.id)">
                      <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                      <q-item-section>{{ t('income.overview.viewDetails') }}</q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      class="text-negative"
                      @click="requestCategoryDelete(category)"
                    >
                      <q-item-section avatar><q-icon name="delete_outline" /></q-item-section>
                      <q-item-section>{{ t('common.delete') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>

          <footer class="category-actions">
            <q-btn
              flat
              no-caps
              icon="tune"
              color="primary"
              :label="t('income.editCategories')"
              @click="editingCategories = true"
            />
          </footer>
        </section>
      </template>
    </main>

    <q-dialog v-model="editingCategories" :maximized="$q.screen.lt.sm"
      ><q-card class="category-dialog"
        ><q-btn
          flat
          round
          dense
          icon="close"
          class="dialog-close"
          :aria-label="t('common.cancel')"
          @click="editingCategories = false" /><IncomeCategorySetup
          edit-mode
          :initial-selected="incomeStore.enabledCategories"
          :saving="saving"
          @save="requestCategorySave"
          @cancel="editingCategories = false" /></q-card
    ></q-dialog>
    <AppConfirmDialog
      v-model="confirmDisable"
      :title="t('income.setup.disableTitle')"
      :message="t('income.setup.disableDescription')"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('income.setup.disableAction')"
      @confirm="savePendingCategories"
    />
    <AppConfirmDialog
      v-model="confirmCategoryDelete"
      :title="t('income.deleteCategory.title')"
      :message="
        t('income.deleteCategory.description', {
          name: deletingCategory ? t(deletingCategory.nameKey) : '',
        })
      "
      :cancel-label="t('common.cancel')"
      :confirm-label="t('common.delete')"
      confirm-color="negative"
      :loading="saving"
      @confirm="deleteCategory"
    />
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import SimpleValueEditor from '@/components/financial/SimpleValueEditor.vue'
import FinancialOverviewCard from '@/components/financial/FinancialOverviewCard.vue'
import IncomeCategorySetup from '@/components/income/IncomeCategorySetup.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppPeriodSwitch from '@/components/ui/AppPeriodSwitch.vue'
import { incomeCategories } from '@/config/income-categories'
import { CHART_SERIES_COLORS } from '@/config/chart-theme'
import {
  currentFinancialYear,
  financialYearAvailableIncomeValue,
  financialYearFlowCategoryValue,
  financialYearFlowValue,
} from '../../functions/shared/positions/annual-projection.js'
import {
  createEqualMemberOwnership,
  createSingleMemberOwnership,
} from '../../functions/shared/core/ownership.js'
import { authUser } from '@/services/auth'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useIncomeStore } from '@/stores/income-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const incomeStore = useIncomeStore()
const financialYearsStore = useFinancialYearsStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const saving = ref(false)
const loadingItems = ref(false)
const savingCategoryIds = ref(new Set())
const editingCategories = ref(false)
const confirmDisable = ref(false)
const confirmCategoryDelete = ref(false)
const deletingCategory = ref(null)
const pendingSelection = ref(null)
const tablePeriod = ref('annual')
const currentYear = currentFinancialYear()
const tablePeriodOptions = computed(() => [
  { label: t('dashboard.costOfLife.annual'), value: 'annual' },
  { label: t('dashboard.costOfLife.monthly'), value: 'monthly' },
])
const compactTable = computed(() => $q.screen.width <= 749)
const activeTablePeriod = computed(() => (compactTable.value ? tablePeriod.value : 'annual'))
const tablePeriodKey = computed(() =>
  activeTablePeriod.value === 'monthly' ? 'dashboard.month' : 'dashboard.year',
)
const tableAmountHeading = computed(() =>
  activeTablePeriod.value === 'monthly'
    ? t('income.overview.monthlyAverage')
    : t('income.overview.annualAmount'),
)
const workspaceId = computed(() => String(route.params.workspaceId))
const workspaceHomeRoute = computed(() => ({
  name: 'workspace-dashboard',
  params: { workspaceId: workspaceId.value },
}))
const workspace = computed(
  () => workspaceStore.workspaces.find((candidate) => candidate.id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map((member) => member.id))
const selectedMemberId = computed({
  get: () => scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
  set: (memberId) => scopeStore.select(workspaceId.value, memberId),
})
const financialYear = computed(() => financialYearsStore.get(workspaceId.value, currentYear))
const enabledCategories = computed(() =>
  incomeCategories
    .filter((category) => incomeStore.enabledCategories.includes(category.id))
    .sort((left, right) => categoryAnnualValue(right.id) - categoryAnnualValue(left.id)),
)
const financialYearError = computed(() =>
  financialYearsStore.errorFor(workspaceId.value, currentYear),
)
const pageLoading = computed(
  () =>
    loadingItems.value ||
    incomeStore.loading ||
    incomeStore.categoryLoading ||
    financialYearsStore.loading,
)
const total = computed(() =>
  financialYearFlowValue(financialYear.value, 'income', selectedMemberId.value),
)
const availableIncome = computed(() =>
  financialYearAvailableIncomeValue(financialYear.value, selectedMemberId.value),
)
const breakdownEntries = computed(() => {
  const entries = enabledCategories.value
    .map((category) => ({
      id: category.id,
      name: t(category.nameKey),
      value: categoryAnnualValue(category.id),
      color:
        CHART_SERIES_COLORS.categories[
          incomeCategories.findIndex(({ id }) => id === category.id) %
            CHART_SERIES_COLORS.categories.length
        ],
    }))
    .filter(({ value }) => value > 0)
  const chartTotal = entries.reduce((sum, entry) => sum + entry.value, 0)
  return entries.map((entry) => ({
    ...entry,
    percentage: chartTotal > 0 ? (entry.value / chartTotal) * 100 : 0,
  }))
})
const scopeLabel = computed(() =>
  selectedMemberId.value === 'all'
    ? t('dashboard.allMembers')
    : members.value.find((member) => member.id === selectedMemberId.value)?.name || '',
)
watch(workspaceId, () => loadPage(), { immediate: true })

async function loadPage(force = false) {
  loadingItems.value = true
  try {
    await Promise.allSettled([
      incomeStore.loadConfig(workspaceId.value, force),
      financialYearsStore.load(workspaceId.value, currentYear, force),
    ])
    for (const categoryId of incomeStore.enabledCategories) {
      await incomeStore.loadCategory(workspaceId.value, categoryId, force)
    }
  } finally {
    loadingItems.value = false
  }
}

async function completeSetup(selected) {
  await persist(() => incomeStore.completeSetup(workspaceId.value, selected, memberIds.value))
}
function requestCategorySave(selected) {
  const removedWithData = incomeStore.enabledCategories.some(
    (id) => !selected.includes(id) && categoryHasData(id),
  )
  if (removedWithData) {
    pendingSelection.value = selected
    confirmDisable.value = true
  } else saveCategorySelection(selected)
}
async function savePendingCategories() {
  confirmDisable.value = false
  await saveCategorySelection(pendingSelection.value)
  pendingSelection.value = null
}
async function saveCategorySelection(selected) {
  const saved = await persist(() =>
    incomeStore.saveCategorySelection(workspaceId.value, selected, memberIds.value),
  )
  if (saved) editingCategories.value = false
}
function requestCategoryDelete(category) {
  deletingCategory.value = category
  confirmCategoryDelete.value = true
}
async function deleteCategory() {
  if (!deletingCategory.value || saving.value) return
  const saved = await persist(() =>
    incomeStore.deleteCategory(workspaceId.value, deletingCategory.value.id),
  )
  if (saved) {
    confirmCategoryDelete.value = false
    deletingCategory.value = null
  }
}
function categoryHasData(id) {
  return categoryAnnualValue(id) > 0
}
function categoryStatus(id) {
  if (simpleIncome(id)) return t('income.simpleTotal')
  const subcategories =
    financialYear.value?.months?.['01']?.income?.categories?.[id]?.subcategories || {}
  const count = Object.values(subcategories).reduce(
    (total, subcategory) => total + Object.keys(subcategory.items || {}).length,
    0,
  )
  return t('income.itemCount', { count })
}
function categoryItems(id) {
  return incomeStore.itemsForCategory(id)
}
function simpleIncome(id) {
  const items = categoryItems(id)
  return items.length === 1 && items[0].entryMode === 'simple' ? items[0] : null
}
function canQuickEdit(id) {
  const items = categoryItems(id)
  const editableScope = selectedMemberId.value === 'all' || memberIds.value.length === 1
  return editableScope && (items.length === 0 || Boolean(simpleIncome(id)))
}
function isCategorySaving(id) {
  return savingCategoryIds.value.has(id)
}
async function saveSimpleIncome(category, displayedValue) {
  if (isCategorySaving(category.id) || !canQuickEdit(category.id)) return

  const annualValue = activeTablePeriod.value === 'monthly' ? displayedValue * 12 : displayedValue
  const existing = simpleIncome(category.id)
  const payload = {
    ...(existing || {}),
    categoryId: category.id,
    subcategoryId: existing?.subcategoryId || category.subcategories[0],
    itemName: existing?.itemName || t(category.nameKey),
    notes: existing?.notes || '',
    calculation: simpleCalculation(category.calculationModes[0], annualValue),
    ownership:
      existing?.ownership ||
      (memberIds.value.length === 1
        ? createSingleMemberOwnership(memberIds.value[0])
        : createEqualMemberOwnership(memberIds.value)),
    entryMode: 'simple',
  }

  savingCategoryIds.value = new Set(savingCategoryIds.value).add(category.id)
  try {
    if (existing) {
      await incomeStore.editIncome(workspaceId.value, existing.id, payload, memberIds.value)
    } else {
      await incomeStore.addIncome(workspaceId.value, payload, memberIds.value)
    }
  } catch {
    $q.notify({ type: 'negative', message: t('income.errors.save'), position: 'top' })
  } finally {
    const next = new Set(savingCategoryIds.value)
    next.delete(category.id)
    savingCategoryIds.value = next
  }
}
function handleValueClick(event, categoryId) {
  if (canQuickEdit(categoryId)) event.stopPropagation()
}
function simpleCalculation(mode, annualValue) {
  if (mode === 'annual_salary') return { mode, annualAmount: annualValue, paymentsPerYear: 12 }
  if (mode === 'monthly_schedule') {
    return { mode, monthlyAmount: annualValue / 12, extrasByMonth: {} }
  }
  if (mode === 'one_time') return { mode, amount: annualValue, month: 'january' }
  return { mode: 'recurring', amount: annualValue, frequency: 'yearly' }
}
function categoryAnnualValue(id) {
  return financialYearFlowCategoryValue(financialYear.value, 'income', id, selectedMemberId.value)
}
function categoryTableValue(id) {
  const annualValue = categoryAnnualValue(id)
  return activeTablePeriod.value === 'monthly' ? annualValue / 12 : annualValue
}
function openCategory(id) {
  router.push({ name: 'income-category', params: { workspaceId: workspaceId.value, category: id } })
}
async function persist(action) {
  saving.value = true
  try {
    await action()
    return true
  } catch {
    $q.notify({ type: 'negative', message: t('income.errors.save'), position: 'top' })
    return false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.income-page {
  @include financial-page;
}

.income-shell {
  @include financial-shell(wide);
}

.state {
  display: grid;
  place-items: center;
  gap: 0.75rem;
  min-height: 24rem;
  text-align: center;
  color: var(--color-copy);
}
.state h1,
.state p {
  margin: 0;
}

@include financial-overview-list(minmax(13rem, 1fr) 10rem 9rem 5rem);

.mobile-table-period,
.mobile-amount-heading {
  display: none;
}

.category-icon {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}

.category-monthly {
  display: grid;
  justify-items: end;
  text-align: right;
  white-space: nowrap;
}

.category-monthly strong,
.category-row :deep(.simple-value .value-copy strong) {
  color: var(--color-ink);
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
}

.category-monthly small,
.category-row :deep(.simple-value .value-copy small) {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 400;
}

.category-dialog {
  @include financial-category-dialog-card;
}

@media (max-width: bp.$overview-stack-max) {
  .mobile-table-period {
    display: flex;
    justify-content: flex-end;
    padding: 0.55rem 0.65rem 0;
  }

  .mobile-table-period :deep(.app-period-switch) {
    --app-period-option-min-width: 4.5rem;
  }

  .category-table-heading {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }

  .annual-heading,
  .monthly-heading {
    display: none;
  }

  .mobile-amount-heading {
    display: inline;
    grid-column: 2;
  }

  .category-monthly {
    display: none;
  }
}
</style>
