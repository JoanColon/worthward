<template>
  <q-page class="pro-page">
    <main class="pro-shell">
      <AppPageHeader :title="t('pro.title')" :subtitle="t('pro.subtitle')" size="hero" />

      <section v-if="entitlementsStore.entitlements.isPro" class="status-card status-card--active">
        <span class="status-icon"><q-icon name="verified" /></span>
        <div>
          <small>{{ t('pro.currentPlan') }}</small>
          <h2>{{ t('pro.activeTitle') }}</h2>
          <p>{{ t('pro.activeDescription') }}</p>
        </div>
        <q-btn
          v-if="isNativeAndroid"
          outline
          no-caps
          color="primary"
          :label="t('pro.manage')"
          @click="manageSubscription"
        />
      </section>

      <template v-else>
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

        <section v-if="isNativeAndroid" class="purchase-card">
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

        <section v-else class="desktop-card">
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
      </template>

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
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import {
  PLAY_STORE_URL,
  loadAnnualSubscription,
  manageGooglePlaySubscriptions,
  purchaseAnnualSubscription,
  restoreAnnualSubscription,
} from '@/services/google-play-subscriptions'
import { useEntitlementsStore } from '@/stores/entitlements-store'

const $q = useQuasar()
const { t } = useI18n()
const entitlementsStore = useEntitlementsStore()
const annualProduct = ref(null)
const loadingCatalog = ref(false)
const purchasing = ref(false)
const restoring = ref(false)
const message = ref('')
const messageTone = ref('success')
const isNativeAndroid = computed(() => $q.platform.is.capacitor && $q.platform.is.android)
const benefits = computed(() => [
  t('pro.benefits.strategy'),
  t('pro.benefits.models'),
  t('pro.benefits.workspaces'),
])

onMounted(loadCatalog)

async function loadCatalog() {
  if (!isNativeAndroid.value || entitlementsStore.entitlements.isPro) return
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
  message.value = error?.message || t('pro.errors.generic')
}

function showSuccess(value) {
  messageTone.value = 'success'
  message.value = value
}

function clearMessage() {
  message.value = ''
}
</script>

<style scoped lang="scss">
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

@media (max-width: 699px) {
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
