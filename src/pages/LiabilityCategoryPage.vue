<template>
  <q-page class="category-page">
    <main class="category-shell">
      <div v-if="pageLoading" class="loading-state">
        <q-spinner color="primary" size="2rem" /><span>{{ t('liabilities.loading') }}</span>
      </div>
      <section v-else-if="pageError || liabilitiesStore.error" class="error-state">
        <q-icon name="cloud_off" />
        <h1>{{ t('liabilities.errors.loadTitle') }}</h1>
        <p>{{ t('liabilities.errors.load') }}</p>
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
          :back-label="t('liabilities.backToLiabilities')"
          :back-to="liabilitiesRoute"
        />

        <FinancialCategoryOverviewCard
          tone="liabilities"
          :icon="category.icon"
          :label="t('liabilities.total')"
          :formatted-total="formatCurrency(categoryTotal)"
          :secondary-label="itemSummary"
          :chart-title="t('liabilities.categoryDetail.breakdownTitle')"
          :empty-label="t('liabilities.categoryDetail.breakdownEmpty')"
          :entries="breakdownEntries"
          :total="categoryTotal"
        />

        <section v-if="allCategoryLiabilities.length" class="position-list">
          <div class="detail-table-heading" aria-hidden="true">
            <span>{{ t('liabilities.categoryDetail.item') }}</span>
            <span>{{ t('liabilities.categoryDetail.currentBalance') }}</span>
            <span></span>
          </div>
          <article
            v-for="liability in scopedLiabilities"
            :key="liability.id"
            class="position-row"
            role="button"
            tabindex="0"
            @click="edit(liability)"
            @keydown.enter.self="edit(liability)"
            @keydown.space.self.prevent="edit(liability)"
          >
            <div class="position-main">
              <span class="position-icon"><q-icon :name="category.icon" /></span>
              <span class="position-copy"
                ><strong>{{ liabilitySubcategoryLabel(liability) }}</strong
                ><small>{{ liability.itemName }}</small></span
              >
            </div>
            <strong class="position-value">{{ formatCurrency(liability.scopedValue) }}</strong>
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              color="grey-7"
              :aria-label="t('liabilities.moreActions', { name: liability.itemName })"
              @click.stop
            >
              <q-menu anchor="bottom right" self="top right">
                <q-list dense class="position-menu">
                  <q-item clickable v-close-popup @click="edit(liability)"
                    ><q-item-section avatar><q-icon name="edit" /></q-item-section
                    ><q-item-section>{{ t('liabilities.editDetails') }}</q-item-section></q-item
                  >
                  <q-item
                    v-if="categoryId === 'mortgage'"
                    clickable
                    v-close-popup
                    @click="openModel(liability)"
                  >
                    <q-item-section avatar><q-icon name="account_tree" /></q-item-section>
                    <q-item-section>{{ t('liabilities.model') }}</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    class="text-negative"
                    @click="requestDelete(liability)"
                    ><q-item-section avatar><q-icon name="delete_outline" /></q-item-section
                    ><q-item-section>{{ t('common.delete') }}</q-item-section></q-item
                  >
                </q-list>
              </q-menu>
            </q-btn>
          </article>
          <button type="button" class="add-row" @click="add">
            <q-icon name="add" /><span>{{ t(category.addLabelKey) }}</span>
          </button>
        </section>

        <AppEmptyState
          v-else
          :icon="category.icon"
          :title="t('liabilities.empty.contextualTitle', { items: t(category.itemNamePluralKey) })"
          :description="t('liabilities.empty.description')"
          :action-label="t(category.addLabelKey)"
          tone="negative"
          @action="add"
        />
      </template>
    </main>

    <q-dialog v-model="liabilityDialog" persistent :maximized="$q.screen.lt.sm">
      <LiabilityForm
        :category="category"
        :liability="editingLiability"
        :defaults="liabilityDefaults"
        :members="members"
        :saving="formSaving"
        @save="saveLiability"
        @cancel="closeLiabilityDialog"
        @delete="requestDelete(editingLiability)"
      />
    </q-dialog>

    <AppConfirmDialog
      v-model="confirmDelete"
      :title="t('liabilities.delete.title')"
      :message="t('liabilities.delete.description', { name: deletingLiability?.itemName })"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('common.delete')"
      confirm-color="negative"
      confirm-first
      actions-align="between"
      persistent
      :loading="formSaving"
      @confirm="deleteLiability"
    />
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LiabilityForm from '@/components/liabilities/LiabilityForm.vue'
import FinancialCategoryOverviewCard from '@/components/financial/FinancialCategoryOverviewCard.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { getLiabilityCategory } from '@/config/liability-categories'
import {
  currentFinancialMonth,
  currentFinancialYear,
  financialYearMonthCategoryValue,
} from '../../functions/shared/positions/annual-projection.js'
import { authUser } from '@/services/auth'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useLiabilitiesStore } from '@/stores/liabilities-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import {
  moneyForOwnershipScope,
  cloneOwnershipAllocation,
  createEqualMemberOwnership,
  createSingleMemberOwnership,
} from '../../functions/shared/core/ownership.js'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const liabilitiesStore = useLiabilitiesStore()
const financialYearsStore = useFinancialYearsStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const preparing = ref(false)
const pageError = ref(null)
const liabilityDialog = ref(false)
const editingLiability = ref(null)
const deletingLiability = ref(null)
const confirmDelete = ref(false)
const formSaving = ref(false)
let preparationId = 0
const currentYear = currentFinancialYear()
const currentMonth = currentFinancialMonth()

