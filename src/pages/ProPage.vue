<template>
  <q-page class="pro-page">
    <main class="pro-shell">
      <AppPageHeader :title="t('pro.title')" :subtitle="t('pro.subtitle')" size="hero" />

      <section v-if="entitlementsStore.entitlements.isPro" class="status-card status-card--active">
        <span class="status-icon"><q-icon name="verified" /></span>
        <div>
          <small>{{
            entitlementsStore.entitlements.trial.active
              ? t('pro.trial.activeEyebrow')
              : t('pro.currentPlan')
          }}</small>
          <h2>
            {{
              entitlementsStore.entitlements.trial.active
                ? t('pro.trial.activeTitle', {
                    count: entitlementsStore.entitlements.trial.daysRemaining,
                  })
                : t('pro.activeTitle')
            }}
          </h2>
          <p v-if="entitlementsStore.entitlements.trial.active">
            {{
              t('pro.trial.activeDescription', {
                date: formatDate(entitlementsStore.entitlements.trial.expiresAt),
              })
            }}
          </p>
          <p v-else>{{ t('pro.activeDescription') }}</p>
        </div>
        <q-btn
          v-if="isNativeAndroid && !entitlementsStore.entitlements.trial.active"
          outline
          no-caps
          color="primary"
          :label="t('pro.manage')"
          @click="manageSubscription"
        />
      </section>

      <section
        v-if="
          entitlementsStore.entitlements.trial.eligible && !workspaceStore.activeWorkspaceIsDemo
        "
        class="trial-card"
      >
        <div class="trial-card__copy">
          <small>{{ t('pro.trial.eyebrow') }}</small>
          <h2 class="app-card-title">{{ t('pro.trial.title') }}</h2>
          <p class="app-card-subtitle">{{ t('pro.trial.description') }}</p>
          <ul>
            <li><q-icon name="check_circle" />{{ t('pro.trial.fullAccess') }}</li>
            <li><q-icon name="check_circle" />{{ t('pro.trial.noPayment') }}</li>
            <li><q-icon name="check_circle" />{{ t('pro.trial.noRenewal') }}</li>
            <li><q-icon name="check_circle" />{{ t('pro.trial.dataPreserved') }}</li>
          </ul>
        </div>
        <div class="trial-card__actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="workspace_premium"
            :label="t('pro.trial.startAction')"
            :loading="checkingVerification"
            @click="prepareTrial"
          />
          <q-btn
            v-if="!emailVerified"
            flat
            no-caps
            color="primary"
            :label="t('pro.trial.resendVerification')"
            :loading="sendingVerification"
            @click="resendVerification"
          />
          <span class="app-caption">{{ t('pro.trial.noCommitment') }}</span>
        </div>
      </section>

      <q-banner
        v-else-if="
          entitlementsStore.entitlements.trial.eligible && workspaceStore.activeWorkspaceIsDemo
        "
        rounded
        class="trial-demo-banner"
      >
        <template #avatar><q-icon name="visibility" /></template>
        {{ t('pro.trial.demoUnavailable') }}
        <template #action>
          <q-btn
            flat
            no-caps
            color="primary"
            :label="t('pro.trial.leaveDemo')"
            :to="{ name: 'home', query: { manage: '1' } }"
          />
        </template>
      </q-banner>

      <template v-if="!entitlementsStore.entitlements.isPro">
        <section class="benefits-card">
          <div class="plan-heading">
            <span><q-icon name="workspace_premium" /></span>
            <div>
              <small>{{ t('pro.planEyebrow') }}</small>
              <h2>{{ t('pro.planName') }}</h2>
            </div>
          </div>
          <ul>
            <li v-for="benefit in benefits" :key="benefit">
              <q-icon name="check_circle" />{{ benefit }}
            </li>
          </ul>
        </section>
      </template>

      <section
        v-if="isNativeAndroid && entitlementsStore.entitlements.source !== 'google_play'"
        class="purchase-card"
      >
        <div>
          <small>{{ t('pro.annual') }}</small>
          <strong v-if="annualProduct">{{ annualProduct.priceString }}</strong>
          <q-skeleton v-else-if="loadingCatalog" type="text" width="7rem" height="2.8rem" />
          <strong v-else>{{ t('pro.unavailable') }}</strong>
          <p>{{ t('pro.renewsAnnually') }}</p>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="workspace_premium"
          :label="t('pro.subscribe')"
          :disable="!annualProduct"
          :loading="purchasing"
          @click="subscribe"
        />
        <q-btn
          flat
          no-caps
          color="primary"
          :label="t('pro.restore')"
          :loading="restoring"
          @click="restore"
        />
        <p class="purchase-note">{{ t('pro.playNotice') }}</p>
      </section>

      <section
        v-else-if="!isNativeAndroid && entitlementsStore.entitlements.source !== 'google_play'"
        class="desktop-card"
      >
        <span><q-icon name="smartphone" /></span>
        <div>
          <h2>{{ t('pro.androidTitle') }}</h2>
          <p>{{ t('pro.androidDescription') }}</p>
        </div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="shop"
          :label="t('pro.openPlayStore')"
          :href="PLAY_STORE_URL"
          target="_blank"
          rel="noopener noreferrer"
        />
      </section>

      <q-banner
        v-if="message"
        rounded
        :class="messageTone === 'error' ? 'error-banner' : 'success-banner'"
      >
        <template #avatar>
          <q-icon :name="messageTone === 'error' ? 'error_outline' : 'check_circle'" />
        </template>
        {{ message }}
      </q-banner>
    </main>

    <AppConfirmDialog
      v-model="confirmingTrial"
      :title="t('pro.trial.confirmTitle')"
      :message="t('pro.trial.confirmDescription')"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('pro.trial.startAction')"
      confirm-icon="workspace_premium"
      persistent
      :loading="startingTrial"
      @confirm="activateTrial"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import {
  PLAY_STORE_URL,
  loadAnnualSubscription,
  manageGooglePlaySubscriptions,
  purchaseAnnualSubscription,
  restoreAnnualSubscription,
} from '@/services/google-play-subscriptions'
import { useEntitlementsStore } from '@/stores/entitlements-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { startProTrial } from '@/services/firebase/trial.service'
import { authUser, refreshVerificationStatus, resendVerificationEmail } from '@/services/auth'

