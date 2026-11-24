<template>
  <article class="mortgage-lesson">
    <span class="mortgage-lesson__eyebrow">{{ t(`${topicKey}.eyebrow`) }}</span>
    <h2>{{ t(`${topicKey}.title`) }}</h2>
    <p class="mortgage-lesson__lead">{{ t(`${topicKey}.lead`) }}</p>
    <LearnDataSourceToggle
      v-model="dataSource"
      :enabled="modelContext"
      :model-available="Boolean(modelData)"
    />

    <template v-if="topicId === 'frenchAmortization'">
      <LearnLessonSection :label="t('learn.lesson.whatIsIt')">
        <p>{{ t(`${topicKey}.what`) }}</p>
      </LearnLessonSection>

      <LearnLessonSection :label="t('learn.lesson.howItWorks')">
        <p>{{ t(`${topicKey}.how`) }}</p>
        <div class="mortgage-flow-titles">
          <strong>{{ t('learn.lesson.interest') }}</strong>
          <strong>{{ t('learn.lesson.principal') }}</strong>
        </div>
        <div class="mortgage-flow" aria-hidden="true">
          <span class="mortgage-flow__interest" />
          <span class="mortgage-flow__principal" />
        </div>
        <div class="mortgage-flow-labels">
          <small>{{ t(`${topicKey}.moreInterest`) }}</small>
          <small>{{ t(`${topicKey}.morePrincipal`) }}</small>
        </div>
      </LearnLessonSection>

      <LearnLessonSection :label="t('learn.lesson.example')">
        <div class="example-card">
          <span class="example-card__title">{{ t(`${topicKey}.exampleTitle`) }}</span>
          <div class="example-metrics">
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.loan`) }}</small>
              <q-input
                v-model.number="exampleLoan"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="decimal"
                min="0"
                step="1000"
                prefix="€"
                :readonly="usingModelData"
                :aria-label="t(`${topicKey}.loan`)"
              />
            </div>
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.fixedRate`) }}</small>
              <q-input
                v-model.number="exampleRate"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="decimal"
                min="0"
                max="100"
                step="0.1"
                suffix="%"
                :readonly="usingModelData"
                :aria-label="t(`${topicKey}.fixedRate`)"
              />
            </div>
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.term`) }}</small>
              <q-input
                v-model.number="exampleTermYears"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="numeric"
                min="1"
                max="100"
                step="1"
                :suffix="t(`${topicKey}.years`)"
                :readonly="usingModelData"
                :aria-label="t(`${topicKey}.term`)"
              />
            </div>
            <div class="example-metric example-metric--result">
              <small>{{ t(`${topicKey}.monthlyPayment`) }}</small>
              <strong>{{ formattedMonthlyPayment }}</strong>
            </div>
          </div>
          <p class="example-card__note">{{ t(`${topicKey}.exampleNote`) }}</p>
        </div>

        <div class="payment-schedule">
          <div v-for="payment in paymentSchedule" :key="payment.label" class="payment-row">
            <div class="payment-row__header">
              <strong>{{ payment.label }}</strong>
              <span>{{ formatMortgageMoney(payment.payment) }}</span>
            </div>
            <div class="payment-row__bar" aria-hidden="true">
              <span
                class="payment-row__principal"
                :style="{ width: `${payment.principalShare}%` }"
              />
              <span class="payment-row__interest" />
            </div>
            <div class="payment-row__legend">
              <small
                >{{ t('learn.lesson.principal') }}
                {{ formatMortgageMoney(payment.principal) }}</small
              >
              <small
                >{{ t('learn.lesson.interest') }} {{ formatMortgageMoney(payment.interest) }}</small
              >
            </div>
          </div>
        </div>
        <p class="lesson-caption">{{ t(`${topicKey}.scheduleNote`) }}</p>
      </LearnLessonSection>
    </template>

    <template v-else-if="topicId === 'principalVsInterest'">
      <LearnLessonSection :label="t('learn.lesson.whatIsIt')">
        <p>{{ t(`${topicKey}.what`) }}</p>
      </LearnLessonSection>

      <LearnLessonSection :label="t('learn.lesson.howItWorks')">
        <div class="definition-grid">
          <div class="definition-card definition-card--principal">
            <span class="definition-card__icon"><q-icon name="trending_down" /></span>
            <strong>{{ t('learn.lesson.principal') }}</strong>
            <p>{{ t(`${topicKey}.principalDefinition`) }}</p>
          </div>
          <div class="definition-card definition-card--interest">
            <span class="definition-card__icon"><q-icon name="percent" /></span>
            <strong>{{ t('learn.lesson.interest') }}</strong>
            <p>{{ t(`${topicKey}.interestDefinition`) }}</p>
          </div>
        </div>
      </LearnLessonSection>

      <LearnLessonSection :label="t('learn.lesson.example')">
        <div class="split-card">
          <span class="example-card__title">{{ t(`${topicKey}.exampleTitle`) }}</span>
          <strong class="split-card__total">€948.42</strong>
          <div class="split-bar" role="img" :aria-label="t(`${topicKey}.splitAria`)">
            <span class="split-bar__principal" />
            <span class="split-bar__interest" />
          </div>
          <div class="split-values">
            <div>
              <span class="split-values__dot split-values__dot--principal" />
              <small>{{ t('learn.lesson.principal') }}</small>
              <strong>€448.42</strong>
              <span>47.3%</span>
            </div>
            <div>
              <span class="split-values__dot split-values__dot--interest" />
              <small>{{ t('learn.lesson.interest') }}</small>
              <strong>€500.00</strong>
              <span>52.7%</span>
            </div>
          </div>
        </div>
      </LearnLessonSection>
    </template>

    <template v-else>
      <LearnLessonSection :label="t('learn.lesson.whatIsIt')">
        <p>{{ t(`${topicKey}.what`) }}</p>
      </LearnLessonSection>

      <LearnLessonSection :label="t('learn.lesson.howItWorks')">
        <p>{{ t(`${topicKey}.how`) }}</p>
      </LearnLessonSection>

      <LearnLessonSection :label="t('learn.lesson.example')">
        <div class="example-card repayment-example">
          <span class="example-card__title">{{ t(`${topicKey}.exampleTitle`) }}</span>
          <div class="example-metrics repayment-example__inputs">
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.loan`) }}</small>
              <q-input
                v-model.number="exampleLoan"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="decimal"
                min="0"
                step="1000"
                prefix="€"
                :readonly="usingModelData"
                :aria-label="t(`${topicKey}.loan`)"
              />
            </div>
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.fixedRate`) }}</small>
              <q-input
                v-model.number="exampleRate"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="decimal"
                min="0"
                max="100"
                step="0.1"
                suffix="%"
                :readonly="usingModelData"
                :aria-label="t(`${topicKey}.fixedRate`)"
              />
            </div>
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.term`) }}</small>
              <q-input
                v-model.number="exampleTermYears"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="numeric"
                min="1"
                max="100"
                step="1"
                :suffix="t(`${topicKey}.years`)"
                :readonly="usingModelData"
                :aria-label="t(`${topicKey}.term`)"
              />
            </div>
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.repayment`) }}</small>
              <q-input
                v-model.number="earlyRepaymentAmount"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="decimal"
                min="0"
                step="1000"
                prefix="€"
                :aria-label="t(`${topicKey}.repayment`)"
              />
            </div>
            <div class="example-metric example-metric--editable">
              <small>{{ t(`${topicKey}.repaymentAfter`) }}</small>
              <q-input
                v-model.number="earlyRepaymentAfterYears"
                outlined
                dense
                hide-bottom-space
                type="number"
                inputmode="numeric"
                min="0"
                :max="Math.max(0, Math.floor(Number(exampleTermYears)) - 1)"
                step="1"
                :suffix="t(`${topicKey}.years`)"
                :aria-label="t(`${topicKey}.repaymentAfter`)"
              />
            </div>
            <div class="example-metric example-metric--result">
              <small>{{ t(`${topicKey}.monthlyPayment`) }}</small>
              <strong>{{ formattedEarlyMonthlyPayment }}</strong>
            </div>
          </div>
          <p v-if="earlyRepaymentProjection" class="example-card__note">
            {{
              t(`${topicKey}.exampleNote`, {
                balance: formatMortgageMoney(earlyRepaymentProjection.balanceBeforeRepayment),
                term: formatMortgageDuration(earlyRepaymentProjection.remainingTermMonths),
              })
            }}
          </p>
        </div>

        <div v-if="earlyRepaymentProjection" class="option-grid">
          <div class="option-card">
            <span class="option-card__icon"><q-icon name="payments" /></span>
            <span class="option-card__title">{{ t(`${topicKey}.optionPayment`) }}</span>
            <strong class="option-card__value">{{
              formatMortgageMoney(earlyRepaymentProjection.reducePayment.monthlyPayment)
            }}</strong>
            <p>
              {{
                t(`${topicKey}.optionPaymentDetail`, {
                  term: formatMortgageDuration(earlyRepaymentProjection.remainingTermMonths),
                  amount: formatMortgageMoney(
                    earlyRepaymentProjection.reducePayment.monthlyCashFlowImprovement,
                  ),
                })
              }}
            </p>
            <span class="option-card__saving">
              <q-icon name="savings" />
              {{
                t(`${topicKey}.savingInterest`, {
                  amount: formatMortgageMoney(earlyRepaymentProjection.reducePayment.interestSaved),
                })
              }}
            </span>
          </div>
          <div
            class="option-card"
            :class="{
              'option-card--featured':
                earlyRepaymentProjection.shortenTerm.interestSaved >
                earlyRepaymentProjection.reducePayment.interestSaved,
            }"
          >
            <span
              v-if="
                earlyRepaymentProjection.shortenTerm.interestSaved >
                earlyRepaymentProjection.reducePayment.interestSaved
              "
              class="option-card__badge"
              >{{ t(`${topicKey}.savesMost`) }}</span
            >
            <span class="option-card__icon"><q-icon name="event_available" /></span>
            <span class="option-card__title">{{ t(`${topicKey}.optionTerm`) }}</span>
            <strong class="option-card__value">{{
              formatMortgageDuration(earlyRepaymentProjection.shortenTerm.remainingPayments)
            }}</strong>
            <p>
              {{
                t(`${topicKey}.optionTermDetail`, {
                  payment: formatMortgageMoney(earlyRepaymentProjection.monthlyPayment),
                  duration: formatMortgageDuration(
                    earlyRepaymentProjection.shortenTerm.monthsEarlier,
                  ),
                })
              }}
            </p>
            <span class="option-card__saving">
              <q-icon name="savings" />
              {{
                t(`${topicKey}.savingInterest`, {
                  amount: formatMortgageMoney(earlyRepaymentProjection.shortenTerm.interestSaved),
                })
              }}
            </span>
          </div>
        </div>
        <p class="lesson-caption">{{ t(`${topicKey}.comparisonNote`) }}</p>
      </LearnLessonSection>

      <LearnLessonSection :label="t(`${topicKey}.beforeRepaying`)" compact>
        <ul class="check-list">
          <li v-for="item in repaymentChecks" :key="item">
            <q-icon name="check_circle" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </LearnLessonSection>
    </template>

    <aside class="why-card">
      <span class="why-card__icon"><q-icon name="lightbulb" /></span>
      <div>
        <strong>{{ t('learn.lesson.whyItMatters') }}</strong>
        <p>{{ t(`${topicKey}.why`) }}</p>
      </div>
    </aside>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LearnDataSourceToggle from '@/components/learn/LearnDataSourceToggle.vue'
import LearnLessonSection from '@/components/learn/LearnLessonSection.vue'
import {
  buildFrenchMortgageScheduleFromBalance,
  calculateFrenchMortgageMonthlyPayment,
  compareFrenchMortgageLumpSumScenarios,
} from '../../../functions/shared/liabilities/mortgage.js'

const props = defineProps({
  topicId: { type: String, required: true },
  modelContext: { type: Boolean, default: false },
  modelData: { type: Object, default: null },
})

const { t } = useI18n()
const topicKey = computed(() => `learn.mortgageLessons.${props.topicId}`)
const dataSource = ref('example')
const exampleLoan = ref(200_000)
const exampleRate = ref(3)
const exampleTermMonths = ref(25 * 12)
const exampleTermYears = computed({
  get: () => Number((exampleTermMonths.value / 12).toFixed(2)),
  set: (value) => {
    exampleTermMonths.value = Math.max(1, Math.round((Number(value) || 0) * 12))
  },
})
const earlyRepaymentAmount = ref(10_000)
const earlyRepaymentAfterYears = ref(5)
const usingModelData = computed(() => dataSource.value === 'model' && Boolean(props.modelData))

watch(dataSource, resetSimulationData, { immediate: true })
watch(
  () => props.modelData,
  () => {
    if (usingModelData.value) resetSimulationData()
  },
  { deep: true },
)

const mortgageExample = computed(() => {
  const principal = Number(exampleLoan.value)
  const annualInterestRate = Number(exampleRate.value)
  const termMonths = Number(exampleTermMonths.value)

  if (
    !Number.isFinite(principal) ||
    principal <= 0 ||
    !Number.isFinite(annualInterestRate) ||
    annualInterestRate < 0 ||
    annualInterestRate > 100 ||
    !Number.isInteger(termMonths) ||
    termMonths < 1 ||
    termMonths > 1_200
  ) {
    return null
  }

  try {
    const monthlyPayment = usingModelData.value
      ? Number(props.modelData.monthlyPayment)
      : calculateFrenchMortgageMonthlyPayment({ principal, annualInterestRate, termMonths })
    const schedule = buildFrenchMortgageScheduleFromBalance({
      currentBalance: principal,
      annualInterestRate,
      monthlyPayment,
      asOfDate: '2026-01-01',
    })

    return { monthlyPayment, schedule, termMonths }
  } catch {
    return null
  }
})

const formattedMonthlyPayment = computed(() =>
  mortgageExample.value ? formatMortgageMoney(mortgageExample.value.monthlyPayment) : '—',
)

const earlyRepaymentProjection = computed(() => {
  const principal = Number(exampleLoan.value)
  const annualInterestRate = Number(exampleRate.value)
  const termMonths = Number(exampleTermMonths.value)
  const repaymentAmount = Number(earlyRepaymentAmount.value)
  const repaymentAfterYears = Number(earlyRepaymentAfterYears.value)

  if (
    !Number.isFinite(principal) ||
    principal <= 0 ||
    !Number.isFinite(annualInterestRate) ||
    annualInterestRate < 0 ||
    annualInterestRate > 100 ||
    !Number.isInteger(termMonths) ||
    termMonths < 1 ||
    termMonths > 1_200 ||
    !Number.isFinite(repaymentAmount) ||
    repaymentAmount < 0 ||
    !Number.isInteger(repaymentAfterYears) ||
    repaymentAfterYears < 0 ||
    repaymentAfterYears * 12 >= termMonths
  ) {
    return null
  }

  try {
    return compareFrenchMortgageLumpSumScenarios({
      principal,
      annualInterestRate,
      termMonths,
      monthlyPayment: usingModelData.value ? Number(props.modelData.monthlyPayment) : undefined,
      repaymentAmount,
      repaymentAfterMonths: repaymentAfterYears * 12,
      asOfDate: '2026-01-01',
    })
  } catch {
    return null
  }
})

const formattedEarlyMonthlyPayment = computed(() =>
  earlyRepaymentProjection.value
    ? formatMortgageMoney(earlyRepaymentProjection.value.monthlyPayment)
    : '—',
)

const paymentSchedule = computed(() => {
  const example = mortgageExample.value
  if (!example?.schedule.length) return []

  const lastIndex = example.schedule.length - 1
  const checkpointIndexes = [
    0,
    Math.min(lastIndex, Math.max(0, Math.round(example.termMonths * 0.4) - 1)),
    Math.min(lastIndex, Math.max(0, Math.round(example.termMonths * 0.8) - 1)),
    lastIndex,
  ]

  return [...new Set(checkpointIndexes)].map((index, checkpointPosition, checkpoints) => {
    const payment = example.schedule[index]
    const isFirst = index === 0
    const isFinal = index === lastIndex
    const year = Math.max(1, Math.round(payment.paymentNumber / 12))

    return {
      ...payment,
      label:
        isFirst && !isFinal
          ? t(`${topicKey.value}.firstPayment`)
          : isFinal || checkpointPosition === checkpoints.length - 1
            ? t(`${topicKey.value}.finalPayment`)
            : t(`${topicKey.value}.yearLabel`, { year }),
      principalShare: payment.payment > 0 ? (payment.principal / payment.payment) * 100 : 0,
    }
  })
})

const mortgageMoneyFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatMortgageMoney(value) {
  return mortgageMoneyFormatter.format(Number(value) || 0)
}

function formatMortgageDuration(value) {
  const months = Math.max(0, Math.round(Number(value) || 0))
  const wholeYears = Math.floor(months / 12)
  const extraMonths = months % 12
  const parts = []
  if (wholeYears) {
    const unit = t(`${topicKey.value}.${wholeYears === 1 ? 'year' : 'years'}`)
    parts.push(`${wholeYears} ${unit}`)
  }
  if (extraMonths || parts.length === 0) {
    const unit = t(`${topicKey.value}.${extraMonths === 1 ? 'month' : 'months'}`)
    parts.push(`${extraMonths} ${unit}`)
  }
  return parts.join(' ')
}

const repaymentChecks = computed(() => [
  t(`${topicKey.value}.checkFees`),
  t(`${topicKey.value}.checkLiquidity`),
  t(`${topicKey.value}.checkAlternatives`),
])

function resetSimulationData() {
  if (dataSource.value === 'model' && props.modelData) {
    exampleLoan.value = Number(props.modelData.currentBalance) || 0
    exampleRate.value = Number(props.modelData.annualInterestRate) || 0
    exampleTermMonths.value = Math.max(1, Number(props.modelData.remainingTermMonths) || 1)
    earlyRepaymentAmount.value = Math.min(10_000, exampleLoan.value)
    earlyRepaymentAfterYears.value = 0
    return
  }

  dataSource.value = 'example'
  exampleLoan.value = 200_000
  exampleRate.value = 3
  exampleTermMonths.value = 25 * 12
  earlyRepaymentAmount.value = 10_000
  earlyRepaymentAfterYears.value = 5
}
</script>

<style scoped lang="scss">
.mortgage-lesson {
  --learn-lesson-section-gap: var(--space-6);
  --learn-lesson-title-gap: var(--space-2);

  color: var(--color-ink);
}

.mortgage-lesson__eyebrow {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-primary-dark);
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.mortgage-lesson h2 {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.85rem;
  line-height: 1.12;
  letter-spacing: -0.025em;
}

.mortgage-lesson__lead {
  margin: var(--space-3) 0 0;
  color: var(--color-copy);
  font-size: 1.02rem;
  line-height: var(--line-height-body);
}

.mortgage-flow {
  display: flex;
  height: 0.65rem;
  margin-top: var(--space-2);
  overflow: hidden;
  border-radius: 999px;
}

.mortgage-flow-titles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: var(--space-5);
  color: var(--color-ink-soft);
  font-size: 0.875rem;
}

.mortgage-flow-titles strong:last-child {
  text-align: right;
}

.mortgage-flow__interest,
.mortgage-flow__principal {
  display: block;
  width: 50%;
}

.mortgage-flow__interest {
  background: linear-gradient(90deg, var(--color-warning), var(--color-warning-soft));
}

.mortgage-flow__principal {
  background: linear-gradient(90deg, var(--color-blue-soft), var(--color-primary));
}

.mortgage-flow-labels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-2);
  color: var(--color-muted);
}

.mortgage-flow-labels small {
  font-size: 0.78rem;
  line-height: 1.35;
}

.mortgage-flow-labels small:last-child {
  text-align: right;
}

.example-card,
.split-card {
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.example-card__title {
  display: block;
  margin-bottom: var(--space-4);
  font-weight: var(--font-weight-semibold);
}

.example-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.example-metric {
  display: grid;
  gap: var(--space-1);
}

.example-metrics small,
.split-values small,
.option-card small {
  color: var(--color-muted);
}

.example-metric--result {
  align-content: end;
  min-height: 3.5rem;
  padding-bottom: var(--space-2);
}

.example-metrics strong {
  font-size: 1.15rem;
}

.example-metric :deep(.q-field__control) {
  min-height: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-button);
  background: var(--color-surface);
}

.example-metric :deep(.q-field__native),
.example-metric :deep(.q-field__prefix),
.example-metric :deep(.q-field__suffix) {
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.example-card__note,
.lesson-caption {
  color: var(--color-muted) !important;
  font-size: 0.8rem;
}

.example-card__note {
  margin-top: var(--space-4) !important;
}

.payment-schedule {
  display: grid;
  gap: var(--space-5);
  margin-top: var(--space-6);
}

.payment-row__header,
.payment-row__legend {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.payment-row__header span {
  color: var(--color-copy);
  font-variant-numeric: tabular-nums;
}

.payment-row__bar {
  display: flex;
  height: 0.6rem;
  margin: var(--space-2) 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-warning);
}

.payment-row__principal {
  flex: 0 0 auto;
  background: var(--color-primary);
}

.payment-row__interest {
  flex: 1;
}

.payment-row__legend {
  color: var(--color-muted);
}

.lesson-caption {
  margin-top: var(--space-4) !important;
}

.definition-grid,
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.definition-card,
.option-card {
  position: relative;
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.definition-card__icon,
.option-card__icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  margin-bottom: var(--space-3);
  place-items: center;
  border-radius: var(--radius-button);
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
}

.definition-card--interest .definition-card__icon {
  background: var(--color-warning-soft);
  color: var(--color-warning-dark);
}

.definition-card p,
.option-card p {
  margin-top: var(--space-2);
  font-size: 0.875rem;
}

.split-card__total {
  display: block;
  margin-bottom: var(--space-3);
  font-family: var(--font-family-display);
  font-size: 2rem;
}

.split-bar {
  display: flex;
  height: 0.85rem;
  overflow: hidden;
  border-radius: 999px;
}

.split-bar__principal {
  width: 47.3%;
  background: var(--color-primary);
}

.split-bar__interest {
  flex: 1;
  background: var(--color-warning);
}

.split-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.split-values > div {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0 var(--space-2);
}

.split-values__dot {
  grid-row: 1 / 4;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
}

.split-values__dot--principal {
  background: var(--color-primary);
}

.split-values__dot--interest {
  background: var(--color-warning);
}

.split-values span:last-child {
  color: var(--color-muted);
  font-size: 0.8rem;
}

.repayment-example__inputs {
  row-gap: var(--space-5);
}

.option-grid {
  margin-top: var(--space-4);
}

.option-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-5);
}

.option-card__title {
  color: var(--color-ink);
  font-size: 1.05rem;
  font-weight: var(--font-weight-bold);
  line-height: 1.25;
}

.option-card__value {
  margin-top: var(--space-2);
  font-family: var(--font-family-display);
  font-size: 1.55rem;
  line-height: 1.1;
}

.option-card p {
  margin: var(--space-3) 0 var(--space-4);
}

.option-card--featured {
  border-color: var(--color-primary-border);
  background: var(--color-blue-soft);
}

.option-card__badge {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  color: var(--color-primary-dark);
  font-size: 0.68rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.option-card__saving {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: auto;
  padding: var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-success) 18%, transparent);
  border-radius: var(--radius-button);
  background: var(--color-green-soft);
  color: var(--color-success-dark);
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
}

.option-card__saving .q-icon {
  flex: 0 0 auto;
  font-size: 1.2rem;
}

.check-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.check-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  color: var(--color-copy);
  line-height: 1.45;
}

.check-list .q-icon {
  margin-top: 0.15rem;
  color: var(--color-success);
}

.why-card {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-8);
  padding: var(--space-5);
  border-radius: var(--radius-md);
  background: var(--color-blue-soft);
}

.why-card__icon {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary-dark);
}

.why-card p {
  margin: var(--space-1) 0 0;
  color: var(--color-ink-soft);
  line-height: 1.5;
}

@media (max-width: 420px) {
  .definition-grid,
  .option-grid {
    grid-template-columns: 1fr;
  }
}
</style>
