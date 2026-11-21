<template>
  <section class="financial-overview-card" :class="`financial-overview-card--${tone}`">
    <article class="overview-kpi">
      <span class="total-icon"><q-icon :name="icon" /></span>
      <div class="total-copy">
        <span class="kpi-label">{{ label }}</span>
        <strong>{{ formattedTotal }}</strong>
        <div class="kpi-meta">
          <span v-if="secondaryValue" class="secondary-value">
            <b>{{ secondaryValue }}</b>
            {{ secondaryLabel }}
          </span>
          <span v-if="scopeLabel" class="scope-label">{{ scopeLabel }}</span>
        </div>
      </div>
    </article>

    <ExpenseBreakdownChart
      :title="chartTitle"
      :total-label="totalLabel"
      :empty-label="emptyLabel"
      :entries="entries"
      embedded
    />
  </section>
</template>

<script setup>
import ExpenseBreakdownChart from '@/components/expenses/ExpenseBreakdownChart.vue'

defineProps({
  tone: {
    type: String,
    required: true,
    validator: (value) => ['assets', 'liabilities', 'income', 'expenses'].includes(value),
  },
  icon: { type: String, required: true },
  label: { type: String, required: true },
  formattedTotal: { type: String, required: true },
  secondaryValue: { type: String, default: '' },
  secondaryLabel: { type: String, default: '' },
  scopeLabel: { type: String, default: '' },
  chartTitle: { type: String, required: true },
  totalLabel: { type: String, required: true },
  emptyLabel: { type: String, required: true },
  entries: { type: Array, default: () => [] },
})
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.financial-overview-card {
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
  font-size: 1.7rem;
}

.financial-overview-card--assets .total-icon,
.financial-overview-card--income .total-icon {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}

.financial-overview-card--liabilities .total-icon,
.financial-overview-card--expenses .total-icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
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

.total-copy > strong {
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
  min-height: 1.55rem;
}

.secondary-value {
  color: var(--color-copy);
  font-size: 0.92rem;
}

.secondary-value b {
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

.financial-overview-card :deep(.breakdown-card) {
  min-height: 14rem;
}

@media (max-width: bp.$overview-stack-max) {
  .financial-overview-card {
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

  .total-copy > strong {
    margin-bottom: 0.55rem;
    font-size: 2.65rem;
  }

  .kpi-label {
    font-size: 0.84rem;
  }

  .secondary-value {
    font-size: 0.8rem;
  }

  .secondary-value b {
    font-size: 0.9rem;
  }
}
</style>
