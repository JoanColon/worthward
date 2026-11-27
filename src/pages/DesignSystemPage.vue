<template>
  <q-page class="design-system-page">
    <main class="design-system-shell">
      <AppPageHeader
        title="Worthward design system"
        subtitle="Production components, semantic roles and responsive edge cases. Development only."
      />

      <section class="preview-section">
        <span class="app-section-label">Foundation</span>
        <h2 class="app-section-title">Typography</h2>
        <AppCard class="type-preview">
          <h1 class="app-page-title">Page title with a deliberately longer line</h1>
          <p class="app-page-subtitle">
            Page subtitle explains context without competing with the title.
          </p>
          <h2 class="app-section-title">Section title</h2>
          <span class="app-section-label">Section label</span>
          <h3 class="app-card-title">Card title</h3>
          <p class="app-card-subtitle">Card subtitle and supporting context.</p>
          <span class="app-kpi-label">Net worth</span>
          <strong class="app-kpi-value">€12,345,678.90</strong>
          <strong class="app-kpi-value-secondary">€28,450</strong>
          <span class="app-kpi-supporting">0.95% fixed · €386 per month</span>
          <span class="app-row-title">Investment portfolio</span>
          <strong class="app-row-value">€1,234,567</strong>
          <p class="app-body">Body copy uses the shared reading rhythm across features.</p>
          <small class="app-caption">Caption and supporting information</small>
          <span class="app-table-header">Table header</span>
        </AppCard>
      </section>

      <section class="preview-section">
        <span class="app-section-label">Components</span>
        <h2 class="app-section-title">Cards, controls and states</h2>
        <div class="card-grid">
          <AppCard
            title="Standard card"
            subtitle="Shared padding, heading and surface"
            icon="account_balance"
            tone="primary"
          >
            <p class="app-body">
              A reusable surface for content that does not need a domain-specific component.
            </p>
          </AppCard>
          <AppCard
            title="Action card"
            subtitle="Header actions remain composable"
            icon="trending_up"
            tone="positive"
          >
            <template #actions
              ><q-btn flat round icon="more_horiz" aria-label="More actions"
            /></template>
            <p class="app-body">
              Long content checks wrapping: projected financial independence timeline.
            </p>
          </AppCard>
        </div>
        <AppCard title="Buttons and selectors" compact>
          <div class="control-row">
            <q-btn unelevated color="primary" label="Primary action" />
            <q-btn outline color="primary" label="Secondary action" />
            <q-btn flat color="negative" label="Destructive action" />
            <q-select
              v-model="selectedPeriod"
              outlined
              dense
              :options="periods"
              label="Period"
              class="preview-select"
            />
          </div>
        </AppCard>
        <AppEmptyState
          icon="insights"
          title="No projections yet"
          description="Add financial data to see your long-term projection and milestones."
          action-label="Add data"
          tone="primary"
          compact
        />
      </section>

      <section class="preview-section">
        <span class="app-section-label">Financial patterns</span>
        <h2 class="app-section-title">KPI, chart and legend</h2>
        <FinancialOverviewCard
          tone="assets"
          icon="account_balance_wallet"
          label="Total assets"
          formatted-total="€12,345,678.90"
          supporting-text="Current position"
          :metrics="[
            { label: 'Financial assets', value: '€9,870,000', supporting: '79.9% of assets' },
            { label: 'Real estate', value: '€2,475,679', supporting: '20.1% of assets' },
          ]"
          scope-label="All members"
          chart-title="Asset allocation"
          total-label="Current value"
          empty-label="No asset data"
          :entries="chartEntries"
        />
        <div class="result-grid">
          <AppCard compact>
            <span class="app-kpi-label">Positive result</span>
            <strong class="app-kpi-value-secondary app-tone-positive">+€4,000</strong>
          </AppCard>
          <AppCard compact>
            <span class="app-kpi-label">Negative result</span>
            <strong class="app-kpi-value-secondary app-tone-negative">−€13,076</strong>
          </AppCard>
        </div>
      </section>

      <section class="preview-section">
        <span class="app-section-label">Data density</span>
        <h2 class="app-section-title">Table and colour roles</h2>
        <AppCard :padded="false">
          <q-table flat :rows="tableRows" :columns="tableColumns" row-key="name" hide-pagination />
        </AppCard>
        <div class="swatches">
          <div v-for="swatch in swatches" :key="swatch.token" class="swatch">
            <i :style="{ background: `var(${swatch.token})` }" />
            <span class="app-caption">{{ swatch.token }}</span>
          </div>
        </div>
      </section>
    </main>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import FinancialOverviewCard from '@/components/financial/FinancialOverviewCard.vue'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const periods = ['Monthly', 'Annual']
const selectedPeriod = ref(periods[1])
const chartEntries = [
  { id: 'cash', name: 'Cash', value: 1800000, percentage: 14.6, color: '#36cdb0' },
  {
    id: 'investments',
    name: 'Investments with a long translated label',
    value: 7540000,
    percentage: 61.1,
    color: '#8b4df4',
  },
  { id: 'real-estate', name: 'Real estate', value: 3005678.9, percentage: 24.3, color: '#0870d8' },
]
const tableColumns = [
  { name: 'name', label: 'Position', field: 'name', align: 'left' },
  { name: 'value', label: 'Current value', field: 'value', align: 'right' },
  { name: 'change', label: 'Change', field: 'change', align: 'right' },
]
const tableRows = [
  { name: 'Global diversified portfolio', value: '€1,234,567.89', change: '+12.4%' },
  { name: 'Emergency fund', value: '€48,000.00', change: '+2.1%' },
]
const swatches = [
  { token: '--color-page' },
  { token: '--color-surface' },
  { token: '--color-ink' },
  { token: '--color-primary' },
  { token: '--color-success' },
  { token: '--color-danger' },
]
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.design-system-page {
  @include financial-page;
}
.design-system-shell {
  @include financial-shell(wide);
  display: grid;
  gap: var(--space-8);
}
.preview-section {
  display: grid;
  gap: var(--space-3);
}
.type-preview {
  display: grid;
  gap: var(--space-4);
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--card-gap);
}
.control-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--card-gap);
}
.preview-select {
  width: min(100%, 14rem);
}
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: var(--space-3);
}
.swatch {
  display: grid;
  gap: var(--space-2);
}
.swatch i {
  height: 4rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
}

@media (max-width: 760px) {
  .card-grid,
  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