const workspaceId = computed(() => String(route.params.workspaceId))
const categoryId = computed(() => String(route.params.category))
const liabilitiesRoute = computed(() => ({
  name: 'liabilities',
  params: { workspaceId: workspaceId.value },
}))
const category = computed(() => getLiabilityCategory(categoryId.value))
const categoryConfig = computed(() => liabilitiesStore.config?.categories?.[categoryId.value])
const workspace = computed(
  () => workspaceStore.workspaces.find((candidate) => candidate.id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map((member) => member.id))
const selectedMemberId = computed({
  get: () => scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
  set: (memberId) => scopeStore.select(workspaceId.value, memberId),
})
const allCategoryLiabilities = computed(() => liabilitiesStore.itemsForCategory(categoryId.value))
const financialYear = computed(() => financialYearsStore.get(workspaceId.value, currentYear))
const liabilityDefaults = computed(() => {
  const config = categoryConfig.value
  if (!config) return null
  const firstItem = allCategoryLiabilities.value.length === 0
  const ownership =
    memberIds.value.length === 1
      ? createSingleMemberOwnership(authUser.value?.uid)
      : cloneOwnershipAllocation(
          firstItem ? config.ownership : createEqualMemberOwnership(memberIds.value),
        )
  return {
    categoryId: category.value?.id,
    subcategoryId: category.value?.subcategories?.[0] || null,
    itemName: '',
    notes: '',
    balance: firstItem ? (config.manualValue ?? 0) : 0,
    ownership,
  }
})
const scopedLiabilities = computed(() =>
  allCategoryLiabilities.value
    .map((liability) => ({
      ...liability,
      scopedValue: moneyForOwnershipScope(
        liability.balance,
        liability.ownership,
        selectedMemberId.value,
      ),
    }))
    .sort((left, right) => Number(right.scopedValue || 0) - Number(left.scopedValue || 0)),
)
const categoryTotal = computed(() =>
  financialYearMonthCategoryValue(
    financialYear.value,
    currentMonth,
    'liabilities',
    categoryId.value,
    selectedMemberId.value,
  ),
)
const breakdownEntries = computed(() =>
  scopedLiabilities.value.map((liability) => ({
    id: liability.id,
    name: liability.itemName || liabilitySubcategoryLabel(liability),
    value: Number(liability.scopedValue || 0),
  })),
)
const itemSummary = computed(() => {
  const count = allCategoryLiabilities.value.length
  const key = count === 1 ? category.value.itemNameKey : category.value.itemNamePluralKey
  return t('liabilities.itemSummary', { count, items: t(key) })
})
const pageLoading = computed(
  () => preparing.value || liabilitiesStore.loading || liabilitiesStore.categoryLoading,
)

watch([workspaceId, categoryId], () => preparePage(), { immediate: true })

async function preparePage(force = false) {
  const currentPreparation = ++preparationId
  preparing.value = true
  pageError.value = null
  try {
    await Promise.all([
      liabilitiesStore.loadConfig(workspaceId.value, force),
      financialYearsStore.load(workspaceId.value, currentYear, force),
    ])
    if (currentPreparation !== preparationId) return
    if (!liabilitiesStore.setupCompleted || !category.value || !categoryConfig.value?.enabled) {
      await router.replace(liabilitiesRoute.value)
      return
    }
    await liabilitiesStore.loadCategory(workspaceId.value, categoryId.value, force)
  } catch (error) {
    pageError.value = error
  } finally {
    if (currentPreparation === preparationId) preparing.value = false
  }
}

function add() {
  editingLiability.value = null
  liabilityDialog.value = true
}
function edit(liability) {
  editingLiability.value = liability
  liabilityDialog.value = true
}
function openModel(liability) {
  router.push({
    name: 'mortgage-detail',
    params: { workspaceId: workspaceId.value, liabilityId: liability.id },
  })
}
function closeLiabilityDialog() {
  liabilityDialog.value = false
  editingLiability.value = null
}

function liabilitySubcategoryLabel(liability) {
  return liability?.subcategoryId ? t(`liabilities.categories.${liability.subcategoryId}.name`) : ''
}

async function saveLiability(payload) {
  if (formSaving.value) return
  const liabilityId = editingLiability.value?.id
  formSaving.value = true
  const saved = await persist(() =>
    liabilityId
      ? liabilitiesStore.editLiability(workspaceId.value, liabilityId, payload, memberIds.value)
      : liabilitiesStore.addLiability(workspaceId.value, payload, memberIds.value),
  )
  formSaving.value = false
  if (saved) closeLiabilityDialog()
}

function requestDelete(liability) {
  if (!liability) return
  deletingLiability.value = liability
  confirmDelete.value = true
}

async function deleteLiability() {
  if (!deletingLiability.value) return
  formSaving.value = true
  const saved = await persist(() =>
    liabilitiesStore.deleteLiability(workspaceId.value, deletingLiability.value.id),
  )
  formSaving.value = false
  if (saved) {
    confirmDelete.value = false
    deletingLiability.value = null
    closeLiabilityDialog()
  }
}

async function persist(action) {
  try {
    await action()
    $q.notify({ type: 'positive', message: t('liabilities.saved'), position: 'top' })
    return true
  } catch {
    $q.notify({ type: 'negative', message: t('liabilities.errors.save'), position: 'top' })
    return false
  }
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.category-page {
  @include financial-page;
}

.category-shell {
  @include financial-shell(wide);
}

@include position-category-detail;
@include financial-detail-table-heading(minmax(14rem, 1fr) auto auto);

.position-icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
}

.position-value {
  min-width: 7rem;
  text-align: right;
}

.position-menu {
  min-width: 11rem;
}

.add-row {
  min-height: 4.6rem;
  padding: 0.9rem 1.4rem;
  font-weight: 750;
}

.add-row .q-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
}

@media (max-width: bp.$sm-max) {
  .position-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    @include mobile-financial-row;
  }

  .position-main {
    grid-column: 1;
    gap: 0.6rem;
  }

  .position-value {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
    font-size: 0.95rem;
  }

  .position-row > .q-btn {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>
