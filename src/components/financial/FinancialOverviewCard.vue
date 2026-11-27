<template>
  <FinancialKpiOverview
    :tone="tone"
    :icon="icon"
    :label="label"
    :formatted-total="formattedTotal"
    :supporting-text="supportingText"
    :metrics="metrics"
    :badge-label="scopeLabel"
  >
    <ExpenseBreakdownChart
      :title="chartTitle"
      :total-label="totalLabel"
      :empty-label="emptyLabel"
      :entries="entries"
      embedded
    />
  </FinancialKpiOverview>
</template>

<script setup>
import ExpenseBreakdownChart from '@/components/expenses/ExpenseBreakdownChart.vue'
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
  supportingText: { type: String, default: '' },
  metrics: { type: Array, default: () => [] },
  scopeLabel: { type: String, default: '' },
  chartTitle: { type: String, required: true },
  totalLabel: { type: String, required: true },
  emptyLabel: { type: String, required: true },
  entries: { type: Array, default: () => [] },
})
</script>
