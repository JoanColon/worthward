<template>
  <article class="cash-lesson">
    <span class="cash-lesson__eyebrow">The role of cash</span>
    <h2>Inflation &amp; Purchasing Power</h2>
    <p class="cash-lesson__lead">
      Understand why the amount of money you own is not the same as what that money can buy.
    </p>
    <LearnDataSourceToggle
      v-model="dataSource"
      :enabled="modelContext"
      :model-available="Boolean(modelData)"
    />

    <LearnLessonSection label="The silent cost of inflation">
      <p>
        Money does not need to disappear from your bank account for you to become poorer. When
        prices rise, the same amount buys less. This gradual loss of purchasing power is called
        inflation.
      </p>
      <div class="simulation-card">
        <div class="input-grid">
          <MoneyInput v-model="inflationCash" label="Initial cash" />
          <PercentInput v-model="inflationRate" label="Annual inflation" />
          <YearsInput v-model="inflationYears" label="Time horizon" />
        </div>
        <CashValueChart
          :points="inflationScenario.projection"
          aria-label="Nominal cash balance and inflation-adjusted purchasing power over time"
          nominal-label="Nominal cash"
          real-label="Purchasing power"
        />
        <div class="kpi-grid kpi-grid--three">
          <KpiValue
            label="Final cash balance"
            :value="formatCurrency(inflationScenario.finalNominalValue)"
          />
          <KpiValue
            label="Purchasing power today"
            :value="formatCurrency(inflationScenario.finalPurchasingPower)"
          />
          <KpiValue
            label="Purchasing power lost"
            :value="formatCurrency(Math.abs(inflationScenario.purchasingPowerChange))"
            :supporting="formatSignedPercent(inflationScenario.purchasingPowerChangePercent)"
            tone="negative"
          />
        </div>
        <p class="dynamic-explanation">
          After {{ inflationScenario.years }} years, you will still have
          <strong>{{ formatCurrency(inflationScenario.finalNominalValue) }}</strong> in your
          account. However, that money will only buy what approximately
          <strong>{{ formatCurrency(inflationScenario.finalPurchasingPower) }}</strong> buys today.
          You will have lost
          <strong>{{
            formatPercent(Math.abs(inflationScenario.purchasingPowerChangePercent))
          }}</strong>
          of your purchasing power.
        </p>
      </div>
    </LearnLessonSection>

    <LearnLessonSection label="Is your cash earning enough?">
      <p>
        Earning interest helps offset inflation. But if your savings grow more slowly than prices,
        your purchasing power still declines—even when your account balance increases.
      </p>
      <div class="simulation-card">
        <div class="input-grid input-grid--four">
          <MoneyInput v-model="earningCash" label="Initial cash" />
          <PercentInput v-model="interestRate" label="Cash remuneration" />
          <PercentInput v-model="earningInflationRate" label="Annual inflation" />
          <YearsInput v-model="earningYears" label="Time horizon" />
        </div>
        <CashValueChart
          :points="earningScenario.projection"
          aria-label="Nominal savings, purchasing power and initial value over time"
          nominal-label="Nominal balance"
          real-label="Purchasing power"
          reference-label="Initial value"
        />
        <div class="kpi-grid">
          <KpiValue
            label="Final cash balance"
            :value="formatCurrency(earningScenario.finalNominalValue)"
          />
          <KpiValue
            label="Final purchasing power"
            :value="formatCurrency(earningScenario.finalPurchasingPower)"
          />
          <KpiValue
            label="Real annual return"
            :value="formatSignedPercent(earningScenario.realAnnualReturn)"
            :tone="returnTone"
          />
          <KpiValue
            label="Purchasing power change"
            :value="formatSignedCurrency(earningScenario.purchasingPowerChange)"
            :supporting="formatSignedPercent(earningScenario.purchasingPowerChangePercent)"
            :tone="returnTone"
          />
        </div>
        <div class="feedback" :class="`feedback--${returnTone}`">
          <q-icon
            :name="
              returnTone === 'positive'
                ? 'trending_up'
                : returnTone === 'neutral'
                  ? 'drag_handle'
                  : 'trending_down'
            "
          />
          <span>{{ returnFeedback }}</span>
        </div>
        <p class="dynamic-explanation">
          After {{ earningScenario.years }} years, your savings will be worth
          <strong>{{ formatCurrency(earningScenario.finalNominalValue) }}</strong
          >, but their purchasing power will be
          <strong>{{ formatCurrency(earningScenario.finalPurchasingPower) }}</strong> in today's
          money.
        </p>
        <p class="simulation-note">
          Illustrative simulation. Taxes and fees are excluded and may further reduce real returns.
        </p>
      </div>
    </LearnLessonSection>

    <LearnLessonSection label="How much cash do you really need?">
      <p>
        Cash is your financial safety net. It covers everyday expenses and unexpected situations,
        and can prevent you from selling long-term assets at the wrong time. Its primary job is
        liquidity and resilience—not long-term wealth creation.
      </p>
      <ul class="factor-list">
        <li>Essential living expenses</li>
        <li>Income stability and job security</li>
        <li>Household responsibilities and dependants</li>
        <li>Alternative liquidity and expected short-term expenses</li>
        <li>Personal circumstances and risk tolerance</li>
      </ul>
      <div class="simulation-card">
        <div class="input-grid">
          <MoneyInput v-model="monthlyExpenses" label="Monthly essential expenses" />
          <MoneyInput v-model="availableCash" label="Current available cash" />
          <MoneyInput v-model="plannedExpenses" label="Planned short-term expenses" />
        </div>
        <div class="coverage-control">
          <div>
            <span>Months of emergency coverage</span>
            <strong>{{ coverageMonths }} months</strong>
          </div>
          <q-slider v-model="coverageMonths" :min="1" :max="24" :step="1" label label-always />
        </div>
        <div class="cash-breakdown" role="img" :aria-label="breakdownAria">
          <span
            v-if="breakdownWidths.emergency"
            class="cash-breakdown__emergency"
            :style="{ width: `${breakdownWidths.emergency}%` }"
          />
          <span
            v-if="breakdownWidths.planned"
            class="cash-breakdown__planned"
            :style="{ width: `${breakdownWidths.planned}%` }"
          />
          <span
            v-if="breakdownWidths.surplus"
            class="cash-breakdown__surplus"
            :style="{ width: `${breakdownWidths.surplus}%` }"
          />
          <span
            v-if="breakdownWidths.shortfall"
            class="cash-breakdown__shortfall"
            :style="{ width: `${breakdownWidths.shortfall}%` }"
          />
        </div>
        <div class="breakdown-legend">
          <span><i class="legend-dot legend-dot--emergency" />Emergency fund</span>
          <span><i class="legend-dot legend-dot--planned" />Planned expenses</span>
          <span><i class="legend-dot legend-dot--surplus" />Beyond identified needs</span>
          <span v-if="emergencyScenario.cashShortfall"
            ><i class="legend-dot legend-dot--shortfall" />Shortfall</span
          >
        </div>
        <div class="kpi-grid">
          <KpiValue
            label="Emergency fund target"
            :value="formatCurrency(emergencyScenario.emergencyFund)"
          />
          <KpiValue
            label="Total liquidity target"
            :value="formatCurrency(emergencyScenario.cashTarget)"
          />
          <KpiValue
            label="Emergency coverage"
            :value="`${formatNumber(emergencyScenario.emergencyCoverageMonths)} months`"
          />
          <KpiValue
            :label="
              emergencyScenario.cashShortfall ? 'Liquidity shortfall' : 'Potential surplus cash'
            "
            :value="
              formatCurrency(emergencyScenario.cashShortfall || emergencyScenario.surplusCash)
            "
            :tone="
              emergencyScenario.cashShortfall
                ? 'negative'
                : emergencyScenario.surplusCash
                  ? 'positive'
                  : 'neutral'
            "
          />
        </div>
        <div v-if="emergencyScenario.cashShortfall" class="feedback feedback--negative">
          <q-icon name="warning_amber" />
          <span
            >Your available cash is below the liquidity target in this scenario. Adjust the
            assumptions to explore a buffer that fits your circumstances.</span
          >
        </div>
        <p v-else-if="emergencyScenario.surplusCash" class="dynamic-explanation">
          Once your emergency fund and short-term needs are covered, consider whether the remaining
          cash could support longer-term goals. Holding unnecessary cash may reduce purchasing power
          over time; this does not mean every surplus must be invested.
        </p>
        <p class="simulation-note">
          There is no universally optimal emergency fund. Use this as a scenario, not a
          recommendation.
        </p>
      </div>
    </LearnLessonSection>

    <aside class="takeaway-card">
      <span class="takeaway-card__icon"><q-icon name="lightbulb" /></span>
      <div>
        <strong>Cash protects your present. Investing can help protect your future.</strong>
        <p>
          Keep enough cash for everyday needs, unexpected expenses and short-term commitments.
          Beyond those needs, consider the long-term cost of money that may not keep pace with
          inflation.
        </p>
      </div>
    </aside>
  </article>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from 'vue'
