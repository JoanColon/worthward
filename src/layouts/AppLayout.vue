<template>
  <q-layout view="hHh Lpr fFf" class="app-layout">
    <q-header class="app-header" :class="{ 'welcome-header': welcomeChrome }">
      <q-toolbar class="app-toolbar">
        <template v-if="welcomeChrome">
          <img class="welcome-logo" :src="BRAND.logo" :alt="BRAND.name" />
          <q-space />
        </template>
        <template v-else>
          <q-btn
            flat
            round
            dense
            icon="menu"
            :aria-label="t('navigation.workspaces')"
            @click="drawerOpen = !drawerOpen"
          />
          <img class="mini-mark" :src="BRAND.icon" alt="" aria-hidden="true" />
          <q-toolbar-title class="app-title">{{ BRAND.name }}</q-toolbar-title>

          <div v-if="routeWorkspaceId" class="workspace-context-actions">
            <q-btn
              v-if="route.name !== 'workspace-dashboard'"
              flat
              round
              dense
              icon="home"
              class="gt-sm"
              :to="workspaceRoute(routeWorkspaceId)"
              :aria-label="t('navigation.backToWorkspaceHome')"
            >
              <q-tooltip>{{ t('navigation.backToWorkspaceHome') }}</q-tooltip>
            </q-btn>
            <q-separator
              v-if="route.name !== 'workspace-dashboard' && members.length"
              vertical
              class="gt-sm workspace-home-separator"
            />
            <MemberScopeSelector
              v-if="members.length"
              v-model="selectedMemberId"
              :members="members"
              compact
              class="layout-member-selector"
            />
          </div>
        </template>

        <q-btn
          flat
          round
          icon="logout"
          :aria-label="t('navigation.signOut')"
          :loading="loggingOut"
          @click="logout"
        >
          <q-tooltip>{{ t('navigation.signOut') }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="!welcomeChrome"
      v-model="drawerOpen"
      show-if-above
      bordered
      :width="280"
      class="app-drawer"
    >
      <div class="drawer-brand lt-md">
        <img class="drawer-mark" :src="BRAND.icon" alt="" aria-hidden="true" />
        <div>
          <div class="drawer-title">{{ BRAND.name }}</div>
          <div class="drawer-caption">{{ authUser?.email }}</div>
        </div>
      </div>

      <q-list padding class="q-px-sm">
        <q-item
          v-ripple
          clickable
          :to="{ name: 'home', query: { manage: '1' } }"
          exact
          active-class="active-nav-item"
          @click="closeMobileDrawer"
        >
          <q-item-section avatar><q-icon name="space_dashboard" /></q-item-section>
          <q-item-section>{{ t('navigation.manageWorkspaces') }}</q-item-section>
        </q-item>

        <q-item
          v-if="canCreateWorkspace"
          v-ripple
          clickable
          :to="{ name: 'create-workspace' }"
          exact
          active-class="active-nav-item"
          @click="closeMobileDrawer"
        >
          <q-item-section avatar><q-icon name="add_business" /></q-item-section>
          <q-item-section>{{ t('navigation.createWorkspace') }}</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="{ name: 'account' }"
          exact
          active-class="active-nav-item"
          @click="closeMobileDrawer"
        >
          <q-item-section avatar><q-icon name="manage_accounts" /></q-item-section>
          <q-item-section>{{ t('navigation.account') }}</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          :to="{ name: 'pro' }"
          exact
          active-class="active-nav-item"
          @click="closeMobileDrawer"
        >
          <q-item-section avatar><q-icon name="workspace_premium" /></q-item-section>
          <q-item-section>{{ t('navigation.pro') }}</q-item-section>
          <q-item-section v-if="entitlementsStore.entitlements.isPro" side>
            <q-badge
              color="positive"
              :label="
                entitlementsStore.entitlements.trial.active
                  ? t('pro.trial.menuBadge', {
                      count: entitlementsStore.entitlements.trial.daysRemaining,
                    })
                  : t('pro.activeBadge')
              "
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-separator class="q-my-sm" />

      <div v-if="workspaceStore.realWorkspaces.length" class="workspace-list">
        <div class="workspace-list-label">{{ t('navigation.switchWorkspace') }}</div>
        <q-list dense>
          <q-item
            v-for="workspace in workspaceStore.realWorkspaces"
            :key="workspace.id"
            v-ripple
            clickable
            exact
            :active="workspace.id === activeWorkspaceId"
            active-class="active-workspace"
            @click="switchWorkspace(workspace.id)"
          >
            <q-item-section avatar>
              <q-icon :name="isSharedWorkspace(workspace) ? 'group' : 'person_outline'" />
            </q-item-section>
            <q-item-section>
              {{ workspace.name }}
            </q-item-section>
            <q-item-section v-if="workspace.id === activeWorkspaceId" side>
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <template v-if="activeWorkspaceId">
        <q-separator class="q-my-sm" />
        <div class="workspace-list-label">
          {{ activeWorkspace?.name }}
          <q-badge
            v-if="activeWorkspaceIsDemo"
            outline
            color="primary"
            :label="t('workspace.demo.readOnly')"
          />
        </div>
        <nav class="workspace-navigation" :aria-label="t('navigation.financialWorkspace')">
          <q-tree
            v-model:expanded="expandedNavigationNodes"
            :nodes="workspaceNavigationNodes"
            :selected="activeNavigationNode"
            node-key="key"
            no-connectors
            no-selection-unset
            selected-color="primary"
            class="workspace-navigation-tree"
          />
        </nav>
      </template>
    </q-drawer>

    <q-page-container>
      <q-banner v-if="showDemoEntryBanner" class="demo-entry-banner">
        <template #avatar><q-icon name="visibility" /></template>
        <div class="demo-entry-copy">
          <strong>{{ t('workspace.demo.bannerTitle') }}</strong>
          <span>{{ t('workspace.demo.bannerDescription') }}</span>
        </div>
        <template #action>
          <q-btn
            v-if="!workspaceStore.hasWorkspaces"
            flat
            no-caps
            color="primary"
            :label="t('workspace.demo.backToWelcome')"
            :to="{ name: 'home' }"
          />
          <q-btn
            v-if="canCreateWorkspace"
            unelevated
            no-caps
            color="primary"
            :label="t('workspace.demo.createAction')"
            :to="{ name: 'create-workspace' }"
          />
        </template>
      </q-banner>
      <div v-if="workspaceStore.loading" class="loading-state">
        <q-spinner color="primary" size="2rem" />
        <span>{{ t('home.loadingWorkspace') }}</span>
      </div>
      <div v-else-if="workspaceStore.error" class="loading-state">
        <q-icon name="cloud_off" size="2rem" />
        <span>{{ t('workspace.errors.load') }}</span>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          :label="t('common.retry')"
          @click="loadWorkspaces(true)"
        />
      </div>
      <ProFeatureGate
        v-else-if="workspaceStore.ready"
        :locked="proFeatureLocked"
        :action-label="proGateActionLabel"
      >
        <router-view :key="`${route.fullPath}:${financialPeriodKey}`" />
      </ProFeatureGate>
    </q-page-container>

    <q-footer v-if="showMobileNavigation" class="mobile-footer">
      <MobileBottomNav />
    </q-footer>

    <LearnPanel />

    <AppConfirmDialog
      v-model="trialEndedDialog"
      :title="t('pro.trial.endedTitle')"
      :cancel-label="t('pro.trial.continueFree')"
      :confirm-label="t('pro.trial.continuePro')"
      confirm-icon="workspace_premium"
      persistent
      width="34rem"
      @confirm="continueWithPro"
    >
      <p>{{ t('pro.trial.endedDescription') }}</p>
      <p>
        <strong>{{ t('pro.trial.dataPreservedTitle') }}</strong>
      </p>
      <p>{{ t('pro.trial.dataPreservedDescription') }}</p>
    </AppConfirmDialog>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import MemberScopeSelector from '@/components/dashboard/MemberScopeSelector.vue'
import LearnPanel from '@/components/learn/LearnPanel.vue'
import MobileBottomNav from '@/components/dashboard/MobileBottomNav.vue'
import ProFeatureGate from '@/components/layout/ProFeatureGate.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useLearn } from '@/composables/useLearn'
import { BRAND } from '@/config/brand'
import {
  currentFinancialDate,
  currentFinancialYear,
} from '../../functions/shared/positions/annual-projection.js'
import { authUser, signOut } from '@/services/auth'
import { resolveWorkspaceHasPro } from '@/domain/access/workspace-entitlements'
import { hideNativeSplashWhenReady } from '@/services/splash-screen'
import { restoreAnnualSubscription } from '@/services/google-play-subscriptions'
import { claimProTrialEndNotice } from '@/services/firebase/trial.service'
import { syncWorkspaceInvestmentPortfolios } from '@/services/firebase/investment-portfolios.service'
import { useAssetsStore } from '@/stores/assets-store'
import { useExpensesStore } from '@/stores/expenses-store'
import { useEntitlementsStore } from '@/stores/entitlements-store'
import { useExpenseTrackingStore } from '@/stores/expense-tracking-store'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useIncomeStore } from '@/stores/income-store'
import { useLiabilitiesStore } from '@/stores/liabilities-store'
import { useMilestonesStore } from '@/stores/milestones-store'
import { useQuickLinksStore } from '@/stores/quick-links-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useWhatIfStore } from '@/stores/what-if-store'
import { setWorkspaceCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'
import { isDemoWorkspaceId } from '@/domain/access/demo-workspace'
import { financialYearForWorkspace } from '@/domain/access/demo-workspace'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const assetsStore = useAssetsStore()
const expensesStore = useExpensesStore()
const entitlementsStore = useEntitlementsStore()
const expenseTrackingStore = useExpenseTrackingStore()
const liabilitiesStore = useLiabilitiesStore()
const incomeStore = useIncomeStore()
const milestonesStore = useMilestonesStore()
const quickLinksStore = useQuickLinksStore()
const scopeStore = useFinancialScopeStore()
const financialYearsStore = useFinancialYearsStore()
const workspaceStore = useWorkspaceStore()
const whatIfStore = useWhatIfStore()
const { closeLearn } = useLearn()

const drawerOpen = ref($q.screen.gt.sm)
const loggingOut = ref(false)
const trialEndedDialog = ref(false)
const claimingTrialEndNotice = ref(false)
const financialPeriodKey = ref(currentPeriodKey())
const expandedNavigationNodes = ref(['your-money'])
let periodTimer = null
let workspaceSyncId = 0
const portfolioSyncStarted = new Set()
const activeWorkspaceId = computed(() => workspaceStore.activeWorkspaceId)
const activeWorkspace = computed(() => workspaceStore.activeWorkspace)
const activeWorkspaceIsDemo = computed(() => workspaceStore.activeWorkspaceIsDemo)
const ownedWorkspaceCount = computed(
  () =>
    workspaceStore.workspaces.filter(
      (workspace) => workspace.members?.[authUser.value?.uid]?.role === 'owner',
    ).length,
)
const canCreateWorkspace = computed(
  () => entitlementsStore.entitlements.isPro || ownedWorkspaceCount.value === 0,
)
const welcomeChrome = computed(
  () => route.name === 'home' && (!workspaceStore.ready || !workspaceStore.hasWorkspaces),
)
const members = computed(() => getWorkspaceMembers(activeWorkspace.value))
const memberIds = computed(() => members.value.map(({ id }) => id))
const selectedMemberId = computed({
  get: () => scopeStore.get(activeWorkspaceId.value, memberIds.value, authUser.value?.uid),
  set: (memberId) => scopeStore.select(activeWorkspaceId.value, memberId),
})
const routeWorkspaceId = computed(() => {
  const workspaceId = route.params.workspaceId
  if (typeof workspaceId !== 'string') return null

  return workspaceStore.workspaces.some((workspace) => workspace.id === workspaceId)
    ? workspaceId
    : null
})
const workspaceHasPro = computed(() =>
  resolveWorkspaceHasPro(activeWorkspace.value, { now: entitlementsStore.now }),
)
const proFeatureLocked = computed(() =>
  Boolean(route.meta.requiresPro && routeWorkspaceId.value && !workspaceHasPro.value),
)
const proGateActionLabel = computed(() =>
  entitlementsStore.entitlements.trial.eligible ? t('pro.trial.startAction') : t('pro.gate.action'),
)
const showMobileNavigation = computed(() => $q.screen.lt.md && Boolean(routeWorkspaceId.value))
const showDemoEntryBanner = computed(() =>
  Boolean(routeWorkspaceId.value && activeWorkspaceIsDemo.value),
)
const activeNavigationNode = computed(() => {
  const routeNodes = {
    'workspace-dashboard': 'workspace-home',
    assets: 'assets',
    'asset-category': 'assets',
    'investment-portfolio': 'assets',
    liabilities: 'liabilities',
    'liability-category': 'liabilities',
    income: 'income',
    'income-category': 'income',
    expenses: 'expenses',
    'expense-category': 'expenses',
    'expense-tracker': 'expenses',
    plan: 'plan',
    'what-if': 'plan',
    'what-if-strategy': 'plan',
    progress: 'progress',
    achievements: 'progress',
    setup: 'setup',
  }

  return routeNodes[route.name] || null
})
const workspaceNavigationNodes = computed(() => {
  if (!activeWorkspaceId.value) return []

  return [
    navigationLeaf('workspace-home', 'navigation.home', 'home', 'workspace-dashboard'),
    {
      key: 'your-money',
      label: t('navigation.yourMoney'),
      icon: 'account_balance',
      selectable: false,
      children: [
        navigationLeaf('assets', 'navigation.assets', 'inventory_2', 'assets'),
        navigationLeaf('liabilities', 'navigation.liabilities', 'request_quote', 'liabilities'),
        navigationLeaf('income', 'navigation.income', 'payments', 'income'),
        navigationLeaf('expenses', 'navigation.expenses', 'credit_card', 'expenses'),
      ],
    },
    navigationLeaf('plan', 'navigation.plan', 'route', 'plan'),
    navigationLeaf('progress', 'navigation.progress', 'bar_chart', 'progress'),
    ...(activeWorkspaceIsDemo.value
      ? []
      : [navigationLeaf('setup', 'navigation.setup', 'tune', 'setup')]),
  ]
})

onMounted(async () => {
  periodTimer = setInterval(refreshFinancialPeriod, 60_000)
  document.addEventListener('visibilitychange', revalidateMilestonesOnResume)
  window.addEventListener('focus', revalidateMilestonesOnResume)
  if (!authUser.value) {
    await finishNativeStartup()
    return
  }

  entitlementsStore.start(authUser.value.uid)
  await loadWorkspaces()
  void revalidateNativeSubscription()
  await finishNativeStartup()
})

onBeforeUnmount(() => {
  closeLearn()
  clearInterval(periodTimer)
  document.removeEventListener('visibilitychange', revalidateMilestonesOnResume)
  window.removeEventListener('focus', revalidateMilestonesOnResume)
})

watch(() => route.fullPath, syncWorkspaceFromRoute)
watch(authUser, handleAuthChange)
watch(
  () => [entitlementsStore.ready, entitlementsStore.entitlements],
  () => void maybeShowTrialEnded(),
  { deep: true },
)
watch(
  () => activeWorkspace.value?.currency,
  (currency) => setWorkspaceCurrency(currency),
  { immediate: true },
)
watch(
  [routeWorkspaceId, financialPeriodKey],
  ([workspaceId]) => synchronizeWorkspace(workspaceId),
  {
    immediate: true,
  },
)

async function handleAuthChange(user, previousUser) {
  if (!user) {
    resetApplicationState()
    if (!loggingOut.value && route.meta.requiresAuth) await router.replace({ name: 'login' })
    return
  }

  if (previousUser?.uid !== user.uid) {
    if (previousUser?.uid) resetApplicationState()
    entitlementsStore.start(user.uid)
    await loadWorkspaces()
    void revalidateNativeSubscription()
  }
}

async function syncWorkspaceFromRoute() {
  if (!workspaceStore.ready) return

  const workspaceId = route.params.workspaceId
  if (typeof workspaceId !== 'string') {
    financialYearsStore.stopWatching()
    if (route.name === 'home' && route.query.manage !== '1' && workspaceStore.activeWorkspaceId) {
      await router.replace(workspaceRoute(workspaceStore.activeWorkspaceId))
    }
    return
  }

  if (await workspaceStore.setActiveWorkspace(workspaceId)) return

  financialYearsStore.stopWatching()
  await router.replace({ name: 'home' })
}

async function loadWorkspaces(force = false) {
  if (!authUser.value) return
  try {
    await workspaceStore.load(authUser.value, force)
    await syncWorkspaceFromRoute()
  } catch {
    return
  }
}

async function switchWorkspace(workspaceId) {
  if (!(await workspaceStore.setActiveWorkspace(workspaceId))) return

  closeMobileDrawer()
  await router.push(workspaceRoute(workspaceId))
}

function workspaceRoute(workspaceId) {
  return { name: 'workspace-dashboard', params: { workspaceId } }
}

function navigationLeaf(key, labelKey, icon, routeName) {
  return {
    key,
    label: t(labelKey),
    icon,
    handler: () => openNavigationRoute(routeName),
  }
}

async function openNavigationRoute(routeName) {
  closeMobileDrawer()
  await router.push({ name: routeName, params: { workspaceId: activeWorkspaceId.value } })
}

function closeMobileDrawer() {
  if ($q.screen.lt.md) drawerOpen.value = false
}

function isSharedWorkspace(workspace) {
  return Object.keys(workspace.members || {}).length > 1
}

async function logout() {
  loggingOut.value = true

  try {
    await signOut()
    resetApplicationState()
    await router.replace({ name: 'login' })
  } finally {
    loggingOut.value = false
  }
}

function resetApplicationState() {
  setWorkspaceCurrency('EUR')
  portfolioSyncStarted.clear()
  assetsStore.reset()
  expensesStore.reset()
  entitlementsStore.reset()
  expenseTrackingStore.reset()
  liabilitiesStore.reset()
  incomeStore.reset()
  milestonesStore.reset()
  quickLinksStore.reset()
  scopeStore.reset()
  financialYearsStore.reset()
  workspaceStore.reset()
  whatIfStore.reset()
}

function refreshFinancialPeriod() {
  financialPeriodKey.value = currentPeriodKey()
}

async function synchronizeWorkspace(workspaceId) {
  if (!workspaceId || !authUser.value) {
    return
  }
  const syncId = ++workspaceSyncId
  const portfolioSync =
    workspaceHasPro.value && !isDemoWorkspaceId(workspaceId)
      ? syncPortfoliosOnOpen(workspaceId)
      : null

  try {
    await financialYearsStore.load(
      workspaceId,
      financialYearForWorkspace(workspaceId, currentFinancialYear()),
    )
    if (!workspaceSyncIsCurrent(workspaceId, syncId)) return
    await Promise.all([
      assetsStore.refreshLoadedCategories(workspaceId),
      liabilitiesStore.refreshLoadedCategories(workspaceId),
    ])
    if (!workspaceSyncIsCurrent(workspaceId, syncId)) return
    if (portfolioSync) void applyPortfolioSync(workspaceId, syncId, portfolioSync)
  } catch {
    // The destination page exposes the financial-year error and retry action.
  }
}

async function applyPortfolioSync(workspaceId, syncId, portfolioSync) {
  const result = await portfolioSync
  if (!workspaceSyncIsCurrent(workspaceId, syncId)) return
  for (const portfolio of result?.results || []) {
    assetsStore.applyInvestmentPortfolioSync(portfolio.assetId, portfolio)
  }
  await assetsStore.refreshLoadedCategories(workspaceId)
}

function workspaceSyncIsCurrent(workspaceId, syncId) {
  return syncId === workspaceSyncId && activeWorkspaceId.value === workspaceId
}

async function syncPortfoliosOnOpen(workspaceId) {
  if (portfolioSyncStarted.has(workspaceId)) return null
  portfolioSyncStarted.add(workspaceId)
  try {
    const result = await syncWorkspaceInvestmentPortfolios(workspaceId)
    if (result?.failures?.length) portfolioSyncStarted.delete(workspaceId)
    return result
  } catch {
    portfolioSyncStarted.delete(workspaceId)
    return null
  }
}

function revalidateMilestonesOnResume() {
  if (document.visibilityState !== 'visible' || !authUser.value) return
  entitlementsStore.refreshClock()
  void loadWorkspaces(true)
  if (activeWorkspaceIsDemo.value) return
  milestonesStore.revalidateAchievements()
}

async function maybeShowTrialEnded() {
  const entitlement = entitlementsStore.entitlements
  if (
    !entitlementsStore.ready ||
    claimingTrialEndNotice.value ||
    entitlement.isPro ||
    !entitlement.trial.used ||
    entitlement.trial.active ||
    entitlement.trial.endedNoticeShown
  ) {
    return
  }
  claimingTrialEndNotice.value = true
  try {
    const result = await claimProTrialEndNotice()
    if (result.shouldShow) trialEndedDialog.value = true
  } catch {
    // The notice can be claimed on a later foreground session.
  } finally {
    claimingTrialEndNotice.value = false
  }
}

async function continueWithPro() {
  trialEndedDialog.value = false
  await router.push({ name: 'pro' })
}

async function revalidateNativeSubscription() {
  if (!$q.platform.is.capacitor || !$q.platform.is.android) return
  try {
    const result = await restoreAnnualSubscription()
    if (result) await loadWorkspaces(true)
  } catch {
    // Scheduled server reconciliation remains authoritative if Google Play is unavailable.
  }
}

function currentPeriodKey() {
  return `${currentFinancialYear()}-${currentFinancialDate()}`
}

async function finishNativeStartup() {
  try {
    await hideNativeSplashWhenReady()
  } catch {
    // The splash watchdog will retry without blocking the web app.
  }
}
</script>

<style scoped lang="scss">
.app-layout {
  background: var(--color-page);
}

.app-header {
  background: var(--color-surface-raised);
  color: var(--color-ink);
  border-bottom: 1px solid var(--color-line);
  backdrop-filter: blur(12px);
}

.app-toolbar {
  min-height: 64px;
  gap: 0.5rem;
  padding-right: max(1rem, env(safe-area-inset-right));
  padding-left: max(1rem, env(safe-area-inset-left));
}

.welcome-header {
  box-shadow: none;
}

.welcome-header .app-toolbar {
  width: min(100%, 72rem);
  margin: 0 auto;
}

.welcome-logo {
  display: block;
  width: 9.25rem;
  height: 2.1rem;
  object-fit: contain;
  object-position: left center;
}

.mini-mark,
.drawer-mark {
  display: block;
  object-fit: contain;
}

.mini-mark {
  width: 2.25rem;
  height: 2.25rem;
  margin-left: 0.5rem;
}

.app-title {
  font-family: var(--font-family-display);
  font-size: 1.2rem;
}

.workspace-context-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.workspace-home-separator {
  height: 2rem;
  color: var(--color-line);
}

.layout-member-selector {
  flex: 0 0 auto;
}

.app-drawer {
  background: var(--color-surface);
  color: var(--color-ink);
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.35rem 1.25rem;
}

.drawer-mark {
  width: 2.6rem;
  height: 2.6rem;
}

.drawer-title {
  font-family: Georgia, serif;
  font-size: 1.15rem;
}

.drawer-caption {
  overflow: hidden;
  max-width: 11rem;
  color: var(--color-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
}

.active-nav-item,
.active-workspace {
  border-radius: 0.8rem;
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
}

.mobile-footer {
  background: transparent;
  color: var(--color-ink);
}

.demo-entry-banner {
  border-bottom: 1px solid var(--color-primary-border);
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
}

.demo-entry-banner :deep(.q-banner__content) {
  min-height: 3.5rem;
}

.demo-entry-copy {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.demo-entry-copy strong {
  color: var(--color-ink);
}

.demo-entry-copy span {
  color: var(--color-copy);
  font-size: var(--font-size-caption);
}

.workspace-list {
  padding: 0.5rem 0.75rem;
}

.workspace-list-label {
  padding: 0.5rem 0.75rem;
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.workspace-navigation {
  padding: 0 0.75rem 0.75rem;
}

.workspace-navigation-tree {
  color: var(--color-ink);
}

.workspace-navigation-tree :deep(.q-tree__node-header) {
  min-height: 2.65rem;
  margin-bottom: 0.15rem;
  padding: 0.35rem 0.6rem;
  border-radius: 0.8rem;
}

.workspace-navigation-tree :deep(.q-tree__node-header-content) {
  font-size: 0.9rem;
  font-weight: 600;
}

.workspace-navigation-tree :deep(.q-tree__children .q-tree__node-header-content) {
  font-weight: 500;
}

.workspace-navigation-tree :deep(.q-tree__node-header.q-tree__node--selected) {
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
}

.workspace-navigation-tree :deep(.q-tree__arrow) {
  color: var(--color-muted);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  color: var(--color-copy);
}

@media (max-width: 699px) {
  .app-toolbar {
    min-height: calc(56px + env(safe-area-inset-top));
    padding-top: env(safe-area-inset-top);
  }

  .mini-mark,
  .app-title {
    display: none;
  }

  .welcome-logo {
    width: 8.15rem;
    height: 1.85rem;
  }

  .demo-entry-banner :deep(.q-banner__content) {
    min-height: 0;
  }

  .demo-entry-banner :deep(.q-banner__actions) {
    padding-top: var(--space-2);
  }

  .demo-entry-copy {
    display: grid;
    gap: 0.1rem;
  }

  .layout-member-selector {
    max-width: 42vw;
  }

  .loading-state {
    min-height: calc(100dvh - 56px - env(safe-area-inset-top));
  }
}
</style>
