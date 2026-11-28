<template>
  <FinancialKpiOverview
    :tone="negative ? 'expenses' : 'income'"
    icon="savings"
    :label="label"
    :formatted-total="primaryValue"
    :supporting-text="[primaryPeriod, description].filter(Boolean).join(' · ')"
    :metrics="metrics"
  >
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>

    <SavingsCapacityBreakdown
      :title="chartTitle"
      :income-label="incomeLabel"
      :cost-of-life-label="costOfLifeLabel"
      :savings-label="label"
      :income="incomeValue"
      :cost-of-life="costOfLifeValue"
      :savings="savingsValue"
    />
  </FinancialKpiOverview>
</template>

<script setup>
import FinancialKpiOverview from '@/components/financial/FinancialKpiOverview.vue'
import SavingsCapacityBreakdown from '@/components/financial/SavingsCapacityBreakdown.vue'

defineProps({
  label: { type: String, required: true },
  primaryValue: { type: String, required: true },
  primaryPeriod: { type: String, default: '' },
  description: { type: String, required: true },
  metrics: { type: Array, default: () => [] },
  chartTitle: { type: String, required: true },
  incomeLabel: { type: String, required: true },
  costOfLifeLabel: { type: String, required: true },
  incomeValue: { type: Number, required: true },
  costOfLifeValue: { type: Number, required: true },
  savingsValue: { type: Number, required: true },
  negative: Boolean,
})
</script>
