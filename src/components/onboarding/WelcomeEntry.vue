<template>
  <main class="welcome-shell">
    <header class="welcome-intro">
      <p class="app-section-label welcome-eyebrow">{{ t('welcome.eyebrow') }}</p>
      <h1 class="app-page-title app-page-title--hero">{{ t('welcome.title') }}</h1>
      <p class="app-page-subtitle welcome-subtitle">
        <span class="desktop-copy">{{ t('welcome.subtitle') }}</span>
        <span class="mobile-copy">{{ t('welcome.mobileSubtitle') }}</span>
      </p>
    </header>

    <q-banner v-if="demoError" rounded class="demo-error" role="alert">
      <template #avatar><q-icon name="cloud_off" color="negative" /></template>
      <div>{{ t('welcome.demo.error') }}</div>
      <template #action>
        <q-btn flat no-caps color="primary" :label="t('common.retry')" @click="exploreDemo" />
      </template>
    </q-banner>

    <section class="entry-grid" :aria-label="t('welcome.optionsLabel')">
      <AppCard class="entry-card entry-card--demo" tone="positive">
        <div class="financial-preview" aria-hidden="true">
          <div class="preview-heading">
            <div>
              <span class="app-caption">{{ t('welcome.demo.previewLabel') }}</span>
              <strong class="preview-value">€205,032</strong>
            </div>
            <span class="preview-change">
              <q-icon name="north_east" />
              +12.0%
            </span>
          </div>
          <svg class="history-chart" viewBox="0 0 520 118" preserveAspectRatio="none">
            <defs>
              <linearGradient id="welcome-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="var(--color-success)" stop-opacity="0.22" />
                <stop offset="1" stop-color="var(--color-success)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path
              class="chart-grid"
              d="M0 28.5H520M0 68.5H520M0 108.5H520"
              vector-effect="non-scaling-stroke"
            />
            <path
              class="chart-area"
              d="M0 98 C42 101 65 78 104 82 S164 60 204 67 S271 47 311 51 S374 39 414 31 S477 23 520 9 L520 118 L0 118 Z"
            />
            <path
              class="chart-line"
              d="M0 98 C42 101 65 78 104 82 S164 60 204 67 S271 47 311 51 S374 39 414 31 S477 23 520 9"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <span class="fictional-data">
            <q-icon name="info_outline" />
            {{ t('welcome.demo.fictional') }}
          </span>
        </div>

        <div class="entry-copy">
          <h2 class="app-card-title">{{ t('welcome.demo.title') }}</h2>
          <p class="app-card-subtitle">
            <span class="desktop-copy">{{ t('welcome.demo.description') }}</span>
            <span class="mobile-copy">{{ t('welcome.demo.mobileDescription') }}</span>
          </p>
          <ul class="benefit-list">
            <li v-for="benefit in demoBenefits" :key="benefit">
              <q-icon name="check_circle" />
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </div>

        <div class="entry-action">
          <q-btn
            unelevated
            no-caps
            color="positive"
            class="app-btn--large app-btn--mobile-block"
            :label="t('welcome.demo.action')"
            :loading="openingDemo"
            :disable="openingDemo"
            @click="exploreDemo"
          />
          <span class="app-caption">{{ t('welcome.demo.microcopy') }}</span>
        </div>
      </AppCard>

      <AppCard class="entry-card entry-card--create" tone="primary">
        <div class="pillars-preview" aria-hidden="true">
          <div v-for="pillar in pillars" :key="pillar.label" class="pillar">
            <span :class="['pillar-icon', `pillar-icon--${pillar.tone}`]">
              <q-icon :name="pillar.icon" />
            </span>
            <span class="pillar-label">{{ pillar.label }}</span>
            <span class="pillar-state"><q-icon name="add" /></span>
          </div>
        </div>

        <div class="entry-copy">
          <div class="create-heading">
            <span class="app-card__icon mobile-workspace-icon" aria-hidden="true">
              <q-icon name="account_balance_wallet" />
            </span>
            <h2 class="app-card-title">{{ t('welcome.create.title') }}</h2>
          </div>
          <p class="app-card-subtitle">
            <span class="desktop-copy">{{ t('welcome.create.description') }}</span>
            <span class="mobile-copy">{{ t('welcome.create.mobileDescription') }}</span>
          </p>
          <ul class="benefit-list benefit-list--create">
            <li v-for="benefit in createBenefits" :key="benefit">
              <q-icon name="check_circle" />
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </div>

        <div class="entry-action">
          <q-btn
            outline
            no-caps
            color="primary"
            class="app-btn--large app-btn--mobile-block"
            :label="t('welcome.create.action')"
            :to="{ name: 'create-workspace' }"
          />
          <span class="app-caption">{{ t('welcome.create.microcopy') }}</span>
        </div>
      </AppCard>
    </section>

    <p class="welcome-footer app-caption">{{ t('welcome.footer') }}</p>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppCard from '@/components/ui/AppCard.vue'
import { DEMO_WORKSPACE_ID } from '@/domain/access/demo-workspace'
import { useWorkspaceStore } from '@/stores/workspace-store'

const { t } = useI18n()
const router = useRouter()
const workspaceStore = useWorkspaceStore()
const openingDemo = ref(false)
const demoError = ref(false)

const demoBenefits = computed(() => [
  t('welcome.demo.benefits.picture'),
  t('welcome.demo.benefits.history'),
  t('welcome.demo.benefits.simulations'),
])
const createBenefits = computed(() => [
  t('welcome.create.benefits.scope'),
  t('welcome.create.benefits.progressive'),
  t('welcome.create.benefits.pace'),
])
const pillars = computed(() => [
  { label: t('navigation.assets'), icon: 'account_balance', tone: 'positive' },
  { label: t('navigation.liabilities'), icon: 'receipt_long', tone: 'negative' },
  { label: t('navigation.income'), icon: 'payments', tone: 'positive' },
  { label: t('navigation.expenses'), icon: 'credit_card', tone: 'negative' },
])

