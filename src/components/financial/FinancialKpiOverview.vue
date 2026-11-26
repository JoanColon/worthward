<template>
  <AppCard
    :padded="false"
    class="financial-kpi-overview"
    :class="`financial-kpi-overview--${tone}`"
  >
    <article class="financial-kpi-overview__summary">
      <span class="financial-kpi-overview__icon"><q-icon :name="icon" /></span>
      <div class="financial-kpi-overview__copy">
        <span class="app-kpi-label">{{ label }}</span>
        <strong class="app-kpi-value">{{ formattedTotal }}</strong>
        <div class="financial-kpi-overview__meta">
          <span v-if="secondaryValue || secondaryLabel" class="financial-kpi-overview__secondary">
            <b v-if="secondaryValue">{{ secondaryValue }}</b> {{ secondaryLabel }}
          </span>
          <span v-if="comparisonValue" class="financial-kpi-overview__comparison">
            {{ comparisonLabel }}
            <q-icon
              v-if="comparisonHelp"
              name="info_outline"
              class="financial-kpi-overview__info"
              role="img"
              tabindex="0"
              :aria-label="comparisonHelp"
            >
              <q-tooltip max-width="18rem">{{ comparisonHelp }}</q-tooltip>
            </q-icon>
            <b>{{ comparisonValue }}</b>
          </span>
          <span v-if="badgeLabel" class="financial-kpi-overview__badge">{{ badgeLabel }}</span>
        </div>
      </div>
    </article>
    <div class="financial-kpi-overview__detail"><slot /></div>
  </AppCard>
</template>

<script setup>
import AppCard from '@/components/ui/AppCard.vue'

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
  comparisonValue: { type: String, default: '' },
  comparisonLabel: { type: String, default: '' },
  comparisonHelp: { type: String, default: '' },
  badgeLabel: { type: String, default: '' },
})
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.financial-kpi-overview {
  display: grid;
  grid-template-columns: minmax(18rem, 0.72fr) minmax(30rem, 1.28fr);
  overflow: hidden;
  margin-top: var(--page-section-gap);
}
.financial-kpi-overview__summary {
  display: flex;
  align-items: center;
  gap: var(--card-gap);
  min-width: 0;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border-right: 1px solid var(--color-line);
  background: var(--color-surface);
}
.financial-kpi-overview__icon {
  display: grid;
  place-items: center;
  flex: 0 0 var(--icon-size-kpi);
  width: var(--icon-size-kpi);
  height: var(--icon-size-kpi);
  border-radius: 50%;
  font-size: clamp(1.25rem, calc(1rem + 0.9vw), 1.7rem);
}
.financial-kpi-overview--assets .financial-kpi-overview__icon,
.financial-kpi-overview--income .financial-kpi-overview__icon {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.financial-kpi-overview--liabilities .financial-kpi-overview__icon,
.financial-kpi-overview--expenses .financial-kpi-overview__icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
}
.financial-kpi-overview__copy {
  display: grid;
  min-width: 0;
}
.financial-kpi-overview__copy > .app-kpi-value {
  margin: 0.35rem 0 0.7rem;
}
.financial-kpi-overview__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  min-height: 1.55rem;
}
.financial-kpi-overview__secondary,
.financial-kpi-overview__comparison {
  color: var(--color-copy);
  font-size: var(--font-size-kpi-supporting);
}
.financial-kpi-overview__comparison {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.financial-kpi-overview__secondary b,
.financial-kpi-overview__comparison b {
  color: var(--color-ink);
  font-weight: var(--font-weight-bold);
}
.financial-kpi-overview__info {
  border-radius: 50%;
  color: var(--color-muted);
  font-size: 1rem;
  cursor: help;
}
.financial-kpi-overview__info:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.financial-kpi-overview__badge {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-copy);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-semibold);
}
.financial-kpi-overview__detail {
  display: grid;
  min-width: 0;
}
.financial-kpi-overview__detail :deep(.breakdown-card) {
  min-height: 14rem;
}

@media (max-width: bp.$content-compact-max) {
  .financial-kpi-overview {
    grid-template-columns: 1fr;
  }
  .financial-kpi-overview__summary {
    padding: var(--card-padding);
    border-right: 0;
    border-bottom: 1px solid var(--color-line);
  }
  .financial-kpi-overview__copy > .app-kpi-value {
    margin-bottom: 0.55rem;
  }
}
</style>
