<template>
  <q-page class="liabilities-page">
    <main class="liabilities-shell">
      <div v-if="liabilitiesStore.loading || loadingMetrics" class="loading-state">
        <q-spinner color="primary" size="2rem" />
        <span>{{ t('liabilities.loading') }}</span>
      </div>

      <section v-else-if="liabilitiesStore.error" class="error-state">
        <q-icon name="cloud_off" />
        <h1>{{ t('liabilities.errors.loadTitle') }}</h1>
        <p>{{ t('liabilities.errors.load') }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          :label="t('common.retry')"
          @click="liabilitiesStore.loadConfig(workspaceId, true)"
        />
      </section>

      <PositionCategorySetup
        v-else-if="!liabilitiesStore.setupCompleted"
        :categories="liabilityCategories"
        translation-namespace="liabilities"
        variant="liabilities"
        :saving="saving"
        @save="completeSetup"
      />

      <template v-else>
        <AppPageHeader
          :title="t('liabilities.title')"
          :back-label="t('navigation.backToWorkspaceHome')"
          :back-to="workspaceHomeRoute"
        />

        <FinancialOverviewCard
          tone="liabilities"
          icon="credit_card"
          :label="t('liabilities.totalLiabilities')"
          :formatted-total="formatCurrency(total)"
          :metrics="overviewMetrics"
          :scope-label="scopeLabel"
          :chart-title="t('liabilities.overview.breakdownTitle')"
          :total-label="t('liabilities.overview.currentBalance')"
          :empty-label="t('liabilities.overview.breakdownEmpty')"
          :entries="breakdownEntries"
        />

        <section class="category-list" :aria-label="t('liabilities.enabledCategories')">
          <div class="category-table-heading" aria-hidden="true">
            <span>{{ t('liabilities.overview.category') }}</span>
            <span>{{ t('liabilities.overview.currentBalance') }}</span>
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
                :value="canonicalCategoryValue(category.id)"
                :formatted-value="categoryValue(category.id)"
                :saving="isCategorySaving(category.id)"
                :disabled="readOnly || isItemizedCategory(category.id)"
                :title="t('liabilities.quickEdit.title')"
                :input-label="t('liabilities.form.totalBalance')"
                @click="handleValueClick($event, category.id)"
                @save="saveSimpleCategoryValue(category.id, $event)"
              />

              <q-btn
                flat
                round
                dense
                icon="more_vert"
                color="grey-7"
                :aria-label="t('liabilities.moreActions', { name: t(category.nameKey) })"
                @click.stop
              >
                <q-menu anchor="bottom right" self="top right">
                  <q-list dense class="category-menu">
                    <q-item clickable v-close-popup @click="openCategory(category.id)">
                      <q-item-section avatar><q-icon name="visibility" /></q-item-section>
                      <q-item-section>{{ t('liabilities.overview.viewDetails') }}</q-item-section>
                    </q-item>
                    <q-item
                      v-if="!readOnly && !isItemizedCategory(category.id)"
                      clickable
                      v-close-popup
                      @click="openOwnershipEditor(category.id)"
                    >
                      <q-item-section avatar><q-icon name="group" /></q-item-section>
                      <q-item-section>{{ t('liabilities.ownership.label') }}</q-item-section>
                    </q-item>
                    <q-item
                      v-if="!readOnly"
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

          <div v-if="!readOnly" class="category-actions">
            <q-btn
              flat
              no-caps
              icon="tune"
              color="primary"
              :label="t('liabilities.editCategories')"
              @click="editingCategories = true"
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
        <PositionCategorySetup
          edit-mode
          :categories="liabilityCategories"
          translation-namespace="liabilities"
          variant="liabilities"
          :initial-selected="liabilitiesStore.enabledCategories"
          :saving="saving"
          @save="requestCategorySave"
          @cancel="editingCategories = false"
        />
      </q-card>
    </q-dialog>

    <AppConfirmDialog
      v-model="confirmDisable"
      :title="t('liabilities.setup.disableTitle')"
      :message="t('liabilities.setup.disableDescription')"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('liabilities.setup.disableAction')"
      @confirm="savePendingCategories"
    />

    <AppConfirmDialog
      v-model="confirmCategoryDelete"
      :title="t('liabilities.deleteCategory.title')"
      :message="
        t('liabilities.deleteCategory.description', {
          name: deletingCategory ? t(deletingCategory.nameKey) : '',
        })
      "
      :cancel-label="t('common.cancel')"
      :confirm-label="t('common.delete')"
      confirm-color="negative"
      :loading="saving"
      @confirm="deleteCategory"
    />

    <q-dialog v-model="ownershipDialog">
      <q-card class="ownership-dialog-card">
        <q-btn
          flat
          round
          dense
          icon="close"
          class="dialog-close"
          :aria-label="t('common.cancel')"
          v-close-popup
        />
        <q-card-section>
          <h2>{{ t('liabilities.ownership.label') }}</h2>
          <OwnershipEditor
            v-if="editingOwnershipCategoryId"
            v-model="editingOwnership"
            :members="members"
            @validity="ownershipValid = $event"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="t('common.cancel')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('common.save')"
            :loading="saving"
            :disable="!ownershipValid"
            @click="saveSimpleOwnership"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import OwnershipEditor from '@/components/financial/OwnershipEditor.vue'
import FinancialOverviewCard from '@/components/financial/FinancialOverviewCard.vue'
import PositionCategorySetup from '@/components/financial/PositionCategorySetup.vue'
import SimpleValueEditor from '@/components/financial/SimpleValueEditor.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { liabilityCategories } from '@/config/liability-categories'
import { isDemoWorkspaceId } from '@/domain/access/demo-workspace'
import { CHART_SERIES_COLORS } from '@/config/chart-theme'
import {
  currentFinancialMonth,
  currentFinancialYear,
  financialYearCategoryItemCount,
  financialYearMonthCategoryValue,
  financialYearMonthValue,
} from '../../functions/shared/positions/annual-projection.js'
import {
  calculateLiabilityOverviewMetrics,
  calculateModeledMonthlyLiabilityPayments,
} from '../../functions/shared/positions/overview-metrics.js'
import { authUser } from '@/services/auth'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useLiabilitiesStore } from '@/stores/liabilities-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import {
  cloneOwnershipAllocation,
  isValidOwnershipAllocation,
} from '../../functions/shared/core/ownership.js'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'
import {
  financialMonthForWorkspace,
  financialYearForWorkspace,
} from '@/domain/access/demo-workspace'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const liabilitiesStore = useLiabilitiesStore()
const financialYearsStore = useFinancialYearsStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const saving = ref(false)
const loadingMetrics = ref(false)
const editingCategories = ref(false)
const confirmDisable = ref(false)
const confirmCategoryDelete = ref(false)
const deletingCategory = ref(null)
const pendingSelection = ref(null)
const savingCategoryIds = ref(new Set())
const ownershipDialog = ref(false)
const editingOwnershipCategoryId = ref(null)
const editingOwnership = ref({ mode: 'single', shares: [] })
const ownershipValid = ref(false)
const routeWorkspaceId = String(route.params.workspaceId)
const currentYear = financialYearForWorkspace(routeWorkspaceId, currentFinancialYear())
const currentMonth = financialMonthForWorkspace(routeWorkspaceId, currentFinancialMonth())

