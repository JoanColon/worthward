<template>
  <section class="savings-capacity-breakdown" :aria-label="title">
    <h2 class="app-row-title">{{ title }}</h2>
    <div ref="chartElement" class="savings-capacity-breakdown__chart" />
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart } from 'echarts/charts'
import { AriaComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useI18n } from 'vue-i18n'
import { CHART_COLORS } from '@/config/chart-theme'

use([BarChart, GridComponent, TooltipComponent, AriaComponent, CanvasRenderer])

const props = defineProps({
  title: { type: String, required: true },
  incomeLabel: { type: String, required: true },
  costOfLifeLabel: { type: String, required: true },
  savingsLabel: { type: String, required: true },
  income: { type: Number, required: true },
  costOfLife: { type: Number, required: true },
  savings: { type: Number, required: true },
})

const { locale } = useI18n()
const chartElement = ref(null)
const percentageBase = computed(() => {
  const income = Math.abs(Number(props.income || 0))
  if (income > 0) return income
  return Math.max(1, Math.abs(Number(props.costOfLife || 0)), Math.abs(Number(props.savings || 0)))
})
const entries = computed(() => [
  {
    name: props.incomeLabel,
    percentage: percentageOf(props.income),
    color: CHART_COLORS.success,
  },
  {
    name: props.costOfLifeLabel,
    percentage: percentageOf(props.costOfLife),
    color: CHART_COLORS.danger,
  },
  {
    name: props.savingsLabel,
    percentage: percentageOf(props.savings),
    color: props.savings < 0 ? CHART_COLORS.danger : CHART_COLORS.primary,
  },
])

let chart = null
let resizeObserver = null

onMounted(() => {
  chart = init(chartElement.value)
  resizeObserver = new ResizeObserver(() => chart?.resize())
  resizeObserver.observe(chartElement.value)
  renderChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})

watch(
  () => [entries.value, locale.value],
  () => nextTick(renderChart),
  { deep: true },
)

function renderChart() {
  if (!chart) return

  const compact = chartElement.value?.clientWidth < 460
  const maximum = Math.max(100, ...entries.value.map(({ percentage }) => Math.abs(percentage)))

  chart.setOption(
    {
      animationDuration: 300,
      aria: { enabled: true, label: { description: props.title } },
      grid: {
        left: compact ? 4 : 8,
        right: compact ? 48 : 56,
        top: 4,
        bottom: 4,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: CHART_COLORS.ink,
        borderWidth: 0,
        textStyle: { color: CHART_COLORS.inverse },
        formatter: ({ data, marker }) =>
          `${marker}<strong>${escapeHtml(data.name)}</strong><br/>${escapeHtml(formatPercentage(data.percentage))}`,
      },
      xAxis: { type: 'value', min: 0, max: maximum, show: false },
      yAxis: {
        type: 'category',
        inverse: true,
        data: entries.value.map(({ name }) => name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          width: compact ? 88 : 128,
          overflow: 'truncate',
          margin: compact ? 8 : 12,
          color: CHART_COLORS.ink,
          fontSize: compact ? 11 : 12,
          fontWeight: 500,
        },
      },
      series: [
        {
          type: 'bar',
          barWidth: compact ? 9 : 11,
          showBackground: true,
          backgroundStyle: { color: CHART_COLORS.grid, borderRadius: 999 },
          data: entries.value.map((entry) => ({
            ...entry,
            value: Math.abs(entry.percentage),
            itemStyle: { color: entry.color, borderRadius: 999 },
          })),
        },
        {
          type: 'bar',
          barWidth: compact ? 9 : 11,
          barGap: '-100%',
          silent: true,
          z: 3,
          itemStyle: { color: 'transparent' },
          label: {
            show: true,
            position: 'right',
            distance: compact ? 7 : 10,
            color: CHART_COLORS.copy,
            fontSize: compact ? 10 : 11,
            fontWeight: 600,
            align: 'left',
            formatter: ({ data }) => formatPercentage(data.percentage),
          },
          data: entries.value.map((entry) => ({
            name: entry.name,
            value: maximum,
            percentage: entry.percentage,
          })),
        },
      ],
    },
    true,
  )
}

function percentageOf(value) {
  return (Number(value || 0) / percentageBase.value) * 100
}

function formatPercentage(value) {
  return `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value)}%`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.savings-capacity-breakdown {
  display: grid;
  align-content: center;
  min-width: 0;
  min-height: 0;
  padding: var(--space-4) var(--space-5);
}

.savings-capacity-breakdown h2 {
  margin: 0 0 var(--space-2);
}

.savings-capacity-breakdown__chart {
  width: 100%;
  height: 9rem;
}

@media (max-width: bp.$content-compact-max) {
  .savings-capacity-breakdown {
    padding: var(--space-3) 0 0;
  }
}
</style>
