<template>
  <FinancialKpiOverview
    :tone="tone"
    :icon="icon"
    :label="label"
    :formatted-total="formattedTotal"
    :supporting-text="[secondaryValue, secondaryLabel].filter(Boolean).join(' ')"
    :badge-label="badgeLabel"
  >
    <FinancialCategoryBreakdown
      :tone="tone"
      :title="chartTitle"
      :empty-label="emptyLabel"
      :entries="entries"
      :total="total"
    />
  </FinancialKpiOverview>
</template>

<script setup>
import FinancialCategoryBreakdown from '@/components/financial/FinancialCategoryBreakdown.vue'
import FinancialKpiOverview from '@/components/financial/FinancialKpiOverview.vue'

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
