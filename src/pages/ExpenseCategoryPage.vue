<template>
  <q-page class="expense-category-page">
    <main class="category-shell">
      <div v-if="pageLoading" class="state">
        <q-spinner color="primary" size="2rem" />
        <span>{{ t('expenses.loading') }}</span>
      </div>
      <section
        v-else-if="
          pageError || expensesStore.error || (categoryId === 'housing' && liabilitiesStore.error)
        "
        class="state"
      >
        <q-icon name="cloud_off" size="2rem" />
        <h1>{{ t('expenses.errors.loadTitle') }}</h1>
        <p>{{ t('expenses.errors.load') }}</p>
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="refresh"
          :label="t('common.retry')"
          @click="preparePage(true)"
        />
      </section>

      <template v-else-if="category && categoryConfig?.enabled">
        <AppPageHeader
          inline-actions
          :title="t(category.nameKey)"
          :back-label="t('expenses.backToExpenses')"
          :back-to="expensesRoute"
        >
          <template #title-prefix>
            <span class="category-title-icon"><q-icon :name="category.icon" /></span>
          </template>
          <template #actions>
            <nav class="context-actions header-actions" :aria-label="t('expenses.overview.tools')">
              <router-link :to="trackerRoute" class="tracker-chip">
                <q-icon name="receipt_long" />
                <strong>{{ t('expenses.overview.tracker') }}</strong>
              </router-link>
            </nav>
          </template>
        </AppPageHeader>

        <FinancialCategoryOverviewCard
          tone="expenses"
          :icon="category.icon"
          :label="t('expenses.annualCategoryCost')"
          :formatted-total="formatCurrency(categoryTotal)"
          :secondary-value="formatCurrency(categoryTotal / 12)"
          :secondary-label="t('expenses.overview.averagePerMonth')"
          :badge-label="categoryPercentage"
          :chart-title="t('expenses.categoryDetail.breakdownTitle')"
          :empty-label="t('expenses.categoryDetail.breakdownEmpty')"
          :entries="breakdownEntries"
          :total="categoryTotal"
        />

        <section class="subcategory-section">
          <div v-if="subcategoryRows.length" class="subcategory-list">
            <div class="detail-table-heading" aria-hidden="true">
              <span>{{ t('expenses.categoryDetail.subcategory') }}</span>
              <span>{{ t('expenses.overview.annualAmount') }}</span>
              <span>{{ t('expenses.overview.monthlyAmount') }}</span>
              <span>{{ t('expenses.categoryDetail.tracking') }}</span>
            </div>
            <article
              v-for="subcategory in subcategoryRows"
              :key="subcategory.id"
              class="subcategory-row"
              :class="{ selected: activeSubcategoryId === subcategory.id }"
              role="button"
              tabindex="0"
              :aria-expanded="subcategoryDialog && activeSubcategoryId === subcategory.id"
              @click="selectSubcategory(subcategory.id)"
              @keydown.enter.self="selectSubcategory(subcategory.id)"
              @keydown.space.self.prevent="selectSubcategory(subcategory.id)"
            >
              <div class="subcategory-main">
                <span class="subcategory-icon"><q-icon :name="subcategory.icon" /></span>
                <span>
                  <strong>{{ subcategory.name }}</strong>
                  <small>{{
                    t('expenses.itemSummary', {
                      count: subcategory.itemCount,
                      items: t(
                        subcategory.itemCount === 1
                          ? 'expenses.itemName'
                          : 'expenses.itemNamePlural',
                      ),
                    })
                  }}</small>
                </span>
              </div>
              <span class="subcategory-annual">
                <strong>{{ formatCurrency(subcategory.annualValue) }}</strong>
                <small>/ {{ t('dashboard.year') }}</small>
              </span>
              <span class="subcategory-monthly">
                <strong>{{ formatCurrency(subcategory.annualValue / 12) }}</strong>
                <small>/ {{ t('dashboard.month') }}</small>
              </span>
              <span
                v-if="subcategory.trackingEligible"
                class="tracking-toggle"
                @click.stop
                @keydown.stop
              >
                <q-toggle
                  :model-value="subcategory.tracked"
                  color="negative"
                  :disable="readOnly || Boolean(trackingSavingId)"
                  :aria-label="
                    t('expenses.categoryDetail.toggleTracking', { subcategory: subcategory.name })
                  "
                  @update:model-value="toggleTracking(subcategory, $event)"
                />
                <q-spinner
                  v-if="trackingSavingId === subcategory.id"
                  color="negative"
                  size="1rem"
                />
              </span>
              <span v-else class="tracking-unavailable">—</span>
              <q-btn flat round dense icon="more_vert" color="grey-7" @click.stop>
                <q-menu>
                  <q-list dense>
                    <q-item clickable v-close-popup @click="selectSubcategory(subcategory.id)">
                      <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                      <q-item-section>{{ t('expenses.overview.viewDetails') }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </article>

            <div v-if="!readOnly" class="subcategory-actions">
              <q-btn
                flat
                no-caps
                color="primary"
                icon="add"
                :label="t('expenses.addExpense')"
                @click="addExpense()"
              />
              <q-btn
                flat
                no-caps
                color="primary"
                icon="tune"
                :label="t('expenses.categoryDetail.editSubcategories')"
                :loading="loadingCategoryEditor"
                @click="openSubcategoryEditor"
              />
            </div>
          </div>

          <AppEmptyState
            v-else
            :icon="category.icon"
            :title="t('expenses.categoryDetail.noSubcategoriesTitle')"
            :description="t('expenses.categoryDetail.noSubcategoriesDescription')"
            :action-label="readOnly ? undefined : t('expenses.categoryDetail.editSubcategories')"
            tone="negative"
            @action="openSubcategoryEditor"
          />
        </section>

        <q-dialog
          v-model="subcategoryDialog"
          :position="$q.screen.lt.sm ? 'bottom' : 'standard'"
          @hide="closeSubcategoryDialog"
        >
          <q-card v-if="activeSubcategory" class="item-panel">
            <header class="item-panel-heading">
              <div>
                <span class="subcategory-icon"><q-icon :name="activeSubcategory.icon" /></span>
                <div>
                  <h2>{{ activeSubcategory.name }}</h2>
                  <div class="item-panel-meta">
                    <strong>{{ formatCurrency(activeSubcategory.annualValue) }}</strong>
                    <span>/ {{ t('dashboard.year') }}</span>
                    <span aria-hidden="true">·</span>
                    <span>{{
                      t('expenses.itemSummary', {
                        count: activeSubcategory.itemCount,
                        items: t(
                          activeSubcategory.itemCount === 1
                            ? 'expenses.itemName'
                            : 'expenses.itemNamePlural',
                        ),
                      })
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="item-panel-actions">
                <q-btn
                  flat
                  round
                  dense
                  icon="close"
                  :aria-label="t('common.close')"
                  v-close-popup
                />
              </div>
            </header>

            <div v-if="activeItems.length" class="expense-list">
              <article
                v-for="item in activeItems"
                :key="item.id"
                class="expense-row"
                role="button"
                tabindex="0"
                @click="edit(item)"
                @keydown.enter.self="edit(item)"
                @keydown.space.self.prevent="edit(item)"
              >
                <span class="expense-icon"><q-icon :name="activeSubcategory.icon" /></span>
                <span class="expense-copy">
                  <strong>{{ item.itemName }}</strong>
                  <small>{{
                    item.entryMode === 'simple' ? t('expenses.simpleTotal') : activeSubcategory.name
                  }}</small>
                </span>
                <strong class="expense-value">
                  {{ formatCurrency(itemAnnualValue(item)) }}
                  <small>/ {{ t('dashboard.year') }}</small>
                </strong>
                <q-btn flat round dense icon="more_vert" color="grey-7" @click.stop>
                  <q-menu>
                    <q-list dense>
                      <q-item v-if="!readOnly" clickable v-close-popup @click="edit(item)">
                        <q-item-section avatar><q-icon name="edit" /></q-item-section>
                        <q-item-section>{{ t('common.edit') }}</q-item-section>
                      </q-item>
                      <q-item
                        v-if="!readOnly"
                        clickable
                        v-close-popup
                        class="text-negative"
                        @click="requestDelete(item)"
                      >
                        <q-item-section avatar><q-icon name="delete_outline" /></q-item-section>
                        <q-item-section>{{ t('common.delete') }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </article>
            </div>
            <div v-else class="item-empty">
              <p>{{ t('expenses.categoryDetail.noItems') }}</p>
            </div>

            <footer v-if="!readOnly" class="item-panel-footer">
              <q-btn
                flat
                no-caps
                color="primary"
                :icon="simpleExpense ? 'edit' : 'add'"
                :label="
                  simpleExpense
                    ? t('expenses.categoryDetail.editEstimate')
                    : t('expenses.addExpense')
                "
                @click="simpleExpense ? edit(simpleExpense) : addExpense(activeSubcategory.id)"
              />
            </footer>
          </q-card>
        </q-dialog>
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
          :saving="categorySaving"
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
      :loading="categorySaving"
      @confirm="savePendingCategories"
    />

    <q-dialog v-model="expenseDialog" persistent :maximized="$q.screen.lt.sm">
      <ExpenseForm
        v-if="category"
        :category="category"
        :expense="editingExpense"
        :defaults="expenseDefaults"
        :members="members"
        :financial-year="financialYear"
        :saving="formSaving"
        :mortgages="availableMortgages"
        @save="saveExpense"
        @cancel="closeExpenseDialog"
        @delete="requestDelete(editingExpense)"
      />
    </q-dialog>

    <AppConfirmDialog
      v-model="deleteDialog"
      :title="t('expenses.delete.title')"
      :message="
        t('expenses.delete.description', {
          name: deletingExpense?.itemName || '',
        })
      "
      :cancel-label="t('common.cancel')"
      :confirm-label="t('common.delete')"
      confirm-color="negative"
      :loading="formSaving"
      :show-close="false"
      @confirm="deleteExpense"
      @cancel="cancelDeleteExpense"
    />
  </q-page>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ExpenseCategorySetup from '@/components/expenses/ExpenseCategorySetup.vue'
import ExpenseForm from '@/components/expenses/ExpenseForm.vue'
import FinancialCategoryOverviewCard from '@/components/financial/FinancialCategoryOverviewCard.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { expenseCategories, getExpenseCategory } from '@/config/expense-categories'
import { isDemoWorkspaceId } from '@/domain/access/demo-workspace'
import { expenseTrackingCategories } from '@/config/expense-tracking-categories'
import {
  currentFinancialYear,
  financialYearFlowCategoryValue,
  financialYearFlowValue,
  financialYearExpenseModelItemValue,
  financialYearSubcategoryValue,
} from '../../functions/shared/positions/annual-projection.js'
import {
  createEqualMemberOwnership,
  createSingleMemberOwnership,
} from '../../functions/shared/core/ownership.js'
import { authUser } from '@/services/auth'
import { useExpensesStore } from '@/stores/expenses-store'
import { useExpenseTrackingStore } from '@/stores/expense-tracking-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useLiabilitiesStore } from '@/stores/liabilities-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'
import { financialYearForWorkspace } from '@/domain/access/demo-workspace'

const $q = useQuasar()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const expensesStore = useExpensesStore()
const trackingStore = useExpenseTrackingStore()
const financialYearsStore = useFinancialYearsStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const liabilitiesStore = useLiabilitiesStore()
const preparing = ref(false)
const pageError = ref(null)
const expenseDialog = ref(false)
const subcategoryDialog = ref(false)
const editingCategories = ref(false)
const loadingCategoryEditor = ref(false)
const categorySaving = ref(false)
const confirmDisable = ref(false)
const pendingSelection = ref(null)
const editingExpense = ref(null)
const deletingExpense = ref(null)
const deleteDialog = ref(false)
const formSaving = ref(false)
const activeSubcategoryId = ref(null)
const addingSubcategoryId = ref(null)
const expenseReturnSubcategoryId = ref(null)
const trackingSavingId = ref(null)
let preparationId = 0
const currentYear = financialYearForWorkspace(
  String(route.params.workspaceId),
  currentFinancialYear(),
)

const workspaceId = computed(() => String(route.params.workspaceId))
const readOnly = computed(() => isDemoWorkspaceId(workspaceId.value))
const categoryId = computed(() => String(route.params.category))
const expensesRoute = computed(() => ({
  name: 'expenses',
  params: { workspaceId: workspaceId.value },
}))
const trackerRoute = computed(() => ({
  name: 'expense-tracker',
  params: { workspaceId: workspaceId.value },
  query: { view: 'record' },
}))
const category = computed(() => getExpenseCategory(categoryId.value))
const categoryConfig = computed(() => expensesStore.config?.categories?.[categoryId.value])
const workspace = computed(
  () => workspaceStore.workspaces.find((item) => item.id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map((member) => member.id))
const selectedMemberId = computed({
  get: () => scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
  set: (memberId) => scopeStore.select(workspaceId.value, memberId),
})
const allExpenses = computed(() => expensesStore.itemsForCategory(categoryId.value))
const selectedSubcategoryIds = computed(() => [
  ...new Set(
    expenseCategories.flatMap((expenseCategory) =>
      expensesStore.itemsForCategory(expenseCategory.id).map(({ subcategoryId }) => subcategoryId),
    ),
  ),
])
const activeSubcategory = computed(
  () => subcategoryRows.value.find(({ id }) => id === activeSubcategoryId.value) || null,
)
const activeItems = computed(() =>
  allExpenses.value
    .filter(({ subcategoryId }) => subcategoryId === activeSubcategoryId.value)
    .sort((left, right) => itemAnnualValue(right) - itemAnnualValue(left)),
)
const simpleExpense = computed(
  () => activeItems.value.find(({ entryMode }) => entryMode === 'simple') || null,
)
const availableMortgages = computed(() => {
  const unavailableIds = new Set(
    allExpenses.value
      .filter((expense) => expense.id !== editingExpense.value?.id)
      .map((expense) => expense.liabilityId)
      .filter(Boolean),
  )
  return liabilitiesStore
    .itemsForCategory('mortgage')
    .filter((mortgage) => !unavailableIds.has(mortgage.id))
})
const financialYear = computed(() => financialYearsStore.get(workspaceId.value, currentYear))
const pageLoading = computed(
  () =>
    preparing.value ||
    expensesStore.loading ||
    expensesStore.categoryLoading ||
    financialYearsStore.loading ||
    liabilitiesStore.loading ||
    liabilitiesStore.categoryLoading ||
    trackingStore.loading,
)
const categoryTotal = computed(() =>
  financialYearFlowCategoryValue(
    financialYear.value,
    'expenses',
    categoryId.value,
    selectedMemberId.value,
  ),
)
const totalExpenses = computed(() =>
  financialYearFlowValue(financialYear.value, 'expenses', selectedMemberId.value),
)
const categoryPercentage = computed(() => {
  const percentage = totalExpenses.value > 0 ? (categoryTotal.value / totalExpenses.value) * 100 : 0
  return t('expenses.categoryDetail.percentageOfTotal', {
    percentage: new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(
      percentage,
    ),
  })
})
const subcategoryRows = computed(() => {
  const storedIds = new Set(allExpenses.value.map(({ subcategoryId }) => subcategoryId))
  for (const month of Object.values(financialYear.value?.months || {})) {
    for (const subcategoryId of Object.keys(
      month?.expenses?.categories?.[categoryId.value]?.subcategories || {},
    )) {
      storedIds.add(subcategoryId)
    }
  }
  const trackedIds = new Set(trackingStore.enabledSubcategories)
  return category.value.suggestions
    .filter(({ id }) => storedIds.has(id))
    .map((subcategory) => {
      const items = allExpenses.value.filter(
        ({ subcategoryId }) => subcategoryId === subcategory.id,
      )
      const trackingDefinition = expenseTrackingCategories.find(({ id }) => id === subcategory.id)
      return {
        ...subcategory,
        name: t(subcategory.nameKey),
        icon: trackingDefinition?.icon || category.value.icon,
        annualValue: financialYearSubcategoryValue(
          financialYear.value,
          'expenses',
          categoryId.value,
          subcategory.id,
          selectedMemberId.value,
        ),
        itemCount: items.length,
        trackingEligible: items.some(({ entryMode }) => entryMode !== 'simple'),
        tracked: trackedIds.has(subcategory.id),
      }
    })
    .sort((left, right) => right.annualValue - left.annualValue)
})
const breakdownEntries = computed(() =>
  subcategoryRows.value.map(({ id, name, annualValue }) => ({ id, name, value: annualValue })),
)
const expenseDefaults = computed(() => {
  return {
    itemName: '',
    subcategoryId: addingSubcategoryId.value || undefined,
    notes: '',
    monthlyAmounts: null,
    ownership:
      memberIds.value.length === 1
        ? createSingleMemberOwnership(authUser.value?.uid)
        : createEqualMemberOwnership(memberIds.value),
  }
})

watch([workspaceId, categoryId], () => preparePage(), { immediate: true })

function itemAnnualValue(item) {
  return financialYearExpenseModelItemValue(
    financialYear.value,
    categoryId.value,
    item.subcategoryId,
    item.id,
    selectedMemberId.value,
  )
}

async function preparePage(force = false) {
  const current = ++preparationId
  preparing.value = true
  pageError.value = null
  try {
    await Promise.all([
      expensesStore.loadConfig(workspaceId.value, force),
      financialYearsStore.load(workspaceId.value, currentYear, force),
      trackingStore.loadPreferences(workspaceId.value, force),
      categoryId.value === 'housing'
        ? liabilitiesStore.loadConfig(workspaceId.value, force)
        : Promise.resolve(),
    ])
    if (current !== preparationId) return
    if (!expensesStore.setupCompleted || !category.value || !categoryConfig.value?.enabled) {
      await router.replace(expensesRoute.value)
      return
    }
    await expensesStore.loadCategory(workspaceId.value, categoryId.value, force)
    if (categoryId.value === 'housing' && liabilitiesStore.config?.categories?.mortgage) {
      await liabilitiesStore.loadCategory(workspaceId.value, 'mortgage', force)
    }
    if (
      activeSubcategoryId.value &&
      !subcategoryRows.value.some(({ id }) => id === activeSubcategoryId.value)
    ) {
      activeSubcategoryId.value = null
    }
  } catch (error) {
    pageError.value = error
  } finally {
    if (current === preparationId) preparing.value = false
  }
}

function selectSubcategory(subcategoryId) {
  activeSubcategoryId.value = subcategoryId
  subcategoryDialog.value = true
}

function closeSubcategoryDialog() {
  activeSubcategoryId.value = null
}

function addExpense(subcategoryId = null) {
  if (readOnly.value) return
  expenseReturnSubcategoryId.value = subcategoryDialog.value
    ? subcategoryId || activeSubcategoryId.value
    : null
  subcategoryDialog.value = false
  addingSubcategoryId.value = subcategoryId
  editingExpense.value = null
  expenseDialog.value = true
}

function edit(item) {
  if (readOnly.value) return
  expenseReturnSubcategoryId.value = subcategoryDialog.value
    ? activeSubcategoryId.value || item.subcategoryId
    : null
  subcategoryDialog.value = false
  addingSubcategoryId.value = null
  editingExpense.value = item
  expenseDialog.value = true
}

function closeExpenseDialog() {
  expenseDialog.value = false
  editingExpense.value = null
  addingSubcategoryId.value = null
  restoreSubcategoryContext()
}

function restoreSubcategoryContext() {
  const subcategoryId = expenseReturnSubcategoryId.value
  expenseReturnSubcategoryId.value = null
  if (!subcategoryId || !subcategoryRows.value.some(({ id }) => id === subcategoryId)) return
  nextTick(() => {
    activeSubcategoryId.value = subcategoryId
    subcategoryDialog.value = true
  })
}

async function openSubcategoryEditor() {
  if (readOnly.value) return
  if (loadingCategoryEditor.value) return
  loadingCategoryEditor.value = true
  try {
    await Promise.allSettled(
      Object.keys(expensesStore.config?.categories || {}).map((expenseCategoryId) =>
        expensesStore.loadCategory(workspaceId.value, expenseCategoryId),
      ),
    )
    editingCategories.value = true
  } finally {
    loadingCategoryEditor.value = false
  }
}

function requestCategorySave(selection) {
  const removedWithData = expensesStore.enabledCategories.some(
    (expenseCategoryId) =>
      !selection.categoryIds.includes(expenseCategoryId) && categoryHasData(expenseCategoryId),
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
  if (!selection || categorySaving.value) return
  categorySaving.value = true
  const saved = await persistCategoryChanges(async () => {
    await expensesStore.saveCategorySelection(
      workspaceId.value,
      selection.categoryIds,
      memberIds.value,
    )
    await createSelectedSubcategoryExpenses(selection.subcategoryIds)
  })
  categorySaving.value = false
  if (!saved) return

  editingCategories.value = false
  if (!selection.categoryIds.includes(categoryId.value)) {
    await router.replace(expensesRoute.value)
  }
}

async function createSelectedSubcategoryExpenses(subcategoryIds) {
  const ownership =
    memberIds.value.length === 1
      ? createSingleMemberOwnership(memberIds.value[0])
      : createEqualMemberOwnership(memberIds.value)

  for (const expenseCategory of expenseCategories) {
    const existingSubcategoryIds = new Set(
      expensesStore.itemsForCategory(expenseCategory.id).map(({ subcategoryId }) => subcategoryId),
    )
    for (const suggestion of expenseCategory.suggestions) {
      if (!subcategoryIds.includes(suggestion.id) || existingSubcategoryIds.has(suggestion.id)) {
        continue
      }
      await expensesStore.addExpense(
        workspaceId.value,
        {
          categoryId: expenseCategory.id,
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

function categoryHasData(expenseCategoryId) {
  return (
    financialYearFlowCategoryValue(
      financialYear.value,
      'expenses',
      expenseCategoryId,
      selectedMemberId.value,
    ) > 0
  )
}

async function persistCategoryChanges(operation) {
  try {
    await operation()
    $q.notify({ type: 'positive', message: t('expenses.saved'), position: 'top' })
    return true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('expenses.errors.save'),
      caption: error?.message,
      position: 'top',
    })
    return false
  }
}

async function toggleTracking(subcategory, enabled) {
  if (readOnly.value) return
  if (trackingSavingId.value || !subcategory.trackingEligible) return
  trackingSavingId.value = subcategory.id
  const selected = new Set(trackingStore.enabledSubcategories)
  if (enabled) selected.add(subcategory.id)
  else selected.delete(subcategory.id)
  try {
    await trackingStore.savePreferences(workspaceId.value, [...selected])
    $q.notify({ type: 'positive', message: t('expenseTracker.saved'), position: 'top' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('expenseTracker.errors.save'),
      caption: error?.message,
      position: 'top',
    })
  } finally {
    trackingSavingId.value = null
  }
}

async function saveExpense(payload) {
  if (formSaving.value) return
  formSaving.value = true
  const id = editingExpense.value?.id
  const saved = await persist(() =>
    id
      ? expensesStore.editExpense(
          workspaceId.value,
          id,
          { ...payload, entryMode: editingExpense.value?.entryMode || 'detailed' },
          memberIds.value,
        )
      : expensesStore.addExpense(
          workspaceId.value,
          { ...payload, entryMode: 'detailed' },
          memberIds.value,
        ),
  )
  formSaving.value = false
  if (saved) closeExpenseDialog()
}

function requestDelete(item) {
  if (!item) return
  if (!expenseReturnSubcategoryId.value && subcategoryDialog.value) {
    expenseReturnSubcategoryId.value = activeSubcategoryId.value || item.subcategoryId
  }
  deletingExpense.value = item
  subcategoryDialog.value = false
  expenseDialog.value = false
  deleteDialog.value = true
}

async function deleteExpense() {
  if (!deletingExpense.value || formSaving.value) return
  formSaving.value = true
  const saved = await persist(() =>
    expensesStore.deleteExpense(workspaceId.value, deletingExpense.value.id),
  )
  formSaving.value = false
  if (saved) {
    deleteDialog.value = false
    deletingExpense.value = null
    restoreSubcategoryContext()
  }
}

function cancelDeleteExpense() {
  deleteDialog.value = false
  deletingExpense.value = null
  restoreSubcategoryContext()
}

async function persist(operation) {
  try {
    await operation()
    $q.notify({ type: 'positive', message: t('expenses.saved'), position: 'top' })
    return true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('expenses.errors.save'),
      caption: error?.message,
      position: 'top',
    })
    return false
  }
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.expense-category-page {
  @include financial-page;
}

.category-shell {
  @include financial-shell(wide);
}

.state {
  display: grid;
  place-items: center;
  min-height: 50vh;
  text-align: center;
}

.category-title-icon,
.subcategory-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--color-red-soft);
  color: var(--color-financial-expenses);
  font-size: 1.4rem;
}

@include financial-context-actions(760px);
@include financial-detail-table-heading(minmax(14rem, 1fr) 9rem 9rem 7rem 2.25rem);

.subcategory-section {
  margin-top: var(--space-4);
}

.item-panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.item-panel-heading h2 {
  margin: 0;
}

.item-panel-heading h2 {
  color: var(--color-ink);
  font-size: 1.45rem;
  letter-spacing: -0.03em;
}

.subcategory-list {
  @include dashboard-card;
  overflow: hidden;
}

.subcategory-row {
  display: grid;
  grid-template-columns: minmax(14rem, 1fr) 9rem 9rem 7rem 2.25rem;
  align-items: center;
  gap: var(--space-2);
  min-height: 4.5rem;
  padding: 0.55rem 0.75rem 0.55rem 0.9rem;
  border-bottom: 1px solid var(--color-line);
  cursor: pointer;
  transition: background-color 150ms ease;
}

.subcategory-row:last-of-type {
  border-bottom: 0;
}

.subcategory-row.selected {
  background: var(--color-surface-soft);
}

.subcategory-row:hover {
  background: var(--color-surface-soft);
}

.subcategory-row:focus-visible {
  @include focus-ring;
  position: relative;
  z-index: 1;
}

.subcategory-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  color: var(--color-ink);
  text-align: left;
}

.subcategory-icon {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.15rem;
}

.subcategory-main strong,
.subcategory-main small {
  display: block;
}

.subcategory-main small {
  margin-top: 0.1rem;
  color: var(--color-muted);
  font-size: 0.76rem;
}

.subcategory-annual,
.subcategory-monthly,
.tracking-unavailable {
  text-align: right;
  white-space: nowrap;
}

.subcategory-annual,
.subcategory-monthly {
  display: grid;
  justify-items: end;
}

.subcategory-annual strong,
.subcategory-monthly strong {
  color: var(--color-ink);
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
}

.subcategory-annual small,
.subcategory-monthly small {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 400;
}

.tracking-unavailable {
  color: var(--color-copy);
}

.tracking-toggle {
  display: inline-flex;
  align-items: center;
  justify-self: end;
  gap: 0.15rem;
}

.subcategory-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0.8rem 0.9rem;
  border-top: 1px solid var(--color-line);
}

.category-dialog {
  @include financial-category-dialog-card;
}

.item-panel {
  display: flex;
  flex-direction: column;
  width: min(58rem, calc(100vw - 2rem));
  max-width: 58rem;
  max-height: min(80vh, 44rem);
  overflow: hidden;
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

.item-panel-heading {
  align-items: center;
  margin: 0;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-line);
}

.item-panel-heading > div {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.item-panel-actions {
  flex: 0 0 auto;
}

.item-panel-meta {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.25rem;
  color: var(--color-muted);
  font-size: 0.78rem;
}

.item-panel-meta strong {
  color: var(--color-ink);
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
}

.expense-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: min(62vh, 34rem);
  overflow-y: auto;
}

.expense-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-line);
  cursor: pointer;
}

.expense-row:hover {
  background: var(--color-surface-soft);
}

.expense-row:last-child {
  border-bottom: 0;
}

.expense-row:focus-visible {
  position: relative;
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.expense-icon {
  @include financial-item-icon;
}

.expense-copy strong,
.expense-copy small,
.expense-value small {
  display: block;
}

.expense-copy small,
.expense-value small {
  color: var(--color-muted);
}

.expense-value {
  text-align: right;
}

.item-empty {
  padding: var(--space-6);
  color: var(--color-copy);
  text-align: center;
}

.item-empty p {
  margin: 0;
}

.item-panel-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.65rem 0.75rem;
  border-top: 1px solid var(--color-line);
}

@media (max-width: bp.$content-compact-max) {
  .category-title-icon {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.15rem;
  }

  .item-panel-heading h2 {
    font-size: 1.25rem;
  }

  .subcategory-row {
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    gap: 0.45rem;
    min-height: 4rem;
    padding: 0.5rem 0.55rem;
  }

  .detail-table-heading {
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    gap: 0.45rem;
    padding: 0.55rem;
  }

  .detail-table-heading span:nth-child(3) {
    display: none;
  }

  .subcategory-monthly,
  .tracking-unavailable {
    display: none;
  }

  .subcategory-annual {
    grid-column: 2;
    grid-row: 1;
  }

  .tracking-toggle {
    grid-column: 3;
    grid-row: 1;
  }

  .subcategory-row > .q-btn {
    grid-column: 4;
    grid-row: 1;
  }

  .subcategory-icon {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1rem;
  }

  .item-panel-heading {
    align-items: flex-start;
  }

  .item-panel {
    width: 100%;
    max-width: 100%;
    max-height: min(88vh, 48rem);
    border-radius: var(--radius-card) var(--radius-card) 0 0;
  }

  .expense-row {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    align-items: start;
    gap: 0.6rem;
  }

  .expense-icon {
    grid-column: 1;
    grid-row: 1;
  }

  .expense-copy {
    grid-column: 2;
    grid-row: 1;
  }

  .expense-value {
    grid-column: 3;
    grid-row: 1;
    padding-top: 0.1rem;
    text-align: right;
    white-space: nowrap;
  }

  .expense-row > .q-btn {
    grid-column: 4;
    grid-row: 1;
    align-self: center;
  }
}
</style>