import { QInput } from 'quasar'
import CashValueChart from '@/components/learn/CashValueChart.vue'
import LearnDataSourceToggle from '@/components/learn/LearnDataSourceToggle.vue'
import LearnLessonSection from '@/components/learn/LearnLessonSection.vue'
import {
  emergencyFundScenario,
  purchasingPowerScenario,
  remuneratedCashScenario,
} from '../../../functions/shared/assets/cash.js'
import { currencySymbol, formatCurrency } from '@/utils/formatters'

const props = defineProps({
  modelContext: { type: Boolean, default: false },
  modelData: { type: Object, default: null },
})

const dataSource = ref('example')
const inflationCash = ref(20_000)
const inflationRate = ref(3)
const inflationYears = ref(20)
const earningCash = ref(20_000)
const interestRate = ref(1.5)
const earningInflationRate = ref(3)
const earningYears = ref(20)
const monthlyExpenses = ref(1_500)
const coverageMonths = ref(6)
const availableCash = ref(20_000)
const plannedExpenses = ref(0)

watch(dataSource, resetSimulationData, { immediate: true })
watch(
  () => props.modelData,
  () => {
    if (dataSource.value === 'model') resetSimulationData()
  },
  { deep: true },
)

const inflationScenario = computed(() =>
  purchasingPowerScenario({
    initialCash: normalizedNonNegative(inflationCash.value),
    inflationRate: normalizedRate(inflationRate.value),
    years: normalizedYears(inflationYears.value),
  }),
)
const earningScenario = computed(() =>
  remuneratedCashScenario({
    initialCash: normalizedNonNegative(earningCash.value),
    interestRate: normalizedRate(interestRate.value),
    inflationRate: normalizedRate(earningInflationRate.value),
    years: normalizedYears(earningYears.value),
  }),
)
const emergencyScenario = computed(() =>
  emergencyFundScenario({
    monthlyEssentialExpenses: normalizedNonNegative(monthlyExpenses.value),
    monthsOfCoverage: Math.min(24, Math.max(1, Math.round(Number(coverageMonths.value) || 1))),
    availableCash: normalizedNonNegative(availableCash.value),
    plannedShortTermExpenses: normalizedNonNegative(plannedExpenses.value),
  }),
)

