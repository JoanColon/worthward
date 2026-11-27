<template>
  <AppCard
    :padded="false"
    class="financial-kpi-overview"
    :class="`financial-kpi-overview--${tone}`"
  >
    <header class="financial-kpi-overview__heading">
      <span class="financial-kpi-overview__icon"><q-icon :name="icon" /></span>
      <span class="app-kpi-label">{{ label }}</span>
      <span v-if="badgeLabel" class="financial-kpi-overview__badge">{{ badgeLabel }}</span>
    </header>

    <div class="financial-kpi-overview__body">
      <article class="financial-kpi-overview__summary">
        <div class="financial-kpi-overview__primary">
          <strong class="app-kpi-value financial-kpi-overview__value">{{ formattedTotal }}</strong>
          <span v-if="supportingText" class="app-kpi-supporting">{{ supportingText }}</span>
        </div>

        <div v-if="metrics.length" class="financial-kpi-overview__metrics">
          <div v-for="metric in metrics" :key="metric.label" class="financial-kpi-overview__metric">
            <span class="app-kpi-supporting financial-kpi-overview__metric-label">
              {{ metric.label }}
              <q-icon
                v-if="metric.help"
                name="info_outline"
                class="financial-kpi-overview__info"
                role="img"
                tabindex="0"
                :aria-label="metric.help"
              >
                <q-tooltip max-width="18rem">{{ metric.help }}</q-tooltip>
              </q-icon>
            </span>
            <strong class="app-kpi-value-secondary">{{ metric.value }}</strong>
            <span v-if="metric.supporting" class="app-kpi-supporting">{{ metric.supporting }}</span>
          </div>
        </div>
      </article>
      <div class="financial-kpi-overview__detail"><slot /></div>
    </div>
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
  supportingText: { type: String, default: '' },
  metrics: { type: Array, default: () => [] },
  badgeLabel: { type: String, default: '' },
})
</script>