const workspaceId = computed(() => String(route.params.workspaceId))
const readOnly = computed(() => isDemoWorkspaceId(workspaceId.value))
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
  liabilityCategories
    .filter((category) => liabilitiesStore.enabledCategories.includes(category.id))
    .sort((left, right) => categoryNumericValue(right.id) - categoryNumericValue(left.id)),
)
const total = computed(() =>
  financialYearMonthValue(financialYear.value, currentMonth, 'liabilities', selectedMemberId.value),
)
const overviewMetrics = computed(() => {
  const metrics = calculateLiabilityOverviewMetrics(
    financialYear.value,
    currentMonth,
    selectedMemberId.value,
  )
  const modeledMonthlyPayments = calculateModeledMonthlyLiabilityPayments(
    liabilitiesStore.itemsForCategory('mortgage'),
    selectedMemberId.value,
  )
  return [
    {
      label: t('liabilities.overview.modeledMonthlyPayments'),
      value: formatCurrency(modeledMonthlyPayments),
      help: t('liabilities.overview.modeledMonthlyPaymentsHelp'),
    },
    {
      label: t('liabilities.overview.debtToAssets'),
      value: formatPercentage(metrics.debtToAssetsPercent),
    },
  ]
})
const breakdownEntries = computed(() => {
  const entries = enabledCategories.value
    .map((category) => ({
      id: category.id,
      name: t(category.nameKey),
      value: categoryNumericValue(category.id),
      color:
        CHART_SERIES_COLORS.liabilities[
          liabilityCategories.findIndex(({ id }) => id === category.id) %
            CHART_SERIES_COLORS.liabilities.length
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

onMounted(() => loadLiabilities(workspaceId.value))
watch(workspaceId, (value) => loadLiabilities(value))

async function loadLiabilities(activeWorkspaceId) {
  loadingMetrics.value = true
  try {
    await Promise.allSettled([
      liabilitiesStore.loadConfig(activeWorkspaceId),
      financialYearsStore.load(activeWorkspaceId, currentYear),
    ])
    if (liabilitiesStore.enabledCategories.includes('mortgage')) {
      await liabilitiesStore.loadCategory(activeWorkspaceId, 'mortgage')
    }
  } finally {
    loadingMetrics.value = false
  }
}

async function completeSetup(selected) {
  await persist(() => liabilitiesStore.completeSetup(workspaceId.value, selected, memberIds.value))
}

function requestCategorySave(selected) {
  const removedWithData = liabilitiesStore.enabledCategories.some(
    (categoryId) => !selected.includes(categoryId) && categoryHasData(categoryId),
  )
  if (removedWithData) {
    pendingSelection.value = selected
    confirmDisable.value = true
    return
  }
  saveCategorySelection(selected)
}

async function savePendingCategories() {
  confirmDisable.value = false
  await saveCategorySelection(pendingSelection.value)
  pendingSelection.value = null
}

async function saveCategorySelection(selected) {
  const saved = await persist(() =>
    liabilitiesStore.saveCategorySelection(workspaceId.value, selected, memberIds.value),
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
    liabilitiesStore.deleteCategory(workspaceId.value, deletingCategory.value.id),
  )
  if (saved) {
    confirmCategoryDelete.value = false
    deletingCategory.value = null
  }
}

function categoryHasData(categoryId) {
  return (
    financialYearMonthCategoryValue(financialYear.value, currentMonth, 'liabilities', categoryId) >
      0 || isItemizedCategory(categoryId)
  )
}

function categoryStatus(categoryId) {
  const count = categoryItemCount(categoryId)
  return count > 0 ? t('liabilities.itemCount', { count }) : t('liabilities.simpleTotal')
}

function categoryValue(categoryId) {
  return formatCurrency(categoryNumericValue(categoryId))
}

function categoryNumericValue(categoryId) {
  return financialYearMonthCategoryValue(
    financialYear.value,
    currentMonth,
    'liabilities',
    categoryId,
    selectedMemberId.value,
  )
}

function isItemizedCategory(categoryId) {
  return categoryItemCount(categoryId) > 0
}
function categoryItemCount(categoryId) {
  return financialYearCategoryItemCount(
    financialYear.value,
    'liabilities',
    categoryId,
    currentMonth,
  )
}
function canonicalCategoryValue(categoryId) {
  return liabilitiesStore.config?.categories?.[categoryId]?.manualValue ?? 0
}
function isCategorySaving(categoryId) {
  return savingCategoryIds.value.has(categoryId)
}

function handleValueClick(event, categoryId) {
  if (!isItemizedCategory(categoryId)) event.stopPropagation()
}

async function saveSimpleCategoryValue(categoryId, value) {
  if (isCategorySaving(categoryId)) return
  savingCategoryIds.value = new Set(savingCategoryIds.value).add(categoryId)
  try {
    await liabilitiesStore.updateSimpleCategoryValue(workspaceId.value, categoryId, value)
  } catch {
    $q.notify({ type: 'negative', message: t('liabilities.errors.save'), position: 'top' })
  } finally {
    const next = new Set(savingCategoryIds.value)
    next.delete(categoryId)
    savingCategoryIds.value = next
  }
}

function openOwnershipEditor(categoryId) {
  if (isItemizedCategory(categoryId)) return
  const ownership = liabilitiesStore.config?.categories?.[categoryId]?.ownership
  if (!ownership) return
  editingOwnershipCategoryId.value = categoryId
  editingOwnership.value = cloneOwnershipAllocation(ownership)
  ownershipValid.value = isValidOwnershipAllocation(editingOwnership.value, memberIds.value)
  ownershipDialog.value = true
}

async function saveSimpleOwnership() {
  if (!editingOwnershipCategoryId.value || !ownershipValid.value) return
  const saved = await persist(() =>
    liabilitiesStore.updateSimpleCategoryOwnership(
      workspaceId.value,
      editingOwnershipCategoryId.value,
      cloneOwnershipAllocation(editingOwnership.value),
      memberIds.value,
    ),
  )
  if (saved) {
    ownershipDialog.value = false
    editingOwnershipCategoryId.value = null
  }
}

function openCategory(categoryId) {
  router.push({
    name: 'liability-category',
    params: { workspaceId: workspaceId.value, category: categoryId },
  })
}

async function persist(action) {
  saving.value = true
  try {
    await action()
    return true
  } catch {
    $q.notify({ type: 'negative', message: t('liabilities.errors.save'), position: 'top' })
    return false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.liabilities-page {
  @include financial-page;
}

.liabilities-shell {
  @include financial-shell(wide);
}

@include financial-overview-list;

.loading-state,
.error-state {
  min-height: 24rem;
}

.error-state h1 {
  margin: 1rem 0 0;
}

.error-state p {
  color: var(--color-copy);
}

.category-icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
}

.category-dialog {
  @include financial-category-dialog-card;
}

.ownership-dialog-card h2 {
  margin-bottom: 1rem;
}
</style>