const $q = useQuasar()
const { t } = useI18n()
const entitlementsStore = useEntitlementsStore()
const workspaceStore = useWorkspaceStore()
const annualProduct = ref(null)
const loadingCatalog = ref(false)
const purchasing = ref(false)
const restoring = ref(false)
const message = ref('')
const messageTone = ref('success')
const confirmingTrial = ref(false)
const checkingVerification = ref(false)
const sendingVerification = ref(false)
const startingTrial = ref(false)
const isNativeAndroid = computed(() => $q.platform.is.capacitor && $q.platform.is.android)
const emailVerified = computed(() => authUser.value?.emailVerified === true)
const benefits = computed(() => [
  t('pro.benefits.strategy'),
  t('pro.benefits.models'),
  t('pro.benefits.workspaces'),
])

onMounted(loadCatalog)

async function prepareTrial() {
  if (checkingVerification.value) return
  checkingVerification.value = true
  clearMessage()
  try {
    if (!(await refreshVerificationStatus())) {
      showTrialError(t('pro.trial.verifyEmail'))
      return
    }
    confirmingTrial.value = true
  } catch (error) {
    showError(error)
  } finally {
    checkingVerification.value = false
  }
}

async function resendVerification() {
  if (sendingVerification.value) return
  sendingVerification.value = true
  clearMessage()
  try {
    await resendVerificationEmail()
    showSuccess(t('pro.trial.verificationSent'))
  } catch (error) {
    showError(error)
  } finally {
    sendingVerification.value = false
  }
}

async function activateTrial() {
  if (startingTrial.value) return
  startingTrial.value = true
  clearMessage()
  try {
    await startProTrial()
    confirmingTrial.value = false
    entitlementsStore.refreshClock()
    if (authUser.value) await workspaceStore.load(authUser.value, true)
    showSuccess(t('pro.trial.started'))
  } catch (error) {
    showError(error)
  } finally {
    startingTrial.value = false
  }
}

async function loadCatalog() {
  if (!isNativeAndroid.value || entitlementsStore.entitlements.source === 'google_play') return
  loadingCatalog.value = true
  try {
    annualProduct.value = await loadAnnualSubscription()
  } catch (error) {
    showError(error)
  } finally {
    loadingCatalog.value = false
  }
}

async function subscribe() {
  if (!annualProduct.value || purchasing.value) return
  purchasing.value = true
  clearMessage()
  try {
    const result = await purchaseAnnualSubscription(annualProduct.value)
    if (!result.pending && authUser.value) await workspaceStore.load(authUser.value, true)
    showSuccess(result.pending ? t('pro.pending') : t('pro.purchaseComplete'))
  } catch (error) {
    showError(error)
  } finally {
    purchasing.value = false
  }
}

