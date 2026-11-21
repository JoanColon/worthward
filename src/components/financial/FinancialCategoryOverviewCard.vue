<template>
  <section class="category-overview-card" :class="`category-overview-card--${tone}`">
    <article class="category-kpi">
      <span class="category-kpi-icon"><q-icon :name="icon" /></span>
      <div class="category-kpi-copy">
        <span class="category-kpi-label">{{ label }}</span>
        <strong>{{ formattedTotal }}</strong>
        <div class="category-kpi-meta">
          <span v-if="secondaryValue || secondaryLabel" class="category-kpi-secondary">
            <b v-if="secondaryValue">{{ secondaryValue }}</b>
            {{ secondaryLabel }}
          </span>
          <span v-if="badgeLabel" class="category-kpi-badge">{{ badgeLabel }}</span>
        </div>
      </div>
    </article>

    <FinancialCategoryBreakdown
      :title="chartTitle"
      :empty-label="emptyLabel"
      :entries="entries"
      :total="total"
    />
  </section>
</template>

<script setup>
import FinancialCategoryBreakdown from '@/components/financial/FinancialCategoryBreakdown.vue'

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
  badgeLabel: { type: String, default: '' },
  chartTitle: { type: String, required: true },
  emptyLabel: { type: String, required: true },
  entries: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.category-overview-card {
  @include dashboard-card;
  display: grid;
  grid-template-columns: minmax(18rem, 0.72fr) minmax(30rem, 1.28fr);
  overflow: hidden;
  margin-top: var(--space-4);
}

.category-kpi {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  min-width: 0;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border-right: 1px solid var(--color-line);
  background: var(--color-surface);
}

.category-kpi-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 50%;
  font-size: 1.7rem;
}

.category-overview-card--assets .category-kpi-icon,
.category-overview-card--income .category-kpi-icon {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}

.category-overview-card--liabilities .category-kpi-icon,
.category-overview-card--expenses .category-kpi-icon {
  background: var(--color-red-soft);
  color: var(--color-financial-expenses);
}

.category-kpi-copy {
  display: grid;
  min-width: 0;
}

.category-kpi-label {
  color: var(--color-copy);
  font-size: 0.95rem;
  font-weight: var(--font-weight-medium);
  letter-spacing: -0.01em;
}

.category-kpi-copy > strong {
  margin: 0.35rem 0 0.7rem;
  color: var(--color-ink);
  font-size: clamp(3rem, 5vw, 4.35rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.category-kpi-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  min-height: 1.55rem;
}

.category-kpi-secondary {
  color: var(--color-copy);
  font-size: 0.92rem;
}

.category-kpi-secondary b {
  color: var(--color-ink);
  font-size: 1.05rem;
  font-weight: var(--font-weight-bold);
}

.category-kpi-badge {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-copy);
  font-size: 0.72rem;
  font-weight: var(--font-weight-semibold);
}

@media (max-width: bp.$content-compact-max) {
  .category-overview-card {
    grid-template-columns: 1fr;
    margin-top: var(--space-3);
  }

  .category-kpi {
    padding: var(--space-4);
    border-right: 0;
    border-bottom: 1px solid var(--color-line);
  }

  .category-kpi-icon {
    width: 2.7rem;
    height: 2.7rem;
    font-size: 1.25rem;
  }

  .category-kpi-copy > strong {
    margin-bottom: 0.55rem;
    font-size: 2.65rem;
  }

  .category-kpi-label {
    font-size: 0.84rem;
  }

  .category-kpi-secondary {
    font-size: 0.8rem;
  }

  .category-kpi-secondary b {
    font-size: 0.9rem;
  }
}
</style>
