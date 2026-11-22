<template>
  <DashboardCard
    class="plan-summary-card"
    :title="activeCard.title"
    :subtitle="activeCard.subtitle"
    :icon="activeCard.icon"
    :icon-tone="activeCard.iconTone"
  >
    <template #action>
      <div
        class="summary-switch"
        role="group"
        :aria-label="t('dashboard.summaryCarousel.navigationLabel')"
      >
        <button
          v-for="item in slides"
          :key="item.name"
          type="button"
          :class="{ active: activeSlide === item.name }"
          :aria-pressed="activeSlide === item.name"
          @click="activeSlide = item.name"
        >
          {{ item.label }}
        </button>
      </div>
    </template>

    <q-carousel
      v-model="activeSlide"
      class="summary-carousel"
      animated
      swipeable
      transition-prev="slide-right"
      transition-next="slide-left"
    >
      <q-carousel-slide name="plan" class="summary-slide">
        <div v-if="data.state === 'strategy'" class="plan-result strategy-plan-result">
          <div class="strategy-context">
            <div class="strategy-summary">
              <strong>{{ data.name }}</strong>
              <span>
                {{
                  t('dashboard.planSummary.allocatedMonthly', {
                    amount: formatCurrency(data.monthlyAmount),
                  })
                }}
              </span>
            </div>
          </div>
          <ul class="strategy-outcomes" :aria-label="t('plan.outcomes.label')">
            <li v-for="outcome in data.outcomes" :key="outcome.id" :class="outcome.id">
              <span><i aria-hidden="true" />{{ outcome.label }}</span>
              <strong>{{ outcome.result }}</strong>
            </li>
          </ul>
        </div>

        <div v-else-if="data.state === 'what-if'" class="plan-result">
          <span class="result-label">{{ t('dashboard.planSummary.whatIfLabel') }}</span>
          <strong class="result-value">{{ formatCurrency(data.monthlyAmount) }}</strong>
          <span class="primary-result">
            {{ t('dashboard.planSummary.extraSavingsGenerated') }}
          </span>
          <span class="secondary-result positive">
            {{ t('dashboard.planSummary.comparedWithToday') }}
          </span>
        </div>

        <div v-else class="plan-empty">
          <span class="empty-icon"><q-icon name="insights" /></span>
          <strong>{{ t('dashboard.planSummary.emptyTitle') }}</strong>
          <p>{{ t('dashboard.planSummary.emptyDescription') }}</p>
        </div>

        <router-link class="summary-action" :to="data.state === 'empty' ? setupRoute : planRoute">
          <span>
            {{
              data.state === 'empty'
                ? t('dashboard.planSummary.addData')
                : t('dashboard.planSummary.action')
            }}
          </span>
          <q-icon name="arrow_forward" />
        </router-link>
      </q-carousel-slide>

      <q-carousel-slide name="progress" class="summary-slide">
        <div class="progress-metrics">
          <article
            v-for="metric in progressData"
            :key="metric.id"
            class="progress-metric"
            :class="metric.tone"
          >
            <span class="progress-metric-icon"><q-icon :name="metric.icon" /></span>
            <span class="progress-metric-copy">
              <small>{{ metric.label }}</small>
              <strong :class="{ negative: metric.negative }">{{ metric.value }}</strong>
            </span>
          </article>
        </div>

        <router-link class="summary-action" :to="progressRoute">
          <span>{{ t('dashboard.progressSummary.action') }}</span>
          <q-icon name="arrow_forward" />
        </router-link>
      </q-carousel-slide>
    </q-carousel>
  </DashboardCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DashboardCard from './DashboardCard.vue'
import { formatCurrency } from '@/utils/formatters'

defineProps({
  data: { type: Object, required: true },
  progressData: { type: Array, required: true },
  planRoute: { type: Object, required: true },
  progressRoute: { type: Object, required: true },
  setupRoute: { type: Object, required: true },
})

const { t } = useI18n()
const activeSlide = ref('plan')
const slides = computed(() => [
  { name: 'plan', label: t('dashboard.planSummary.title') },
  { name: 'progress', label: t('progress.title') },
])
const activeCard = computed(() =>
  activeSlide.value === 'progress'
    ? {
        title: t('progress.title'),
        subtitle: t('dashboard.progressSummary.subtitle'),
        icon: 'trending_up',
        iconTone: 'purple',
      }
    : {
        title: t('dashboard.planSummary.title'),
        subtitle: t('dashboard.planSummary.subtitle'),
        icon: 'track_changes',
        iconTone: 'blue',
      },
)
</script>