const returnTone = computed(() => {
  if (Math.abs(earningScenario.value.realAnnualReturn) < 0.005) return 'neutral'
  return earningScenario.value.realAnnualReturn > 0 ? 'positive' : 'negative'
})
const returnFeedback = computed(() => {
  if (returnTone.value === 'neutral')
    return 'Your purchasing power is preserved before taxes and fees.'
  if (returnTone.value === 'positive')
    return 'Your cash is gaining purchasing power before taxes and fees.'
  return 'Your account balance is not keeping pace with prices, so purchasing power is declining.'
})
const breakdownWidths = computed(() => {
  const scenario = emergencyScenario.value
  const total = Math.max(scenario.availableCash, scenario.cashTarget, 1)
  return {
    emergency: (scenario.coveredEmergencyFund / total) * 100,
    planned: (scenario.coveredPlannedExpenses / total) * 100,
    surplus: (scenario.surplusCash / total) * 100,
    shortfall: (scenario.cashShortfall / total) * 100,
  }
})
const breakdownAria = computed(() => {
  const scenario = emergencyScenario.value
  return `Available cash ${formatCurrency(scenario.availableCash)}. Emergency fund target ${formatCurrency(scenario.emergencyFund)}. Planned expenses ${formatCurrency(scenario.plannedShortTermExpenses)}. ${scenario.cashShortfall ? `Liquidity shortfall ${formatCurrency(scenario.cashShortfall)}.` : `Potential surplus ${formatCurrency(scenario.surplusCash)}.`}`
})

