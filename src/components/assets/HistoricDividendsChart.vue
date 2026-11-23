<template>
  <article class="historic-dividends-card">
    <header>
      <div class="historic-dividends-title-row">
        <h3>{{ title }}</h3>
      </div>
      <p>{{ formattedTotal }} {{ subtitle }}</p>
    </header>

    <div v-show="values.length" ref="chartElement" class="historic-dividends-chart" />
    <div v-if="!values.length" class="historic-dividends-empty">{{ emptyLabel }}</div>
  </article>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BarChart } from 'echarts/charts'
import { AriaComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CHART_COLORS } from '@/config/chart-theme'
import { formatCurrencyValue } from '@/domain/financial/investment-portfolio'

use([BarChart, TooltipComponent, GridComponent, AriaComponent, CanvasRenderer])

const props = defineProps({
  values: { type: Array, default: () => [] },
  selectedYear: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  baseCurrency: { type: String, default: '' },
  ariaLabel: { type: String, required: true },
  emptyLabel: { type: String, required: true },
})

const emit = defineEmits(['select-year'])

const chartElement = ref(null)
const total = computed(() => props.values.reduce((sum, item) => sum + item.value, 0))
const formattedTotal = computed(
  () => formatCurrencyValue(total.value, props.baseCurrency, 0) || '—',
)
let chart = null
let resizeObserver = null

onMounted(() => {
  if (chartElement.value) {
    chart = init(chartElement.value)
    chart.on('click', handleChartClick)
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(chartElement.value)
    renderChart()
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})

watch(
  () => [props.values, props.selectedYear, props.title, props.ariaLabel, props.baseCurrency],
  async () => {
    await nextTick()
    if (!chart && chartElement.value) {
      chart = init(chartElement.value)
      resizeObserver = new ResizeObserver(() => chart?.resize())
      resizeObserver.observe(chartElement.value)
    }
    renderChart()
  },
  { deep: true },
)

function renderChart() {
  if (!chart) return
  if (!props.values.length) {
    chart.clear()
    return
  }
  chart.setOption(
    {
      animationDuration: 350,
      aria: { enabled: true, label: { description: props.ariaLabel } },
      grid: { top: 20, right: 20, bottom: 36, left: 64 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: CHART_COLORS.ink,
        borderWidth: 0,
        padding: [9, 12],
        textStyle: { color: CHART_COLORS.inverse, fontSize: 12 },
        formatter: ([item]) =>
          `<strong>${escapeHtml(item.name)}</strong><br/>${escapeHtml(formatCurrencyValue(item.value, props.baseCurrency, 2))}`,
      },
      xAxis: {
        type: 'category',
        data: props.values.map(({ year }) => year),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART_COLORS.axis } },
        axisLabel: { color: CHART_COLORS.copy, fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        splitLine: { lineStyle: { color: CHART_COLORS.grid } },
        axisLabel: {
          color: CHART_COLORS.copy,
          formatter: (value) => compactCurrency(value, props.baseCurrency),
        },
      },
      series: [
        {
          type: 'bar',
          data: props.values.map(({ year, value }) => ({
            name: year,
            value,
            itemStyle: {
              color: year === props.selectedYear ? CHART_COLORS.primary : '#9bbce2',
            },
          })),
          barMaxWidth: 48,
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          emphasis: { itemStyle: { color: CHART_COLORS.primary } },
        },
      ],
    },
    true,
  )
}

function handleChartClick({ name }) {
  if (name) emit('select-year', String(name))
}

function compactCurrency(value, currency) {
  try {
    return new Intl.NumberFormat('en-IE', {
      style: currency ? 'currency' : 'decimal',
      currency: currency || undefined,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  } catch {
    return String(value)
  }
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
.historic-dividends-card {
  min-width: 0;
  margin: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

header {
  display: block;
}

header h3,
header p {
  margin: 0;
}

.historic-dividends-title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.historic-dividends-title-row h3 {
  color: var(--color-ink);
  font-size: 1.05rem;
  line-height: 1.3;
}

header p {
  margin-top: 0.3rem;
  color: var(--color-copy);
  font-size: 0.88rem;
  line-height: 1.4;
}

.historic-dividends-chart,
.historic-dividends-empty {
  width: 100%;
  min-height: 20rem;
  margin-top: 1rem;
}

.historic-dividends-chart {
  cursor: pointer;
}

.historic-dividends-empty {
  display: grid;
  place-items: center;
  color: var(--color-copy);
  text-align: center;
}

@media (max-width: 760px) {
  .historic-dividends-card {
    margin: 0.75rem;
    padding: 0.75rem;
  }
  .historic-dividends-chart,
  .historic-dividends-empty {
    min-height: 18rem;
    margin-top: 0.75rem;
  }
}
</style>
