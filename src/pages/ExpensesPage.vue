<template>
  <q-page class="expenses-page">
    <main class="expenses-shell">
      <div v-if="pageLoading" class="state">
        <q-spinner color="primary" size="2rem" />
        <span>{{ t('expenses.loading') }}</span>
      </div>

      <section v-else-if="expensesStore.error || financialYearError" class="state">
        <q-icon name="cloud_off" size="2rem" />
        <h1>{{ t('expenses.errors.loadTitle') }}</h1>
        <p>{{ t('expenses.errors.load') }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          :label="t('common.retry')"
          @click="loadPage(true)"
        />
      </section>

      <ExpenseCategorySetup
        v-else-if="!expensesStore.setupCompleted"
        :saving="saving"
        @save="completeSetup"
      />

      <template v-else>
        <AppPageHeader
          inline-actions
          :title="t('expenses.title')"
          :back-label="t('navigation.backToWorkspaceHome')"
          :back-to="workspaceHomeRoute"
        >
          <template #actions>
            <nav class="context-actions header-actions" :aria-label="t('expenses.overview.tools')">
              <router-link :to="trackerRoute" class="tracker-chip">
                <q-icon name="receipt_long" />
                <strong>{{ t('expenses.overview.tracker') }}</strong>
              </router-link>
            </nav>
          </template>
        </AppPageHeader>

        <FinancialOverviewCard
          tone="expenses"
          icon="account_balance_wallet"
          :label="t('expenses.overview.annualCost')"
          :formatted-total="formatCurrency(totals.annualCostOfLife)"
          :secondary-value="formatCurrency(totals.monthlyCostOfLife)"
          :secondary-label="t('expenses.overview.averagePerMonth')"
          :scope-label="scopeLabel"
          :chart-title="t('expenses.overview.breakdownTitle')"
          :total-label="t('dashboard.year')"
          :empty-label="t('expenses.overview.breakdownEmpty')"
          :entries="breakdownEntries"
        />

        <section class="category-list" :aria-label="t('expenses.enabledCategories')">
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
            <span>{{ t('expenses.overview.category') }}</span>
            <span class="annual-heading">{{ t('expenses.overview.annualAmount') }}</span>
            <span class="monthly-heading">{{ t('expenses.overview.monthlyAmount') }}</span>
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
                  t('expenses.quickEdit.editLabel', {
                    category: t(category.nameKey),
                    value: formatCurrency(categoryAnnualValue(category.id)),
                  })
                "
                :title="t('expenses.quickEdit.simpleTitle', { category: t(category.nameKey) })"
                :input-label="t('expenses.quickEdit.inputLabel')"
                :input-suffix="`/ ${t('dashboard.year')}`"
                :invalid-message="t('expenses.quickEdit.invalid')"
                @click="handleValueClick($event, category.id)"
                @save="saveSimpleExpense(category, $event)"
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
                      <q-item-section>{{ t('expenses.overview.viewDetails') }}</q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      class="text-negative"
                      @click="requestDelete(category)"
                    >
                      <q-item-section avatar><q-icon name="delete_outline" /></q-item-section>
                      <q-item-section>{{ t('common.delete') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>

          <div class="category-actions">
            <q-btn
              flat
              no-caps
              icon="tune"
              color="primary"
              :label="t('expenses.editCategories')"
              :loading="loadingCategoryEditor"
              @click="openCategoryEditor"
            />
          </div>
        </section>
      </template>
    </main>

    <q-dialog v-model="editingCategories" :maximized="$q.screen.lt.sm">
      <q-card class="category-dialog">
        <q-btn
          flat
          round
          dense
          icon="close"
          class="dialog-close"
          :aria-label="t('common.cancel')"
          @click="editingCategories = false"
        />
        <ExpenseCategorySetup
          edit-mode
          :initial-selected="expensesStore.enabledCategories"
          :initial-selected-subcategories="selectedSubcategoryIds"
          :saving="saving"
          @save="requestCategorySave"
          @cancel="editingCategories = false"
        />
      </q-card>
    </q-dialog>

    <AppConfirmDialog
      v-model="confirmDisable"
      :title="t('expenses.setup.disableTitle')"
      :message="t('expenses.setup.disableDescription')"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('expenses.setup.disableAction')"
      :loading="saving"
      @confirm="savePendingCategories"
    />

    <AppConfirmDialog
      v-model="deleteDialog"
      :title="t('expenses.deleteCategory.title')"
      :message="
        t('expenses.deleteCategory.description', {
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
import ExpenseCategorySetup from '@/components/expenses/ExpenseCategorySetup.vue'
import FinancialOverviewCard from '@/components/financial/FinancialOverviewCard.vue'
import SimpleValueEditor from '@/components/financial/SimpleValueEditor.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppPeriodSwitch from '@/components/ui/AppPeriodSwitch.vue'
import { expenseCategories } from '@/config/expense-categories'
import { CHART_COLORS, CHART_SERIES_COLORS } from '@/config/chart-theme'
import {
  currentFinancialYear,
  financialYearFlowCategoryValue,
  financialYearFlowValue,
} from '../../functions/shared/positions/annual-projection.js'
import {
  createEqualMemberOwnership,
  createSingleMemberOwnership,
} from '../../functions/shared/core/ownership.js'
import { authUser } from '@/services/auth'
import { useExpensesStore } from '@/stores/expenses-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const expensesStore = useExpensesStore()
const financialYearsStore = useFinancialYearsStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const saving = ref(false)
const loadingItems = ref(false)
const loadingCategoryEditor = ref(false)
const savingCategoryIds = ref(new Set())
const editingCategories = ref(false)
const confirmDisable = ref(false)
const pendingSelection = ref(null)
const deleteDialog = ref(false)
const deletingCategory = ref(null)
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
    ? t('expenses.overview.monthlyAmount')
    : t('expenses.overview.annualAmount'),
)

const workspaceId = computed(() => String(route.params.workspaceId))
const workspaceHomeRoute = computed(() => ({
  name: 'workspace-dashboard',
  params: { workspaceId: workspaceId.value },
}))
const trackerRoute = computed(() => ({
  name: 'expense-tracker',
  params: { workspaceId: workspaceId.value },
  query: { view: 'record' },
}))
const workspace = computed(
  () => workspaceStore.workspaces.find((item) => item.id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map((member) => member.id))
const selectedMemberId = computed({
  get: () => scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
  set: (memberId) => scopeStore.select(workspaceId.value, memberId),
})
const financialYear = computed(() => financialYearsStore.get(workspaceId.value, currentYear))
const enabledCategories = computed(() =>
  expenseCategories
    .filter((category) => expensesStore.config?.categories?.[category.id]?.enabled)
    .sort((left, right) => categoryAnnualValue(right.id) - categoryAnnualValue(left.id)),
)
const selectedSubcategoryIds = computed(() => [
  ...new Set(
    expenseCategories.flatMap((category) =>
      expensesStore.itemsForCategory(category.id).map(({ subcategoryId }) => subcategoryId),
    ),
  ),
])
const financialYearError = computed(() =>
  financialYearsStore.errorFor(workspaceId.value, currentYear),
)
const totals = computed(() => ({
  annualCostOfLife: financialYearFlowValue(financialYear.value, 'expenses', selectedMemberId.value),
  monthlyCostOfLife:
    financialYearFlowValue(financialYear.value, 'expenses', selectedMemberId.value) / 12,
}))
const breakdownEntries = computed(() => {
  const entries = enabledCategories.value
    .map((category) => ({
      id: category.id,
      name: t(category.nameKey),
      value: categoryAnnualValue(category.id),
      color:
        CHART_SERIES_COLORS.categories[
          expenseCategories.findIndex(({ id }) => id === category.id) %
            CHART_SERIES_COLORS.categories.length
        ],
    }))
    .filter(({ value }) => value > 0)
  const categorizedTotal = entries.reduce((sum, entry) => sum + entry.value, 0)
  const unallocated = Math.max(0, totals.value.annualCostOfLife - categorizedTotal)
  if (unallocated > 0.01) {
    entries.push({
      id: 'unallocated',
      name: t('expenses.overview.unallocated'),
      value: unallocated,
      color: CHART_COLORS.mutedLight,
    })
  }
  const total = entries.reduce((sum, entry) => sum + entry.value, 0)
  return entries.map((entry) => ({
    ...entry,
    percentage: total > 0 ? (entry.value / total) * 100 : 0,
  }))
})
const pageLoading = computed(
  () =>
    loadingItems.value ||
    expensesStore.loading ||
    expensesStore.categoryLoading ||
    financialYearsStore.loading,
)
const scopeLabel = computed(() => {
  if (selectedMemberId.value === 'all') return t('dashboard.allMembers')
  return members.value.find((member) => member.id === selectedMemberId.value)?.name || ''
})

watch(workspaceId, () => loadPage(), { immediate: true })
watch(
  () => route.query.configure,
  async (configure) => {
    if (configure !== 'categories' || pageLoading.value) return
    await openCategoryEditor()
    await router.replace({ name: 'expenses', params: { workspaceId: workspaceId.value } })
  },
)

async function loadPage(force = false) {
  loadingItems.value = true
  try {
    await Promise.allSettled([
      expensesStore.loadConfig(workspaceId.value, force),
      financialYearsStore.load(workspaceId.value, currentYear, force),
    ])
    await Promise.allSettled(
      expensesStore.enabledCategories.map((categoryId) =>
        expensesStore.loadCategory(workspaceId.value, categoryId, force),
      ),
    )
  } finally {
    loadingItems.value = false
    if (route.query.configure === 'categories') {
      await openCategoryEditor()
      await router.replace({ name: 'expenses', params: { workspaceId: workspaceId.value } })
    }
  }
}

function categoryAnnualValue(categoryId) {
  return financialYearFlowCategoryValue(
    financialYear.value,
    'expenses',
    categoryId,
    selectedMemberId.value,
  )
}

function categoryTableValue(categoryId) {
  const annualValue = categoryAnnualValue(categoryId)
  return activeTablePeriod.value === 'monthly' ? annualValue / 12 : annualValue
}

function categoryStatus(categoryId) {
  if (simpleExpense(categoryId)) return t('expenses.simpleTotal')
  const subcategories =
    financialYear.value?.months?.['01']?.expenses?.categories?.[categoryId]?.subcategories || {}
  const count = Object.values(subcategories).reduce(
    (total, subcategory) => total + Object.keys(subcategory.items || {}).length,
    0,
  )
  const key = count === 1 ? 'expenses.itemName' : 'expenses.itemNamePlural'
  return t('expenses.itemSummary', { count, items: t(key) })
}

function categoryItems(categoryId) {
  return expensesStore.itemsForCategory(categoryId)
}

function simpleExpense(categoryId) {
  const items = categoryItems(categoryId)
  return items.length === 1 && items[0].entryMode === 'simple' ? items[0] : null
}

function canQuickEdit(categoryId) {
  const items = categoryItems(categoryId)
  const editableScope = selectedMemberId.value === 'all' || memberIds.value.length === 1
  return editableScope && (items.length === 0 || Boolean(simpleExpense(categoryId)))
}

function isCategorySaving(categoryId) {
  return savingCategoryIds.value.has(categoryId)
}

async function saveSimpleExpense(category, displayedValue) {
  if (isCategorySaving(category.id) || !canQuickEdit(category.id)) return

  const annualValue = activeTablePeriod.value === 'monthly' ? displayedValue * 12 : displayedValue
  const existing = simpleExpense(category.id)
  const defaultSubcategory = category.suggestions[0]
  const payload = {
    ...(existing || {}),
    categoryId: category.id,
    subcategoryId: existing?.subcategoryId || defaultSubcategory.id,
    itemName: existing?.itemName || t(category.nameKey),
    notes: existing?.notes || '',
    estimate: { amount: annualValue / 12, frequency: 'monthly' },
    monthlyAmounts: null,
    variability: 'variable',
    recurrence: 'recurring',
    necessity: null,
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
      await expensesStore.editExpense(workspaceId.value, existing.id, payload, memberIds.value)
    } else {
      await expensesStore.addExpense(workspaceId.value, payload, memberIds.value)
    }
  } catch {
    $q.notify({ type: 'negative', message: t('expenses.errors.save'), position: 'top' })
  } finally {
    const next = new Set(savingCategoryIds.value)
    next.delete(category.id)
    savingCategoryIds.value = next
  }
}

function openCategory(categoryId) {
  router.push({
    name: 'expense-category',
    params: { workspaceId: workspaceId.value, category: categoryId },
  })
}

function handleValueClick(event, categoryId) {
  if (canQuickEdit(categoryId)) event.stopPropagation()
}

async function openCategoryEditor() {
  if (loadingCategoryEditor.value) return
  loadingCategoryEditor.value = true
  try {
    await Promise.allSettled(
      Object.keys(expensesStore.config?.categories || {}).map((categoryId) =>
        expensesStore.loadCategory(workspaceId.value, categoryId),
      ),
    )
    editingCategories.value = true
  } finally {
    loadingCategoryEditor.value = false
  }
}

async function completeSetup(selected) {
  await runSaving(() => expensesStore.completeSetup(workspaceId.value, selected, memberIds.value))
}

function requestCategorySave(selection) {
  const selected = selection.categoryIds
  const removedWithData = expensesStore.enabledCategories.some(
    (categoryId) => !selected.includes(categoryId) && categoryHasData(categoryId),
  )
  if (removedWithData) {
    pendingSelection.value = selection
    confirmDisable.value = true
    return
  }
  saveCategorySelection(selection)
}

async function savePendingCategories() {
  confirmDisable.value = false
  await saveCategorySelection(pendingSelection.value)
  pendingSelection.value = null
}

async function saveCategorySelection(selection) {
  const saved = await runSaving(async () => {
    await expensesStore.saveCategorySelection(
      workspaceId.value,
      selection.categoryIds,
      memberIds.value,
    )
    await createSelectedSubcategoryExpenses(selection.subcategoryIds)
  })
  if (saved) editingCategories.value = false
}

async function createSelectedSubcategoryExpenses(subcategoryIds) {
  const ownership =
    memberIds.value.length === 1
      ? createSingleMemberOwnership(memberIds.value[0])
      : createEqualMemberOwnership(memberIds.value)

  for (const category of expenseCategories) {
    const existingSubcategoryIds = new Set(
      expensesStore.itemsForCategory(category.id).map(({ subcategoryId }) => subcategoryId),
    )
    for (const suggestion of category.suggestions) {
      if (!subcategoryIds.includes(suggestion.id) || existingSubcategoryIds.has(suggestion.id)) {
        continue
      }
      await expensesStore.addExpense(
        workspaceId.value,
        {
          categoryId: category.id,
          subcategoryId: suggestion.id,
          itemName: 'general',
          notes: '',
          estimate: { amount: 0, frequency: suggestion.defaults.frequency },
          monthlyAmounts: null,
          variability: suggestion.defaults.variability,
          recurrence: suggestion.defaults.recurrence,
          necessity: suggestion.defaults.necessity,
          ownership,
          entryMode: 'detailed',
        },
        memberIds.value,
      )
      existingSubcategoryIds.add(suggestion.id)
    }
  }
}

function categoryHasData(categoryId) {
  return categoryAnnualValue(categoryId) > 0
}

function requestDelete(category) {
  deletingCategory.value = category
  deleteDialog.value = true
}

async function deleteCategory() {
  if (!deletingCategory.value) return
  const saved = await runSaving(() =>
    expensesStore.deleteCategory(workspaceId.value, deletingCategory.value.id),
  )
  if (saved) {
    deleteDialog.value = false
    deletingCategory.value = null
  }
}

async function runSaving(operation) {
  if (saving.value) return false
  saving.value = true
  try {
    await operation()
    $q.notify({ type: 'positive', message: t('expenses.saved'), position: 'top' })
    return true
  } catch {
    $q.notify({ type: 'negative', message: t('expenses.errors.save'), position: 'top' })
    return false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.expenses-page {
  @include financial-page;
}

.expenses-shell {
  @include financial-shell(wide);
}

.state {
  display: grid;
  place-items: center;
  min-height: 50vh;
  text-align: center;
}

.state h1,
.state p {
  margin: 0.35rem;
}

@include financial-context-actions;
@include financial-overview-list(minmax(13rem, 1fr) 10rem 9rem 5rem);

.mobile-table-period,
.mobile-amount-heading {
  display: none;
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

.category-icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
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