const MoneyInput = inputComponent('number', () => currencySymbol.value, { min: 0, step: 500 })
const PercentInput = inputComponent('number', '%', { min: 0, max: 100, step: 0.1 }, 'suffix')
const YearsInput = inputComponent('number', 'years', { min: 0, max: 100, step: 1 }, 'suffix')
const KpiValue = defineComponent({
  props: { label: String, value: String, supporting: String, tone: { type: String, default: '' } },
  setup(props) {
    return () =>
      h('div', { class: ['kpi-value', props.tone && `kpi-value--${props.tone}`] }, [
        h('small', props.label),
        h('strong', props.value),
        props.supporting ? h('span', props.supporting) : null,
      ])
  },
})

function inputComponent(type, affix, attrs, affixPosition = 'prefix') {
  return defineComponent({
    props: { modelValue: [Number, String], label: String },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('label', { class: 'learn-input' }, [
          h('span', props.label),
          h(QInput, {
            modelValue: props.modelValue,
            'onUpdate:modelValue': (value) => emit('update:modelValue', value),
            outlined: true,
            dense: true,
            hideBottomSpace: true,
            type,
            inputmode: 'decimal',
            [affixPosition]: typeof affix === 'function' ? affix() : affix,
            ...attrs,
          }),
        ])
    },
  })
}

function normalizedNonNegative(value) {
  return Math.max(0, Number(value) || 0)
}

function normalizedRate(value) {
  return Math.min(100, Math.max(0, Number(value) || 0))
}

function normalizedYears(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)))
}

function formatPercent(value) {
  return `${Math.abs(Number(value) || 0).toFixed(1)}%`
}

function formatSignedPercent(value) {
  const number = Number(value) || 0
  return `${number > 0 ? '+' : number < 0 ? '−' : ''}${Math.abs(number).toFixed(2)}%`
}

