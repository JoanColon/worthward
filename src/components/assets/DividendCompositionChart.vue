<template>
  <article class="dividend-composition-card">
    <header>
      <div class="dividend-composition-title-row">
        <h3>{{ t('assets.portfolio.historicDividends.compositionTitle') }}</h3>
        <span v-if="year">{{ year }}</span>
      </div>
      <p>
        {{
          t('assets.portfolio.historicDividends.compositionSummary', {
            value: formattedTotal,
          })
        }}
      </p>
    </header>

    <div v-show="composition.length" ref="chartElement" class="dividend-composition-chart" />
    <div v-if="!composition.length" class="dividend-composition-empty">
      {{ t('assets.portfolio.historicDividends.compositionEmpty') }}
    </div>
  </article>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { TreemapChart } from 'echarts/charts'
import { AriaComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useI18n } from 'vue-i18n'
import { CHART_COLORS } from '@/config/chart-theme'
import {
  dividendCompositionByYear,
  formatCurrencyValue,
} from '@/domain/financial/investment-portfolio'

use([TreemapChart, TooltipComponent, AriaComponent, CanvasRenderer])

const props = defineProps({
  dividends: { type: Array, default: () => [] },
  year: { type: String, default: '' },
  baseCurrency: { type: String, default: '' },
})

const { t } = useI18n()
const chartElement = ref(null)
const composition = computed(() =>
  dividendCompositionByYear(props.dividends, props.year, t('assets.portfolio.allocation.unknown')),
)
const total = computed(() => composition.value.reduce((sum, item) => sum + item.value, 0))
const formattedTotal = computed(
  () => formatCurrencyValue(total.value, props.baseCurrency, 0) || '—',
)
let chart = null
let resizeObserver = null

const BLUE_SCALE = [
  '#0f4c81',
  '#17669b',
  '#1f7eae',
  '#278fb4',
  '#397faf',
  '#4c8fba',
  '#609fc4',
  '#76adcb',
  '#8bbbd3',
  '#a3c9dc',
  '#bad7e5',
  '#d2e5ee',
]

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
  () => [composition.value, props.baseCurrency, props.year],
  () => nextTick(renderChart),
  { deep: true },
)

function renderChart() {
  if (!chart) return
  if (!composition.value.length) {
    chart.clear()
    return
  }
  chart.setOption(
    {
      animationDuration: 350,
      aria: {
        enabled: true,
        label: {
          description: t('assets.portfolio.historicDividends.compositionAria', {
            year: props.year,
          }),
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: CHART_COLORS.ink,
        borderWidth: 0,
        padding: [9, 12],
        textStyle: { color: CHART_COLORS.inverse, fontSize: 12 },
        formatter: ({ name, value }) => {
          const percentage = total.value > 0 ? (value / total.value) * 100 : 0
          return `<strong>${escapeHtml(name)}</strong><br/>${escapeHtml(
            formatCurrencyValue(value, props.baseCurrency, 2),
          )} · ${formatPercentage(percentage)}`
        },
      },
      series: [
        {
          type: 'treemap',
          top: 8,
          right: 8,
          bottom: 8,
          left: 8,
          roam: false,
          nodeClick: false,
          sort: 'desc',
          squareRatio: 1.25,
          visibleMin: 24,
          breadcrumb: { show: false },
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 650,
            formatter: '{b}',
            overflow: 'truncate',
          },
          upperLabel: { show: false },
          itemStyle: {
            borderColor: CHART_COLORS.inverse,
            borderWidth: 3,
            borderRadius: 5,
            gapWidth: 3,
          },
          emphasis: {
            label: { fontWeight: 750 },
            itemStyle: { borderColor: CHART_COLORS.ink, borderWidth: 2 },
          },
          data: composition.value.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: BLUE_SCALE[Math.min(index, BLUE_SCALE.length - 1)] },
            label: { color: index < 8 ? CHART_COLORS.inverse : CHART_COLORS.ink },
          })),
        },
      ],
    },
    true,
  )
}

function formatPercentage(value) {
  return `${new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 }).format(value)}%`
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
.dividend-composition-card {
  min-width: 0;
  margin: 1rem;
  padding: 1.25rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
}

header h3,
header p {
  margin: 0;
}

.dividend-composition-title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.dividend-composition-title-row h3 {
  color: var(--color-ink);
  font-size: 1.05rem;
  line-height: 1.3;
}

.dividend-composition-title-row span {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: var(--color-blue-soft);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 750;
  text-align: center;
}

header p {
  margin-top: 0.3rem;
  color: var(--color-copy);
  font-size: 0.88rem;
  line-height: 1.4;
}

.dividend-composition-chart,
.dividend-composition-empty {
  width: 100%;
  height: clamp(24rem, 42vw, 31rem);
  margin-top: 1rem;
  overflow: hidden;
  border-radius: 0.85rem;
  background: var(--color-surface-soft);
}

.dividend-composition-empty {
  display: grid;
  place-items: center;
  color: var(--color-copy);
  text-align: center;
}

@media (max-width: 760px) {
  .dividend-composition-card {
    margin: 0.75rem;
    padding: 0.75rem;
  }
  .dividend-composition-chart,
  .dividend-composition-empty {
    height: 25rem;
    margin-top: 0.75rem;
  }
}
</style>