async function restore() {
  if (restoring.value) return
  restoring.value = true
  clearMessage()
  try {
    const result = await restoreAnnualSubscription()
    if (result && authUser.value) await workspaceStore.load(authUser.value, true)
    showSuccess(result ? t('pro.restoreComplete') : t('pro.nothingToRestore'))
  } catch (error) {
    showError(error)
  } finally {
    restoring.value = false
  }
}

async function manageSubscription() {
  try {
    await manageGooglePlaySubscriptions()
  } catch (error) {
    showError(error)
  }
}

function showError(error) {
  messageTone.value = 'error'
  const reason = error?.details?.reason
  const reasons = {
    EMAIL_NOT_VERIFIED: 'pro.trial.verifyEmail',
    PRO_ALREADY_ACTIVE: 'pro.trial.proAlreadyActive',
    TRIAL_ALREADY_USED: 'pro.trial.alreadyUsed',
  }
  message.value = reasons[reason] ? t(reasons[reason]) : error?.message || t('pro.errors.generic')
}

function showTrialError(value) {
  messageTone.value = 'error'
  message.value = value
}

function showSuccess(value) {
  messageTone.value = 'success'
  message.value = value
}

function clearMessage() {
  message.value = ''
}

function formatDate(value) {
  const date = value?.toDate?.() || new Date(value || 0)
  if (!Number.isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
}
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.pro-page {
  padding: clamp(1.25rem, 3vw, 3rem);
}

.pro-shell {
  display: grid;
  gap: 1.25rem;
  width: min(64rem, 100%);
  margin: 0 auto;
}

.status-card,
.trial-card,
.benefits-card,
.purchase-card,
.desktop-card {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-card);
}

.status-card,
.desktop-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: clamp(1.25rem, 3vw, 2rem);
}

.status-card > div,
.desktop-card > div {
  flex: 1;
}

.status-icon,
.desktop-card > span,
.plan-heading > span {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 1rem;
  background: var(--color-blue-soft);
  color: var(--color-primary);
  font-size: 1.8rem;
}

h2,
p {
  margin: 0;
}

h2 {
  margin-top: 0.15rem;
  font-size: 1.4rem;
}

p {
  margin-top: 0.4rem;
  color: var(--color-copy);
  line-height: 1.5;
}

small {
  color: var(--color-muted);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.benefits-card {
  padding: clamp(1.4rem, 3vw, 2.2rem);
}

.trial-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-8);
  padding: var(--card-padding);
}

.trial-card__copy > h2 {
  margin-top: var(--space-1);
}

.trial-card__copy > p {
  margin-top: var(--space-2);
}

.trial-card ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2) var(--space-4);
  margin: var(--space-5) 0 0;
  padding: 0;
  list-style: none;
}

.trial-card li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-copy);
}

.trial-card li .q-icon {
  color: var(--color-success);
}

.trial-card__actions {
  display: grid;
  gap: var(--space-2);
  justify-items: stretch;
  width: min(15rem, 100%);
  text-align: center;
}

.trial-demo-banner {
  border: 1px solid var(--color-primary-border);
  background: var(--color-blue-soft);
  color: var(--color-ink);
}

.plan-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.benefits-card ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.benefits-card li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-copy);
}

.benefits-card li .q-icon {
  color: var(--color-success);
  font-size: 1.25rem;
}

.purchase-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: clamp(1.4rem, 3vw, 2rem);
}

.purchase-card strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 2rem;
}

.purchase-note {
  grid-column: 1 / -1;
  font-size: 0.8rem;
}

.error-banner {
  background: var(--color-red-soft);
  color: var(--color-danger);
}

.success-banner {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}

@media (max-width: bp.$sm-max) {
  .pro-page {
    padding: 1rem;
  }

  .status-card,
  .desktop-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .status-card .q-btn,
  .desktop-card .q-btn {
    width: 100%;
  }

  .benefits-card ul {
    grid-template-columns: 1fr;
  }

  .trial-card {
    grid-template-columns: 1fr;
  }

  .trial-card ul {
    grid-template-columns: 1fr;
  }

  .trial-card__actions {
    width: 100%;
  }

  .purchase-card {
    grid-template-columns: 1fr;
  }

  .purchase-card .q-btn {
    width: 100%;
  }

  .purchase-note {
    grid-column: auto;
  }
}
</style>
