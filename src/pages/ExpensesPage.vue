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
          :title="t('expenses.title')"
          :back-label="t('navigation.backToWorkspaceHome')"
          :back-to="workspaceHomeRoute"
        >
          <template #actions>
            <nav class="context-actions header-actions" :aria-label="t('expenses.overview.tools')">
              <router-link :to="trackerRoute">
                <q-icon name="receipt_long" />
                <span
                  ><strong>{{ t('expenses.overview.tracker') }}</strong
                  ><small>{{ t('expenses.overview.trackerDescription') }}</small></span
                >
                <q-icon name="chevron_right" />
              </router-link>
            </nav>
          </template>
        </AppPageHeader>

        <section class="overview-card">
          <article class="overview-kpi">
            <span class="total-icon"><q-icon name="account_balance_wallet" /></span>
            <div class="total-copy">
              <span class="kpi-label">{{ t('expenses.overview.annualCost') }}</span>
              <strong>{{ formatCurrency(totals.annualCostOfLife) }}</strong>
              <div class="kpi-meta">
                <span class="monthly-average">
                  <b>{{ formatCurrency(totals.monthlyCostOfLife) }}</b>
                  {{ t('expenses.overview.averagePerMonth') }}
                </span>
                <span class="scope-label">{{ scopeLabel }}</span>
              </div>
            </div>
          </article>

          <ExpenseBreakdownChart
            :title="t('expenses.overview.breakdownTitle')"
            :total-label="t('dashboard.year')"
            :empty-label="t('expenses.overview.breakdownEmpty')"
            :entries="breakdownEntries"
            embedded
          />
        </section>

        <section class="category-list" :aria-label="t('expenses.enabledCategories')">
          <div class="category-table-heading" aria-hidden="true">
            <span>{{ t('expenses.overview.category') }}</span>
            <span>{{ t('expenses.overview.annualAmount') }}</span>
            <span>{{ t('expenses.overview.monthlyAmount') }}</span>
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
                :value="categoryAnnualValue(category.id)"
                :formatted-value="formatCurrency(categoryAnnualValue(category.id))"
                :formatted-period="t('dashboard.year')"
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
import ExpenseBreakdownChart from '@/components/expenses/ExpenseBreakdownChart.vue'
import ExpenseCategorySetup from '@/components/expenses/ExpenseCategorySetup.vue'
import SimpleValueEditor from '@/components/financial/SimpleValueEditor.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
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
const currentYear = currentFinancialYear()

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
const members = computed(() => getWorkspaceMembers(workspace.value, authUser.value))
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

  const annualValue = displayedValue
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

.overview-card {
  @include dashboard-card;
  display: grid;
  grid-template-columns: minmax(18rem, 0.72fr) minmax(30rem, 1.28fr);
  overflow: hidden;
  margin-top: var(--space-4);
}

.overview-kpi {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  min-width: 0;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border-right: 1px solid var(--color-line);
  background: var(--color-surface);
}

.total-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 50%;
  background: var(--color-red-soft);
  color: var(--color-financial-expenses);
  font-size: 1.7rem;
}

.total-copy {
  display: grid;
  min-width: 0;
}

.kpi-label {
  color: var(--color-copy);
  font-size: 0.95rem;
  font-weight: var(--font-weight-medium);
  letter-spacing: -0.01em;
}

.total-copy strong {
  margin: 0.35rem 0 0.7rem;
  color: var(--color-ink);
  font-size: clamp(3rem, 5vw, 4.35rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.kpi-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.monthly-average {
  color: var(--color-copy);
  font-size: 0.92rem;
}

.monthly-average b {
  color: var(--color-ink);
  font-size: 1.05rem;
  font-weight: var(--font-weight-bold);
}

.scope-label {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-copy);
  font-size: 0.72rem;
  font-weight: var(--font-weight-semibold);
}

.overview-card :deep(.breakdown-card) {
  min-height: 14rem;
}

.context-actions {
  display: flex;
  gap: var(--space-3);
}

.context-actions a {
  display: grid;
  grid-template-columns: auto minmax(8rem, 1fr) auto;
  align-items: center;
  gap: var(--space-2);
  min-width: 13.5rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-button);
  background: var(--color-surface);
  color: var(--color-ink);
  text-decoration: none;
  box-shadow: var(--shadow-control);
}

