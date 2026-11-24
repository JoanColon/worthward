<template>
  <div ref="chartElement" class="cash-value-chart" />
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LineChart } from 'echarts/charts'
import { AriaComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CHART_COLORS } from '@/config/chart-theme'
import { formatCurrency, workspaceCurrency } from '@/utils/formatters'

use([LineChart, GridComponent, LegendComponent, TooltipComponent, AriaComponent, CanvasRenderer])

const props = defineProps({
  points: { type: Array, default: () => [] },
  ariaLabel: { type: String, required: true },
  nominalLabel: { type: String, required: true },
  realLabel: { type: String, required: true },
  referenceLabel: { type: String, default: '' },
})

const chartElement = ref(null)
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
  () => [
    props.points,
    props.nominalLabel,
    props.realLabel,
    props.referenceLabel,
    workspaceCurrency.value,
  ],
  () => nextTick(renderChart),
  { deep: true },
)

function renderChart() {
  if (!chart || !props.points.length) return chart?.clear()

  const series = [
    lineSeries(props.nominalLabel, 'nominalValue', CHART_COLORS.successDark),
    lineSeries(props.realLabel, 'realValue', CHART_COLORS.primary),
  ]
  if (props.referenceLabel && props.points.some(({ referenceValue }) => referenceValue != null)) {
    series.push({
      ...lineSeries(props.referenceLabel, 'referenceValue', CHART_COLORS.muted),
      lineStyle: { width: 2, type: 'dashed', color: CHART_COLORS.muted },
    })
  }

  chart.setOption(
    {
      animationDuration: 300,
      aria: { enabled: true, label: { description: props.ariaLabel } },
      grid: { top: 44, right: 12, bottom: 38, left: 62, containLabel: false },
      legend: {
        top: 0,
        left: 0,
        itemWidth: 18,
        itemHeight: 3,
        textStyle: { color: CHART_COLORS.muted, fontSize: 11 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: CHART_COLORS.ink,
        borderWidth: 0,
        padding: [9, 12],
        textStyle: { color: CHART_COLORS.inverse, fontSize: 12 },
        formatter: (points) =>
          `<strong>Year ${points[0]?.axisValue ?? 0}</strong><br/>${points
            .map(
              ({ marker, seriesName, data }) =>
                `${marker}${seriesName}: <strong>${formatCurrency(data)}</strong>`,
            )
            .join('<br/>')}`,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: props.points.map(({ year }) => year),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART_COLORS.axis } },
        axisLabel: { color: CHART_COLORS.muted, fontSize: 11, hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        splitNumber: 4,
        min: (range) => Math.max(0, Math.floor(range.min * 0.9)),
        axisLabel: { color: CHART_COLORS.muted, fontSize: 11, formatter: compactCurrency },
        splitLine: { lineStyle: { color: CHART_COLORS.grid } },
      },
      series,
    },
    true,
  )
}

function lineSeries(name, key, color) {
  return {
    name,
    type: 'line',
    data: props.points.map((point) => point[key]),
    showSymbol: false,
    lineStyle: { width: 3, color },
    itemStyle: { color },
    emphasis: { focus: 'series' },
  }
}

function compactCurrency(value) {
  return new Intl.NumberFormat('en-IE', {
    notation: 'compact',
    style: 'currency',
    currency: workspaceCurrency.value,
    maximumFractionDigits: 1,
  }).format(value)
}
</script>

<style scoped>
.cash-value-chart {
  width: 100%;
  height: clamp(14rem, 34vw, 18rem);
}
</style>
