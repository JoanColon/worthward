<template>
  <q-page class="category-page"
    ><main class="category-shell">
      <div v-if="pageLoading" class="state">
        <q-spinner color="primary" size="2rem" /><span>{{ t('income.loading') }}</span>
      </div>
      <section v-else-if="pageError || incomeStore.error" class="state">
        <q-icon name="cloud_off" size="2rem" />
        <h1>{{ t('income.errors.loadTitle') }}</h1>
        <p>{{ t('income.errors.load') }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          :label="t('common.retry')"
          @click="preparePage(true)"
        />
      </section>
      <template v-else-if="category && categoryConfig?.enabled">
        <AppPageHeader
          :title="t(category.nameKey)"
          :back-label="t('income.backToIncome')"
          :back-to="incomeRoute"
        />
        <FinancialCategoryOverviewCard
          tone="income"
          :icon="category.icon"
          :label="t('income.annualTotal')"
          :formatted-total="formatCurrency(categoryTotal)"
          :secondary-value="formatCurrency(categoryTotal / 12)"
          :secondary-label="t('income.overview.averagePerMonth')"
          :chart-title="t('income.categoryDetail.breakdownTitle')"
          :empty-label="t('income.categoryDetail.breakdownEmpty')"
          :entries="breakdownEntries"
          :total="categoryTotal"
        />
        <section v-if="allCategoryIncome.length" class="income-list">
          <div class="detail-table-heading" aria-hidden="true">
            <span>{{ t('income.categoryDetail.item') }}</span>
            <span>{{ t('income.categoryDetail.annualAmount') }}</span>
            <span>{{ t('income.overview.monthlyAverage') }}</span>
            <span></span>
          </div>
          <article
            v-for="item in scopedIncome"
            :key="item.id"
            class="income-row"
            role="button"
            tabindex="0"
            @click="edit(item)"
            @keydown.enter.self="edit(item)"
            @keydown.space.self.prevent="edit(item)"
          >
            <div class="income-main">
              <span class="income-icon"><q-icon :name="category.icon" /></span
              ><span class="income-copy"
                ><strong>{{ t(`income.subtypes.${item.subcategoryId}`) }}</strong
                ><small>{{ item.itemName }}</small></span
              >
            </div>
            <span class="income-annual">
              <strong>{{ formatCurrency(item.scopedValue) }}</strong>
              <small>/ {{ t('dashboard.year') }}</small>
            </span>
            <span class="income-monthly">
              <strong>{{ formatCurrency(item.scopedValue / 12) }}</strong>
              <small>/ {{ t('dashboard.month') }}</small>
            </span>
            <q-btn flat round dense icon="more_vert" color="grey-7" @click.stop
              ><q-menu
                ><q-list dense
                  ><q-item v-if="!readOnly" clickable v-close-popup @click="edit(item)"
                    ><q-item-section avatar><q-icon name="edit" /></q-item-section
                    ><q-item-section>{{ t('income.editDetails') }}</q-item-section></q-item
                  ><q-item
                    v-if="!readOnly"
                    clickable
                    v-close-popup
                    class="text-negative"
                    @click="requestDelete(item)"
                    ><q-item-section avatar><q-icon name="delete_outline" /></q-item-section
                    ><q-item-section>{{ t('common.delete') }}</q-item-section></q-item
                  ></q-list
                ></q-menu
              ></q-btn
            >
          </article>
          <button v-if="!readOnly" type="button" class="add-row" @click="add">
            <q-icon name="add" /><span>{{ t(category.addLabelKey) }}</span>
          </button>
        </section>
        <AppEmptyState
          v-else
          :icon="category.icon"
          :title="t('income.empty.contextualTitle', { items: t(category.itemNamePluralKey) })"
          :description="t('income.empty.description')"
          :action-label="readOnly ? undefined : t(category.addLabelKey)"
          tone="positive"
          @action="add"
        />
      </template>
    </main>
    <q-dialog v-model="incomeDialog" persistent
      ><IncomeForm
        v-if="category"
        :category="category"
        :income="editingIncome"
        :defaults="incomeDefaults"
        :members="members"
        :portfolios="linkedPortfolios"
        :saving="formSaving"
        @save="saveIncome"
        @cancel="closeIncomeDialog"
        @delete="requestDelete(editingIncome)"
    /></q-dialog>
    <AppConfirmDialog
      v-model="confirmDelete"
      :title="t('income.delete.title')"
      :message="t('income.delete.description', { name: incomeDisplayName(deletingIncome) })"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('common.delete')"
      confirm-color="negative"
      confirm-first
      confirm-flat
      actions-align="between"
      :loading="formSaving"
      @confirm="deleteIncome"
    />
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import IncomeForm from '@/components/income/IncomeForm.vue'
import FinancialCategoryOverviewCard from '@/components/financial/FinancialCategoryOverviewCard.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { getIncomeCategory } from '@/config/income-categories'
import { isDemoWorkspaceId } from '@/domain/access/demo-workspace'
import {
  currentFinancialYear,
  financialYearFlowCategoryValue,
  financialYearIncomeModelItemValue,
} from '../../functions/shared/positions/annual-projection.js'
import {
  createEqualMemberOwnership,
  createSingleMemberOwnership,
} from '../../functions/shared/core/ownership.js'
import { authUser } from '@/services/auth'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useAssetsStore } from '@/stores/assets-store'
import { useIncomeStore } from '@/stores/income-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'
import { financialYearForWorkspace } from '@/domain/access/demo-workspace'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const incomeStore = useIncomeStore()
const assetsStore = useAssetsStore()
const financialYearsStore = useFinancialYearsStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const preparing = ref(false)
const pageError = ref(null)
const incomeDialog = ref(false)
const editingIncome = ref(null)
const deletingIncome = ref(null)
const confirmDelete = ref(false)
const formSaving = ref(false)
let preparationId = 0
const currentYear = financialYearForWorkspace(
  String(route.params.workspaceId),
  currentFinancialYear(),
)
const workspaceId = computed(() => String(route.params.workspaceId))
const readOnly = computed(() => isDemoWorkspaceId(workspaceId.value))
const categoryId = computed(() => String(route.params.category))
const incomeRoute = computed(() => ({ name: 'income', params: { workspaceId: workspaceId.value } }))
const category = computed(() => getIncomeCategory(categoryId.value))
const categoryConfig = computed(() => incomeStore.config?.categories?.[categoryId.value])
const workspace = computed(
  () => workspaceStore.workspaces.find((candidate) => candidate.id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map((member) => member.id))
const selectedMemberId = computed({
  get: () => scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
  set: (memberId) => scopeStore.select(workspaceId.value, memberId),
})
const allCategoryIncome = computed(() => incomeStore.itemsForCategory(categoryId.value))
const linkedPortfolios = computed(() => {
  const unavailablePortfolioIds = new Set(
    allCategoryIncome.value
      .filter((income) => income.id !== editingIncome.value?.id)
      .map((income) => income.portfolioAssetId)
      .filter(Boolean),
  )
  return assetsStore
    .itemsForCategory('investment')
    .filter(
      (asset) => asset.detail?.portfolio?.spreadsheetUrl && !unavailablePortfolioIds.has(asset.id),
    )
    .map((asset) => ({
      id: asset.id,
      itemName: asset.itemName,
      annualDividendIncome: asset.detail?.portfolio?.summary?.annualDividendIncome,
    }))
})
const financialYear = computed(() => financialYearsStore.get(workspaceId.value, currentYear))
const incomeDefaults = computed(() => {
  if (!categoryConfig.value || !category.value) return null
  const ownership =
    memberIds.value.length === 1
      ? createSingleMemberOwnership(authUser.value?.uid)
      : createEqualMemberOwnership(memberIds.value)
  return {
    subcategoryId: category.value.subcategories[0],
    itemName: '',
    notes: '',
    calculation: defaultCalculation(category.value.calculationModes[0], 0),
    ownership,
  }
})
const scopedIncome = computed(() =>
  allCategoryIncome.value
    .map((item) => ({
      ...item,
      scopedValue: financialYearIncomeModelItemValue(
        financialYear.value,
        categoryId.value,
        item.subcategoryId,
        item.id,
        selectedMemberId.value,
      ),
    }))
    .sort((left, right) => Number(right.scopedValue || 0) - Number(left.scopedValue || 0)),
)
const categoryTotal = computed(() =>
  financialYearFlowCategoryValue(
    financialYear.value,
    'income',
    categoryId.value,
    selectedMemberId.value,
  ),
)
const breakdownEntries = computed(() =>
  scopedIncome.value.map((item) => ({
    id: item.id,
    name: incomeDisplayName(item),
    value: Number(item.scopedValue || 0),
  })),
)
const pageLoading = computed(
  () =>
    preparing.value ||
    incomeStore.loading ||
    incomeStore.categoryLoading ||
    financialYearsStore.loading ||
    (categoryId.value === 'investments' && (assetsStore.loading || assetsStore.categoryLoading)),
)
watch([workspaceId, categoryId], () => preparePage(), { immediate: true })

function defaultCalculation(mode, value) {
  if (mode === 'annual_salary') return { mode, annualAmount: value, paymentsPerYear: 12 }
  if (mode === 'monthly_schedule')
    return {
      mode,
      monthlyAmount: value / 12,
      extrasByMonth: {},
    }
  if (mode === 'one_time') return { mode, amount: value }
  return { mode: 'recurring', amount: value, frequency: 'yearly' }
}
async function preparePage(force = false) {
  const current = ++preparationId
  preparing.value = true
  pageError.value = null
  try {
    await Promise.all([
      incomeStore.loadConfig(workspaceId.value, force),
      financialYearsStore.load(workspaceId.value, currentYear, force),
      ...(categoryId.value === 'investments'
        ? [assetsStore.loadCategory(workspaceId.value, 'investment', force)]
        : []),
    ])
    if (current !== preparationId) return
    if (!incomeStore.setupCompleted || !category.value || !categoryConfig.value?.enabled) {
      await router.replace(incomeRoute.value)
      return
    }
    await incomeStore.loadCategory(workspaceId.value, categoryId.value, force)
  } catch (error) {
    pageError.value = error
  } finally {
    if (current === preparationId) preparing.value = false
  }
}
function incomeDisplayName(item) {
  return item?.itemName?.trim() || (item ? t(`income.subtypes.${item.subcategoryId}`) : '')
}
function add() {
  if (readOnly.value) return
  editingIncome.value = null
  incomeDialog.value = true
}
function edit(item) {
  if (readOnly.value) return
  editingIncome.value = item
  incomeDialog.value = true
}
function closeIncomeDialog() {
  incomeDialog.value = false
  editingIncome.value = null
}
async function saveIncome(payload) {
  if (formSaving.value) return
  const id = editingIncome.value?.id
  formSaving.value = true
  const saved = await persist(() =>
    id
      ? incomeStore.editIncome(
          workspaceId.value,
          id,
          { ...payload, entryMode: 'detailed' },
          memberIds.value,
        )
      : incomeStore.addIncome(
          workspaceId.value,
          { ...payload, entryMode: 'detailed' },
          memberIds.value,
        ),
  )
  formSaving.value = false
  if (saved) closeIncomeDialog()
}
function requestDelete(item) {
  if (!item) return
  deletingIncome.value = item
  confirmDelete.value = true
}
async function deleteIncome() {
  if (!deletingIncome.value) return
  formSaving.value = true
  const saved = await persist(() =>
    incomeStore.deleteIncome(workspaceId.value, deletingIncome.value.id),
  )
  formSaving.value = false
  if (saved) {
    confirmDelete.value = false
    deletingIncome.value = null
    closeIncomeDialog()
  }
}
async function persist(action) {
  try {
    await action()
    $q.notify({ type: 'positive', message: t('income.saved'), position: 'top' })
    return true
  } catch {
    $q.notify({ type: 'negative', message: t('income.errors.save'), position: 'top' })
    return false
  }
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

$income-table-compact-max: 720px;

.category-page {
  @include financial-page;
}
.category-shell {
  @include financial-shell(wide);
}
@include financial-detail-table-heading(minmax(14rem, 1fr) 9rem 9rem auto);
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
.income-icon {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.income-list {
  margin-top: 1.25rem;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: white;
  box-shadow: var(--shadow-card);
}
.income-row {
  display: grid;
  grid-template-columns: minmax(14rem, 1fr) 9rem 9rem auto;
  align-items: center;
  gap: 1rem;
  min-height: 5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-line);
  cursor: pointer;
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease;
}
.income-row:hover {
  background: var(--color-surface-soft);
}
.income-row:focus-visible {
  position: relative;
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
.income-main {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}
.income-icon {
  @include financial-item-icon;
}
.income-copy {
  min-width: 0;
}
.income-copy strong,
.income-copy small {
  display: block;
}
.income-copy small {
  margin-top: 0.2rem;
  overflow: hidden;
  color: var(--color-copy);
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.income-annual,
.income-monthly {
  display: grid;
  justify-items: end;
  text-align: right;
  white-space: nowrap;
}

.income-annual strong,
.income-monthly strong {
  color: var(--color-ink);
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
}

.income-annual small,
.income-monthly small {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 400;
}
.add-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  border: 0;
  background: white;
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
}
@media (min-width: 721px) and (max-width: 760px) {
  .detail-table-heading {
    grid-template-columns: minmax(0, 1fr) 9rem 9rem auto;
  }
}
@media (max-width: $income-table-compact-max) {
  .detail-table-heading {
    grid-template-columns: minmax(0, 1fr) auto auto;
  }
  .detail-table-heading span:nth-child(3) {
    display: none;
  }
  .income-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    @include mobile-financial-row;
  }
  .income-copy small {
    white-space: normal;
  }
  .income-main {
    gap: 0.6rem;
  }
  .income-annual {
    grid-column: 2;
    grid-row: 1;
    font-size: 0.95rem;
  }
  .income-monthly {
    display: none;
  }
  .income-row > .q-btn {
    grid-column: 3;
    grid-row: 1;
  }
  .add-row {
    padding: 0.75rem;
  }
}
</style>
