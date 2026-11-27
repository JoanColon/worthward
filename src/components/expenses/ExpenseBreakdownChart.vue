<template>
  <section class="breakdown-card" :class="{ embedded }" :aria-label="title">
    <header v-if="!embedded">
      <h2 class="app-card-title">{{ title }}</h2>
    </header>

    <div v-if="entries.length" class="breakdown-content">
      <div class="chart-wrap">
        <div ref="chartElement" class="breakdown-chart" />
        <div v-if="!embedded" class="chart-total" aria-hidden="true">
          <strong>{{ formatCurrency(total) }}</strong>
          <span>{{ totalLabel }}</span>
        </div>
      </div>

      <div class="breakdown-legend">
        <div v-for="entry in visibleLegendEntries" :key="entry.id" class="legend-row">
          <i :style="{ backgroundColor: entry.color }" aria-hidden="true" />
          <span>{{ entry.name }}</span>
          <small>{{ formatPercentage(entry.percentage) }}</small>
        </div>
        <button
          v-if="hiddenEntryCount"
          type="button"
          class="legend-toggle"
          :aria-expanded="legendExpanded"
          @click="legendExpanded = !legendExpanded"
        >
          <span>{{
            legendExpanded
              ? t('expenses.overview.showFewerCategories')
              : t('expenses.overview.showMoreCategories', { count: hiddenEntryCount })
          }}</span>
          <q-icon :name="legendExpanded ? 'expand_less' : 'expand_more'" />
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <q-icon name="donut_large" />
      <span>{{ emptyLabel }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PieChart } from 'echarts/charts'
import { AriaComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useI18n } from 'vue-i18n'
import { CHART_COLORS } from '@/config/chart-theme'
import { formatCurrency } from '@/utils/formatters'

use([PieChart, TooltipComponent, AriaComponent, CanvasRenderer])

const props = defineProps({
  title: { type: String, required: true },
  totalLabel: { type: String, required: true },
  emptyLabel: { type: String, required: true },
  entries: { type: Array, default: () => [] },
  embedded: { type: Boolean, default: false },
  initialLegendLimit: { type: Number, default: 5 },
})
const { t, locale } = useI18n()
const chartElement = ref(null)
const legendExpanded = ref(false)
const total = computed(() =>
  props.entries.reduce((sum, entry) => sum + Number(entry.value || 0), 0),
)
const hiddenEntryCount = computed(() =>
  Math.max(0, props.entries.length - props.initialLegendLimit),
)
const visibleLegendEntries = computed(() =>
  legendExpanded.value ? props.entries : props.entries.slice(0, props.initialLegendLimit),
)
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
  () => [props.entries, locale.value],
  () => nextTick(renderChart),
  { deep: true },
)

function renderChart() {
  if (!chart) return
  if (!props.entries.length) {
    chart.clear()
    return
  }
  chart.setOption(
    {
      animationDuration: 350,
      aria: { enabled: true, label: { description: props.title } },
      tooltip: {
        trigger: 'item',
        backgroundColor: CHART_COLORS.ink,
        borderWidth: 0,
        textStyle: { color: CHART_COLORS.inverse },
        formatter: ({ name, percent, marker }) =>
          `${marker}<strong>${escapeHtml(name)}</strong><br/>${formatPercentage(percent)}`,
      },
      series: [
        {
          type: 'pie',
          radius: ['60%', '96%'],
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderColor: CHART_COLORS.inverse, borderWidth: 3, borderRadius: 4 },
          data: props.entries.map((entry) => ({
            name: entry.name,
            value: entry.value,
            itemStyle: { color: entry.color },
          })),
        },
      ],
    },
    true,
  )
}

function formatPercentage(value) {
  return `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value || 0)}%`
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
@use '@/css/mixins' as *;

.breakdown-card {
  min-width: 0;
}

.breakdown-card:not(.embedded) {
  @include dashboard-card;
  padding: var(--space-5);
}

.breakdown-card:not(.embedded) .breakdown-content {
  display: grid;
  grid-template-columns: minmax(14rem, 0.95fr) minmax(14rem, 1.05fr);
  align-items: center;
  gap: var(--space-5);
  min-height: 13rem;
}

.chart-wrap {
  position: relative;
  min-width: 0;
}

.breakdown-card:not(.embedded) .chart-wrap {
  height: 13.25rem;
}

.breakdown-chart {
  width: 100%;
  height: 100%;
}

.chart-total {
  position: absolute;
  inset: 50% auto auto 50%;
  display: grid;
  width: 55%;
  transform: translate(-50%, -50%);
  color: var(--color-copy);
  text-align: center;
}

.chart-total strong {
  color: var(--color-ink);
  font-size: clamp(1rem, 2vw, 1.45rem);
  line-height: 1.1;
}

.chart-total span {
  font-size: 0.72rem;
}

.breakdown-legend {
  display: grid;
  gap: 0.65rem;
}

.legend-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  min-height: 1.8rem;
  margin-top: 0.15rem;
  padding: 0.25rem;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.legend-toggle:hover {
  text-decoration: underline;
}

.legend-toggle:focus-visible {
  @include focus-ring;
}

.legend-toggle .q-icon {
  font-size: 1rem;
}

.legend-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
  color: var(--color-ink);
  font-size: 0.82rem;
}

.legend-row i {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
}

.legend-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-row small {
  min-width: 3rem;
  color: var(--color-copy);
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  text-align: right;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 13rem;
  color: var(--color-muted);
  text-align: center;
}

.empty-state .q-icon {
  font-size: 2rem;
}

@media (max-width: bp.$content-compact-max) {
  .breakdown-card:not(.embedded) {
    padding: var(--space-4);
  }

  .breakdown-card:not(.embedded) .breakdown-content {
    grid-template-columns: minmax(8.5rem, 0.85fr) minmax(0, 1.15fr);
    gap: var(--space-3);
    min-height: 10rem;
  }

  .breakdown-card:not(.embedded) .chart-wrap {
    height: 10.5rem;
  }

  .legend-row {
    gap: 0.4rem;
    font-size: 0.72rem;
  }

  .legend-row small {
    min-width: 2.6rem;
    font-size: 0.74rem;
  }
}
</style>