<style lang="scss">
.plan-summary-card {
  display: flex;
  flex-direction: column;

  .summary-switch {
    display: inline-flex;
    padding: 0.18rem;
    border: 1px solid var(--color-line-strong);
    border-radius: 999px;
    background: var(--color-surface-soft);
  }

  .summary-switch button {
    appearance: none;
    min-height: 1.85rem;
    padding: 0.25rem 0.65rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--color-copy);
    font: inherit;
    font-size: 0.72rem;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }

  .summary-switch button.active {
    background: var(--color-ink);
    color: var(--color-inverse);
    box-shadow: var(--shadow-control);
  }

  .summary-switch button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .card-icon .q-icon {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    line-height: 1;
  }

  .summary-carousel {
    flex: 1;
    height: 15rem;
    background: transparent;
  }

  .summary-slide {
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  .plan-result,
  .plan-empty {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 11rem;
    text-align: center;
  }

  .plan-result {
    justify-content: flex-start;
    padding-top: 0.25rem;
  }

  .strategy-plan-result {
    align-items: stretch;
    padding-bottom: 0.5rem;
    text-align: left;
  }

  .strategy-context {
    display: grid;
    gap: 0.2rem;
  }

  .strategy-summary {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.6rem;
  }

  .strategy-summary strong {
    overflow: hidden;
    color: var(--color-ink);
    font-size: 1rem;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .strategy-summary span {
    flex: 0 0 auto;
    color: var(--color-copy);
    font-size: 0.72rem;
    font-weight: 650;
  }

  .result-label {
    color: var(--color-primary);
    font-size: 0.78rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .result-value {
    margin-top: 0.45rem;
    font-size: clamp(1.7rem, 3vw, 2.5rem);
    line-height: 1.05;
    letter-spacing: -0.04em;
  }

  .primary-result {
    margin-top: 0.7rem;
    color: var(--color-ink-soft);
    font-weight: 650;
  }

  .secondary-result {
    margin-top: 0.25rem;
    color: var(--color-copy);
    font-size: 0.82rem;
  }

  .secondary-result.positive {
    color: var(--color-success-dark);
  }

  .strategy-outcomes {
    display: grid;
    width: 100%;
    gap: 0.35rem;
    margin: 0.55rem 0 0;
    padding: 0;
    list-style: none;
  }

  .strategy-outcomes li,
  .strategy-outcomes li > span {
    display: flex;
    align-items: center;
  }

  .strategy-outcomes li {
    justify-content: space-between;
    gap: 0.55rem;
    min-height: 2.15rem;
    padding: 0.38rem 0.5rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, var(--color-green-soft) 65%, var(--color-surface));
    color: var(--color-copy);
    font-size: 0.72rem;
    text-align: left;
  }

  .strategy-outcomes li.invest {
    background: color-mix(in srgb, var(--color-purple-soft) 58%, var(--color-surface));
  }

  .strategy-outcomes li.debt {
    background: color-mix(in srgb, #fff0e8 72%, var(--color-surface));
  }

  .strategy-outcomes li > span {
    gap: 0.38rem;
    min-width: 0;
  }

  .strategy-outcomes i {
    width: 0.42rem;
    height: 0.42rem;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--color-chart-cash);
  }

  .strategy-outcomes .invest i {
    background: var(--color-chart-investments);
  }

  .strategy-outcomes .debt i {
    background: var(--color-chart-lifestyle);
  }

  .strategy-outcomes strong {
    min-width: 0;
    color: var(--color-ink);
    font-size: 0.74rem;
    font-weight: 750;
    line-height: 1.15;
    text-align: right;
  }

  .empty-icon {
    display: grid;
    place-items: center;
    width: 3.5rem;
    height: 3.5rem;
    margin-bottom: 0.75rem;
    border-radius: 50%;
    background: var(--color-blue-soft);
    color: var(--color-primary);
    font-size: 1.6rem;
  }

  .plan-empty p {
    max-width: 22rem;
    margin: 0.4rem 0 0;
    color: var(--color-copy);
    font-size: 0.85rem;
  }

  .summary-action {
    display: inline-flex;
    align-items: center;
    align-self: flex-end;
    flex: 0 0 auto;
    gap: 0.35rem;
    margin-top: 0.75rem;
    color: var(--color-primary);
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
  }

  .summary-action:hover {
    text-decoration: underline;
  }

  .summary-action:focus-visible {
    border-radius: 0.2rem;
    outline: 2px solid var(--color-primary);
    outline-offset: 3px;
  }

  .progress-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    flex: 1;
    gap: 0.55rem;
  }

  .progress-metric {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
    min-height: 5rem;
    padding: 0.65rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-soft);
  }

  .progress-metric.green {
    background: color-mix(in srgb, var(--color-green-soft) 72%, var(--color-surface));
  }

  .progress-metric.warning {
    background: color-mix(in srgb, var(--color-warning-soft) 68%, var(--color-surface));
  }

  .progress-metric.purple {
    background: color-mix(in srgb, var(--color-purple-soft) 68%, var(--color-surface));
  }

  .progress-metric.blue {
    background: color-mix(in srgb, var(--color-blue-soft) 72%, var(--color-surface));
  }

  .progress-metric-icon {
    display: grid;
    place-items: center;
    flex: 0 0 2rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-surface-raised);
    color: var(--color-primary);
    font-size: 1rem;
  }

  .progress-metric.green .progress-metric-icon {
    color: var(--color-success-dark);
  }

  .progress-metric.warning .progress-metric-icon {
    color: var(--color-warning-dark);
  }

  .progress-metric.purple .progress-metric-icon {
    color: var(--color-purple);
  }

  .progress-metric-copy {
    display: grid;
    min-width: 0;
  }

  .progress-metric-copy small {
    color: var(--color-copy);
    font-size: 0.7rem;
    line-height: 1.2;
  }

  .progress-metric-copy strong {
    overflow: hidden;
    margin-top: 0.15rem;
    color: var(--color-ink);
    font-size: clamp(0.95rem, 2.2vw, 1.2rem);
    line-height: 1.1;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .progress-metric-copy strong.negative {
    color: var(--color-danger);
  }

  @media (min-width: 1024px) {
    box-sizing: border-box;
    height: 24rem;
    padding-bottom: 0.75rem;

    .summary-carousel {
      min-height: 0;
      height: auto;
    }

    .card-header {
      margin-bottom: 0.65rem;
    }

    .card-heading {
      gap: 0.65rem;
    }

    .card-heading p {
      display: block;
      font-size: 0.84rem;
    }

    .card-icon {
      width: 2.8rem;
      height: 2.8rem;
      flex-basis: 2.8rem;
      font-size: 1.25rem;
    }

    .plan-result,
    .plan-empty {
      min-height: 11rem;
    }

    .strategy-plan-result {
      flex: 1 1 auto;
      justify-content: center;
      padding: 0.45rem 0 0.25rem;
    }

    .strategy-context {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transform: none;
    }

    .strategy-summary {
      flex-direction: column;
      align-items: center;
      gap: 0.05rem;
    }

    .strategy-summary strong {
      font-size: clamp(1.75rem, 2.7vw, 2.1rem);
      line-height: 1.05;
      letter-spacing: -0.035em;
    }

    .strategy-summary span {
      margin-top: 0.15rem;
      font-size: 0.9rem;
    }

    .result-value {
      margin-top: 0.2rem;
      font-size: clamp(1.45rem, 2.6vw, 2.1rem);
    }

    .primary-result {
      margin-top: 0.2rem;
      font-size: 0.78rem;
    }

    .strategy-outcomes {
      gap: 0.45rem;
      margin-top: clamp(1rem, 2.2vh, 1.35rem);
    }

    .strategy-outcomes li {
      min-height: 2.4rem;
      padding: 0.48rem 0.65rem;
      font-size: 0.82rem;
    }

    .strategy-outcomes strong {
      font-size: 0.84rem;
    }

    .secondary-result {
      font-size: 0.75rem;
    }

    .empty-icon {
      width: 2.75rem;
      height: 2.75rem;
      margin-bottom: 0.5rem;
      font-size: 1.25rem;
    }

    .summary-action {
      margin-top: auto;
      min-height: 1.25rem;
      padding-top: 0.45rem;
      font-size: 0.84rem;
    }
  }

  @container (max-width: 28rem) {
    .strategy-plan-result {
      justify-content: flex-start;
      padding-top: 0.75rem;
    }

    .strategy-summary strong {
      max-width: 100%;
      font-size: clamp(1.35rem, 8cqi, 1.8rem);
    }

    .strategy-summary span {
      max-width: 100%;
      line-height: 1.25;
      text-align: center;
      white-space: normal;
    }

    .strategy-outcomes strong {
      flex: 0 1 70%;
      overflow-wrap: anywhere;
    }
  }
}
</style>
