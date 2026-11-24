<template><div ref="chartElement" class="investment-learn-chart" /></template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LineChart, ScatterChart } from 'echarts/charts'
import { AriaComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CHART_COLORS } from '@/config/chart-theme'
import { formatCurrency, workspaceCurrency } from '@/utils/formatters'

use([
  LineChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  AriaComponent,
  CanvasRenderer,
])

const props = defineProps({
  series: { type: Array, default: () => [] },
  ariaLabel: { type: String, required: true },
  xKey: { type: String, default: 'year' },
  xSuffix: { type: String, default: '' },
  highlight: { type: Object, default: null },
})
const chartElement = ref(null)
let chart
let resizeObserver

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
  () => [props.series, props.highlight, workspaceCurrency.value],
  () => nextTick(renderChart),
  { deep: true },
)

function renderChart() {
  if (!chart || !props.series.length) return chart?.clear()
  const chartSeries = props.series.map((item) => ({
    name: item.name,
    type: 'line',
    data: item.points.map((point) => [point[props.xKey], point.value]),
    showSymbol: false,
    smooth: Boolean(item.smooth),
    lineStyle: {
      width: item.width || 2.5,
      type: item.dashed ? 'dashed' : 'solid',
      color: item.color,
    },
    itemStyle: { color: item.color },
    emphasis: { focus: 'series' },
  }))
  if (props.highlight) {
    chartSeries.push({
      name: props.highlight.name,
      type: 'scatter',
      data: [[props.highlight.x, props.highlight.value]],
      symbolSize: 10,
      itemStyle: {
        color: props.highlight.color || CHART_COLORS.warning,
        borderColor: '#fff',
        borderWidth: 2,
      },
      z: 5,
    })
  }
  chart.setOption(
    {
      animationDuration: 300,
      aria: { enabled: true, label: { description: props.ariaLabel } },
      grid: { top: 48, right: 14, bottom: 38, left: 66 },
      legend: {
        top: 0,
        left: 0,
        itemWidth: 17,
        itemHeight: 3,
        textStyle: { color: CHART_COLORS.muted, fontSize: 10 },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: CHART_COLORS.ink,
        borderWidth: 0,
        textStyle: { color: CHART_COLORS.inverse, fontSize: 12 },
        formatter: (points) =>
          `<strong>${points[0]?.axisValue}${props.xSuffix}</strong><br/>${points.map(({ marker, seriesName, data }) => `${marker}${seriesName}: <strong>${formatCurrency(data[1])}</strong>`).join('<br/>')}`,
      },
      xAxis: {
        type: 'value',
        min: 0,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART_COLORS.axis } },
        axisLabel: {
          color: CHART_COLORS.muted,
          fontSize: 10,
          formatter: (value) => `${value}${props.xSuffix}`,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: (range) => Math.max(0, Math.floor(range.min * 0.9)),
        splitNumber: 4,
        axisLabel: { color: CHART_COLORS.muted, fontSize: 10, formatter: compactCurrency },
        splitLine: { lineStyle: { color: CHART_COLORS.grid } },
      },
      series: chartSeries,
    },
    true,
  )
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
.investment-learn-chart {
  width: 100%;
  height: clamp(15rem, 35vw, 19rem);
}
</style>