function formatSignedCurrency(value) {
  const number = Number(value) || 0
  return `${number > 0 ? '+' : number < 0 ? '−' : ''}${formatCurrency(Math.abs(number))}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 }).format(value)
}

function resetSimulationData() {
  if (dataSource.value === 'model' && props.modelData) {
    const balance = normalizedNonNegative(props.modelData.currentBalance)
    inflationCash.value = balance
    earningCash.value = balance
    availableCash.value = balance
    interestRate.value = normalizedRate(props.modelData.annualReturnPercent)
    inflationRate.value = 3
    earningInflationRate.value = 3
    inflationYears.value = 20
    earningYears.value = 20
    monthlyExpenses.value = 1_500
    coverageMonths.value = 6
    plannedExpenses.value = 0
    return
  }

  dataSource.value = 'example'
  inflationCash.value = 20_000
  inflationRate.value = 3
  inflationYears.value = 20
  earningCash.value = 20_000
  interestRate.value = 1.5
  earningInflationRate.value = 3
  earningYears.value = 20
  monthlyExpenses.value = 1_500
  coverageMonths.value = 6
  availableCash.value = 20_000
  plannedExpenses.value = 0
}
</script>

<style scoped lang="scss">
.cash-lesson {
  --learn-lesson-section-gap: var(--space-8);
  color: var(--color-ink);
}

.cash-lesson__eyebrow {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-primary-dark);
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.cash-lesson h2 {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.85rem;
  line-height: 1.12;
  letter-spacing: -0.025em;
}

.cash-lesson__lead {
  margin: var(--space-3) 0 0;
  color: var(--color-copy);
  font-size: 1.02rem;
  line-height: var(--line-height-body);
}

.simulation-card {
  margin-top: var(--space-5);
  padding: var(--space-5);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.input-grid,
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.input-grid {
  margin-bottom: var(--space-5);
}

.input-grid--four {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

:deep(.learn-input) {
  display: grid;
  min-width: 0;
  gap: var(--space-1);
}

:deep(.learn-input > span) {
  color: var(--color-muted);
  font-size: 0.78rem;
}

:deep(.learn-input .q-field__control) {
  min-height: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-button);
  background: var(--color-surface);
}

:deep(.learn-input .q-field__native),
:deep(.learn-input .q-field__prefix),
:deep(.learn-input .q-field__suffix) {
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.kpi-grid {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
}

.kpi-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

:deep(.kpi-value) {
  display: grid;
  min-width: 0;
  gap: 0.15rem;
}

:deep(.kpi-value small) {
  color: var(--color-muted);
  font-size: 0.75rem;
  line-height: 1.3;
}

:deep(.kpi-value strong) {
  overflow-wrap: anywhere;
  color: var(--color-ink);
  font-size: 1.08rem;
  font-variant-numeric: tabular-nums;
}

:deep(.kpi-value span) {
  color: var(--color-muted);
  font-size: 0.78rem;
}

:deep(.kpi-value--positive strong),
:deep(.kpi-value--positive span) {
  color: var(--color-success-dark);
}
:deep(.kpi-value--negative strong),
:deep(.kpi-value--negative span) {
  color: var(--color-danger-dark);
}

.dynamic-explanation,
.simulation-note {
  color: var(--color-copy) !important;
}

.dynamic-explanation {
  margin-top: var(--space-5) !important;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
  font-size: 0.9rem;
}

.simulation-note {
  margin-top: var(--space-3) !important;
  font-size: 0.78rem;
}

.feedback {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-top: var(--space-5);
  padding: var(--space-3);
  border-radius: var(--radius-button);
  font-size: 0.86rem;
  line-height: 1.4;
}

.feedback .q-icon {
  margin-top: 0.05rem;
  font-size: 1.1rem;
}
.feedback--positive {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.feedback--neutral {
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
}
.feedback--negative {
  background: var(--color-red-soft);
  color: var(--color-danger-dark);
}

.factor-list {
  display: grid;
  gap: var(--space-1);
  margin: var(--space-4) 0 0;
  padding-left: var(--space-5);
  color: var(--color-copy);
  font-size: 0.88rem;
}

.coverage-control {
  margin: var(--space-2) 0 var(--space-6);
  padding-top: var(--space-2);
}

.coverage-control > div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  font-size: 0.84rem;
}

.coverage-control span {
  color: var(--color-muted);
}

.cash-breakdown {
  display: flex;
  width: 100%;
  height: 1.1rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}

.cash-breakdown > span {
  display: block;
  min-width: 0;
}
.cash-breakdown__emergency {
  background: var(--color-primary);
}
.cash-breakdown__planned {
  background: var(--color-warning);
}
.cash-breakdown__surplus {
  background: var(--color-success);
}
.cash-breakdown__shortfall {
  background: repeating-linear-gradient(
    135deg,
    var(--color-red-soft) 0 6px,
    var(--color-danger) 6px 10px
  );
}

.breakdown-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin-top: var(--space-3);
  color: var(--color-muted);
  font-size: 0.72rem;
}

.breakdown-legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.legend-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}
.legend-dot--emergency {
  background: var(--color-primary);
}
.legend-dot--planned {
  background: var(--color-warning);
}
.legend-dot--surplus {
  background: var(--color-success);
}
.legend-dot--shortfall {
  background: var(--color-danger);
}

.takeaway-card {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-8);
  padding: var(--space-5);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  background: var(--color-blue-soft);
}

.takeaway-card__icon {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary-dark);
}

.takeaway-card strong {
  color: var(--color-primary-dark);
}
.takeaway-card p {
  margin: var(--space-2) 0 0;
  color: var(--color-copy);
  font-size: 0.88rem;
  line-height: var(--line-height-body);
}

@media (max-width: 599px) {
  .simulation-card {
    padding: var(--space-4);
  }
  .input-grid,
  .input-grid--four,
  .kpi-grid,
  .kpi-grid--three {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .cash-lesson h2 {
    font-size: 1.65rem;
  }
}
</style>
