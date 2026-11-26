<template>
  <FinancialKpiOverview
    :tone="tone"
    :icon="icon"
    :label="label"
    :formatted-total="formattedTotal"
    :secondary-value="secondaryValue"
    :secondary-label="secondaryLabel"
    :comparison-value="comparisonValue"
    :comparison-label="comparisonLabel"
    :comparison-help="comparisonHelp"
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
  secondaryValue: { type: String, default: '' },
  secondaryLabel: { type: String, default: '' },
  comparisonValue: { type: String, default: '' },
  comparisonLabel: { type: String, default: '' },
  comparisonHelp: { type: String, default: '' },
  scopeLabel: { type: String, default: '' },
  chartTitle: { type: String, required: true },
  totalLabel: { type: String, required: true },
  emptyLabel: { type: String, required: true },
  entries: { type: Array, default: () => [] },
})
</script>
