<template>
  <section class="category-breakdown" :aria-label="title">
    <header class="breakdown-heading">
      <h2>{{ title }}</h2>
    </header>

    <div ref="chartElement" class="breakdown-chart" :style="{ height: `${chartHeight}px` }" />

    <button
      v-if="entries.length > initialLimit"
      type="button"
      class="breakdown-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span>{{
        expanded
          ? t('financial.categoryBreakdown.showFewer')
          : t('financial.categoryBreakdown.showMore', { count: hiddenEntryCount })
      }}</span>
      <q-icon :name="expanded ? 'expand_less' : 'expand_more'" />
    </button>

    <div v-if="!entries.length" class="empty-copy">
      <q-icon name="bar_chart" />
      <span>{{ emptyLabel }}</span>
    </div>
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
  tone: {
    type: String,
    required: true,
    validator: (value) => ['assets', 'liabilities', 'income', 'expenses'].includes(value),
  },
  title: { type: String, required: true },
  emptyLabel: { type: String, required: true },
  entries: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  initialLimit: { type: Number, default: 5 },
})

const { t, locale } = useI18n()
const chartElement = ref(null)
const expanded = ref(false)
const hiddenEntryCount = computed(() => Math.max(0, props.entries.length - props.initialLimit))
const barColor = computed(() =>
  ['liabilities', 'expenses'].includes(props.tone) ? CHART_COLORS.danger : CHART_COLORS.primary,
)
const visibleEntries = computed(() =>
  expanded.value ? props.entries : props.entries.slice(0, props.initialLimit),
)
const chartHeight = computed(() => {
  if (!visibleEntries.value.length) return 132
  return visibleEntries.value.length * 36 + 8
})
let chart = null
let resizeObserver = null

onMounted(() => {
  chart = init(chartElement.value)
  resizeObserver = new ResizeObserver(() => {
    chart?.resize()
    renderChart()
  })
  resizeObserver.observe(chartElement.value)
  renderChart()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
})

watch(
  () => [visibleEntries.value, props.total, props.tone, locale.value, chartHeight.value],
  () =>
    nextTick(() => {
      chart?.resize()
      renderChart()
    }),
  { deep: true },
)

function renderChart() {
  if (!chart) return
  if (!visibleEntries.value.length) {
    chart.clear()
    return
  }

  const compact = chartElement.value?.clientWidth < 520
  chart.setOption(
    {
      animationDuration: 300,
      aria: { enabled: true, label: { description: props.title } },
      grid: {
        left: compact ? 4 : 8,
        right: compact ? 42 : 50,
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
          `${marker}<strong>${escapeHtml(data.name)}</strong><br/>${formatPercentage(data.value)}`,
      },
      xAxis: { type: 'value', min: 0, max: 100, show: false },
      yAxis: {
        type: 'category',
        inverse: true,
        data: visibleEntries.value.map(({ name }) => name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          width: compact ? 92 : 140,
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
          barWidth: compact ? 7 : 9,
          showBackground: true,
          backgroundStyle: { color: CHART_COLORS.grid, borderRadius: 999 },
          itemStyle: { color: barColor.value, borderRadius: 999 },
          data: visibleEntries.value.map((entry) => ({
            name: entry.name,
            value: entryPercentage(entry),
          })),
        },
        {
          type: 'bar',
          barWidth: compact ? 7 : 9,
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
            formatter: ({ data }) => formatPercentage(data.percentage),
          },
          data: visibleEntries.value.map((entry) => ({
            name: entry.name,
            value: 100,
            percentage: entryPercentage(entry),
          })),
        },
      ],
    },
    true,
  )
}

function entryPercentage(entry) {
  if (props.total <= 0) return 0
  return Math.min(100, Math.max(0, (Number(entry.value || 0) / props.total) * 100))
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
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.category-breakdown {
  position: relative;
  min-width: 0;
  padding: var(--space-5);
}

.breakdown-heading h2 {
  margin: 0 0 var(--space-3);
  color: var(--color-ink);
  font-size: 1rem;
  line-height: 1.25;
}

.breakdown-chart {
  width: 100%;
  transition: height 220ms ease;
}

.breakdown-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-height: 1.8rem;
  width: 100%;
  margin: var(--space-2) auto 0;
  padding: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.breakdown-toggle:hover {
  text-decoration: underline;
}

.breakdown-toggle:focus-visible {
  @include focus-ring;
}

.breakdown-toggle .q-icon {
  font-size: 1rem;
}

.empty-copy {
  position: absolute;
  inset: 3rem 0 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--space-2);
  color: var(--color-muted);
  font-size: 0.82rem;
}

.empty-copy .q-icon {
  font-size: 2rem;
}

@media (max-width: bp.$content-compact-max) {
  .category-breakdown {
    padding: var(--space-4);
  }
}
</style>