async function exploreDemo() {
  if (openingDemo.value) return

  openingDemo.value = true
  demoError.value = false
  try {
    const selected = await workspaceStore.setActiveWorkspace(DEMO_WORKSPACE_ID)
    if (!selected) throw new Error('Demo workspace unavailable')
    await router.push({
      name: 'workspace-dashboard',
      params: { workspaceId: DEMO_WORKSPACE_ID },
    })
  } catch {
    demoError.value = true
  } finally {
    openingDemo.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.welcome-shell {
  width: min(100%, 68rem);
  margin: 0 auto;
}

.mobile-copy,
.mobile-workspace-icon {
  display: none;
}

.create-heading {
  display: contents;
}

.welcome-intro {
  max-width: 44rem;
  margin: 0 auto var(--space-6);
  text-align: center;
}

.welcome-eyebrow {
  margin-bottom: var(--space-3);
  color: var(--color-success-dark);
}

.welcome-subtitle {
  max-width: 38rem;
  margin: var(--space-3) auto 0;
  font-size: 1rem;
}

.demo-error {
  max-width: 44rem;
  margin: 0 auto var(--space-4);
  border: 1px solid var(--color-line);
  background: var(--color-red-soft);
  color: var(--color-danger-dark);
}

.entry-grid {
  display: grid;
  grid-template-columns: 1.06fr 0.94fr;
  gap: var(--space-5);
  align-items: stretch;
}

.entry-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-height: 31rem;
}

.entry-card--demo {
  border-color: rgb(22 129 95 / 28%);
  box-shadow: 0 18px 48px rgb(22 129 95 / 10%);
}

.financial-preview,
.pillars-preview {
  min-height: 10.25rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.financial-preview {
  position: relative;
  padding: var(--space-4) var(--space-4) var(--space-3);
  overflow: hidden;
}

.preview-heading {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.preview-heading > div {
  display: grid;
  gap: var(--space-1);
}

.preview-value {
  color: var(--color-ink);
  font-size: var(--font-size-kpi-value-secondary);
  line-height: 1;
  letter-spacing: -0.035em;
}

.preview-change {
  display: inline-flex;
  align-items: center;
  align-self: start;
  gap: var(--space-1);
  color: var(--color-success-dark);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
}

.history-chart {
  position: absolute;
  inset: 4.3rem 0 0;
  width: 100%;
  height: 7.4rem;
}

.chart-grid {
  fill: none;
  stroke: var(--color-line);
  stroke-width: 1;
}

.chart-area {
  fill: url('#welcome-chart-fill');
}

.chart-line {
  fill: none;
  stroke: var(--color-success);
  stroke-linecap: round;
  stroke-width: 2.5;
}

.fictional-data {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-2);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 88%);
  color: var(--color-muted);
  font-size: 0.6875rem;
}

.pillars-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  padding: var(--space-3);
}

.pillar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.pillar-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
}

.pillar-icon--positive {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}

.pillar-icon--negative {
  background: var(--color-red-soft);
  color: var(--color-danger);
}

.pillar-label {
  overflow: hidden;
  color: var(--color-ink-soft);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pillar-state {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.entry-copy {
  display: grid;
  gap: var(--space-2);
}

.benefit-list {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-2) 0 0;
  padding: 0;
  color: var(--color-copy);
  font-size: var(--font-size-caption);
  list-style: none;
}

.benefit-list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.benefit-list .q-icon {
  color: var(--color-success);
  font-size: 1rem;
}

.benefit-list--create .q-icon {
  color: var(--color-primary);
}

.entry-action {
  display: grid;
  gap: var(--space-2);
  align-items: start;
  margin-top: auto;
}

.entry-action .q-btn {
  justify-self: start;
  min-width: 11.5rem;
}

.welcome-footer {
  margin: var(--space-5) 0 0;
  text-align: center;
}

@media (max-width: bp.$md-max) {
  .entry-grid {
    grid-template-columns: 1fr;
    max-width: 40rem;
    margin: 0 auto;
  }

  .entry-card {
    min-height: 0;
  }
}

@media (max-width: bp.$sm-max) {
  .desktop-copy {
    display: none;
  }

  .mobile-copy {
    display: inline;
  }

  .welcome-intro {
    margin-bottom: var(--space-3);
    text-align: left;
  }

  .welcome-eyebrow {
    margin-bottom: 0.375rem;
  }

  .welcome-subtitle {
    margin: 0.375rem 0 0;
  }

  .entry-grid {
    gap: var(--space-3);
  }

  .entry-card {
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .financial-preview {
    min-height: 5.75rem;
    padding: var(--space-3);
  }

  .preview-heading > div {
    gap: 0;
  }

  .preview-value {
    font-size: 1.35rem;
  }

  .history-chart {
    inset: 2.85rem 0 0;
    height: calc(100% - 2.85rem);
  }

  .fictional-data {
    right: var(--space-2);
    bottom: var(--space-1);
  }

  .benefit-list,
  .entry-card--create .pillars-preview,
  .entry-card--create .entry-action .app-caption {
    display: none;
  }

  .create-heading {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .mobile-workspace-icon {
    display: grid;
    flex-basis: 2.5rem;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.2rem;
  }

  .entry-action .q-btn {
    justify-self: stretch;
  }

  .entry-action .app-caption {
    text-align: center;
  }

  .welcome-footer {
    margin-top: var(--space-3);
  }
}
</style>