.context-actions a > .q-icon:first-child {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--color-red-soft);
  color: var(--color-financial-expenses);
  font-size: 1.1rem;
}

.context-actions span,
.context-actions strong,
.context-actions small {
  display: block;
}

.context-actions strong {
  font-size: 0.8rem;
}

.context-actions small {
  margin-top: 0.1rem;
  color: var(--color-muted);
  font-size: 0.68rem;
}

.context-actions a:focus-visible {
  @include focus-ring;
}

.category-list {
  @include dashboard-card;
  overflow: hidden;
  margin-top: var(--space-4);
  margin-bottom: 0.75rem;
}

.category-table-heading {
  display: grid;
  grid-template-columns: minmax(13rem, 1fr) 10rem 9rem 5rem;
  gap: 0.4rem;
  padding: 0.7rem 0.75rem;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-copy);
  font-size: 0.84rem;
  font-weight: var(--font-weight-semibold);
}

.category-table-heading span:not(:first-child) {
  text-align: right;
}

.category-row {
  display: grid;
  grid-template-columns: minmax(13rem, 1fr) 10rem 9rem 5rem;
  align-items: center;
  gap: 0.4rem;
  min-height: 5rem;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--color-line);
  cursor: pointer;
  transition: background-color 150ms ease;
}

.category-row:hover {
  background: var(--color-surface-soft);
}

.category-row:focus-visible {
  @include focus-ring;
  position: relative;
  z-index: 1;
}

.category-row:last-child {
  border-bottom: 0;
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

.category-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  padding: 0.8rem 0.75rem;
  border-top: 1px solid var(--color-line);
}

.category-main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  text-align: left;
}

.category-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 50%;
  background: var(--color-red-soft);
  color: var(--color-danger);
  font-size: 1.3rem;
}

.category-copy strong,
.category-copy small {
  display: block;
}

.category-copy small {
  color: var(--color-muted);
}

.category-dialog {
  @include financial-dialog-card(76rem);
  max-width: none;
}

.category-dialog :deep(.setup-panel) {
  max-width: none;
}

@media (max-width: 749px) {
  .overview-card {
    grid-template-columns: 1fr;
    margin-top: var(--space-3);
  }

  .overview-kpi {
    padding: var(--space-4);
    border-right: 0;
    border-bottom: 1px solid var(--color-line);
  }

  .total-icon {
    width: 2.7rem;
    height: 2.7rem;
    font-size: 1.25rem;
  }

  .total-copy strong {
    margin-bottom: 0.55rem;
    font-size: 2.65rem;
  }

  .kpi-label {
    font-size: 0.84rem;
  }

  .monthly-average {
    font-size: 0.8rem;
  }

  .monthly-average b {
    font-size: 0.9rem;
  }

  .category-table-heading {
    display: none;
  }

  .category-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    @include mobile-financial-row;
  }

  .category-monthly {
    display: none;
  }

  .category-actions {
    align-items: center;
    flex-direction: row;
    padding: 0.55rem 0.65rem;
  }

  .category-icon {
    width: 2.35rem;
    height: 2.35rem;
    font-size: 1.1rem;
  }

  .category-main {
    gap: 0.6rem;
  }

  .category-actions :deep(.q-btn) {
    width: auto;
  }

  .header-actions {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(0, 1fr);
  }

  .header-actions a {
    grid-template-columns: auto minmax(0, 1fr) auto;
    min-width: 0;
    padding: 0.55rem;
  }

  .header-actions a > .q-icon:first-child {
    width: 1.8rem;
    height: 1.8rem;
    font-size: 1rem;
  }

  .header-actions strong {
    font-size: 0.72rem;
  }

  .header-actions small {
    font-size: 0.6rem;
  }
}
</style>
