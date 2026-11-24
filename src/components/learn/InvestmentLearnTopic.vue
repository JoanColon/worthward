<template>
  <article class="investment-lesson">
    <span class="lesson-eyebrow">Investment fundamentals</span>
    <h2>Understanding Bonds &amp; Stocks</h2>
    <p class="lesson-lead">
      Understand how different investments generate returns, compound and behave under uncertainty.
    </p>

    <LearnLessonSection label="Lending money vs. owning a business">
      <div class="relationship-grid">
        <div class="relationship relationship--bond">
          <span class="relationship__icon"><q-icon name="handshake" /></span>
          <small>Bonds</small><strong>Become a lender</strong>
          <p>
            You exchange money for contractual coupons and repayment at maturity, subject to the
            issuer meeting its obligations.
          </p>
          <ul>
            <li>Fixed coupons</li>
            <li>Predefined maturity</li>
            <li>No business ownership</li>
          </ul>
        </div>
        <div class="relationship relationship--stock">
          <span class="relationship__icon"><q-icon name="domain" /></span>
          <small>Stocks</small><strong>Become an owner</strong>
          <p>
            You acquire a stake in a company and participate in its future economic performance.
          </p>
          <ul>
            <li>Potential dividends</li>
            <li>Potential price growth or loss</li>
            <li>No maturity or guaranteed repayment</li>
          </ul>
        </div>
      </div>
      <p class="key-line">
        <strong
          >A bond gives you a contractual claim on future payments. A share gives you an ownership
          stake in the future of a business.</strong
        >
      </p>
    </LearnLessonSection>

    <LearnLessonSection label="Where does your return come from?">
      <p>
        Use the same starting amount to compare contractual bond cash flows with stock price changes
        and dividends.
      </p>
      <div class="simulation-card">
        <div class="card-heading">
          <strong>Return comparison</strong
          ><q-btn flat dense no-caps icon="restart_alt" label="Reset" @click="resetComparison" />
        </div>
        <div class="input-grid">
          <LearnInput
            v-model="initialInvestment"
            label="Initial investment"
            prefix="€"
            :min="0"
            :step="500"
          />
          <LearnInput
            v-model="horizon"
            label="Investment horizon"
            suffix="years"
            :min="1"
            :max="100"
            :step="1"
          />
        </div>
        <div class="asset-inputs">
          <div>
            <span class="asset-label asset-label--bond">Bond assumptions</span>
            <LearnInput
              v-model="couponRate"
              label="Annual coupon rate"
              suffix="%"
              :min="0"
              :max="100"
              :step="0.1"
            />
            <q-toggle v-model="reinvestCoupons" label="Reinvest coupons" color="purple" />
            <LearnInput
              v-if="reinvestCoupons"
              v-model="couponReinvestmentRate"
              label="Coupon reinvestment rate"
              suffix="%"
              :min="0"
              :max="100"
              :step="0.1"
            />
          </div>
          <div>
            <span class="asset-label asset-label--stock">Stock assumptions</span>
            <LearnInput
              v-model="shareGrowth"
              label="Annual share price growth"
              suffix="%"
              :min="-99"
              :max="100"
              :step="0.1"
            />
            <LearnInput
              v-model="dividendYield"
              label="Annual dividend yield"
              suffix="%"
              :min="0"
              :max="100"
              :step="0.1"
            />
            <q-toggle v-model="reinvestDividends" label="Reinvest dividends" color="primary" />
          </div>
        </div>
        <q-btn
          outline
          no-caps
          icon="science"
          label="Same return, different mechanics"
          class="preset-button"
          @click="applySameReturnPreset"
        />
        <InvestmentLearnChart
          :series="comparisonSeries"
          aria-label="Accumulated value of the bond and stock examples over time"
        />
        <div v-if="sameReturnMessage" class="feedback">
          <q-icon name="sync_alt" /><span>{{ sameReturnMessage }}</span>
        </div>
        <div class="result-grid">
          <InvestmentResult title="Fixed-coupon bond" tone="bond" :result="bondResult" />
          <InvestmentResult title="Company shares" tone="stock" :result="stockResult" />
        </div>
        <div class="composition-grid">
          <CompositionBreakdown
            title="Bond final value"
            :items="bondComposition"
            :total="comparison.bond.finalValue"
          />
          <CompositionBreakdown
            title="Stock final value"
            :items="stockComposition"
            :total="comparison.stock.finalValue"
          />
        </div>
        <p class="note">
          Accumulated value includes distributed income retained by the investor; it is not
          necessarily the market value of the original holding. Taxes, fees and inflation are
          excluded.
        </p>
      </div>
      <q-expansion-item
        dense
        expand-separator
        icon="autorenew"
        label="How compounding works"
        class="explanation-expansion"
      >
        <div class="expansion-content">
          <strong>Compounding is not about what you own, but what happens to your returns.</strong>
          <p>
            Bond coupons can compound when reinvested externally. Stocks may compound internally
            when a company productively reinvests profits, and externally when dividends are
            reinvested.
          </p>
          <div class="mechanism-grid">
            <span
              ><small>Fixed-coupon bonds</small><strong>External</strong> Reinvesting coupons</span
            ><span
              ><small>Stocks</small><strong>Internal + external</strong> Business reinvestment and
              reinvested dividends</span
            >
          </div>
          <p class="note">
            Companies may also distribute profits, repurchase shares or reduce debt. Retained
            earnings can create or destroy shareholder value.
          </p>
        </div>
      </q-expansion-item>
    </LearnLessonSection>

    <LearnLessonSection label="Fixed income does not mean fixed value">
      <p>
        A fixed coupon defines contractual payments, not today's selling price. When comparable
        market yields change, the present value of those payments changes too.
      </p>
      <div class="simulation-card">
        <div class="card-heading">
          <strong>Bond price explorer</strong
          ><q-btn flat dense no-caps icon="restart_alt" label="Reset" @click="resetBondPricing" />
        </div>
        <div class="input-grid input-grid--four">
          <LearnInput v-model="faceValue" label="Face value" prefix="€" :min="0" :step="500" />
          <LearnInput
            v-model="pricingCoupon"
            label="Annual coupon rate"
            suffix="%"
            :min="0"
            :max="100"
            :step="0.1"
          />
          <LearnInput
            v-model="marketYield"
            label="Market yield"
            suffix="%"
            :min="0"
            :max="100"
            :step="0.1"
          />
          <LearnInput
            v-model="remainingYears"
            label="Years to maturity"
            suffix="years"
            :min="1"
            :max="100"
            :step="1"
          />
        </div>
        <div class="price-comparison">
          <PriceBar
            label="Face value"
            :value="bondPrice.faceValue"
            :maximum="priceBarMaximum"
            tone="face"
          />
          <PriceBar
            label="Theoretical market value"
            :value="bondPrice.marketPrice"
            :maximum="priceBarMaximum"
            tone="market"
          />
        </div>
        <div class="kpi-grid">
          <KpiValue label="Annual coupon" :value="formatCurrency(bondPrice.annualCoupon)" />
          <KpiValue
            label="Price difference"
            :value="signedCurrency(bondPrice.priceDifference)"
            :supporting="signedPercent(bondPrice.priceDifferencePercent)"
            :tone="bondPriceTone"
          />
          <KpiValue label="Current yield" :value="percent(bondPrice.currentYield)" />
          <KpiValue label="Yield to maturity" :value="percent(bondPrice.yieldToMaturity)" />
        </div>
        <div class="feedback" :class="`feedback--${bondPriceTone}`">
          <q-icon name="swap_vert" /><span>{{ bondPriceFeedback }}</span>
        </div>
        <InvestmentLearnChart
          :series="yieldCurveSeries"
          x-key="yield"
          x-suffix="%"
          :highlight="yieldHighlight"
          aria-label="Inverse relationship between market yield and theoretical bond price"
        />
        <p class="note">
          Annual coupons, unchanged credit risk and valuation on a coupon payment date are assumed.
          The selected market yield is the simplified YTM.
        </p>
      </div>
      <q-expansion-item
        dense
        expand-separator
        icon="percent"
        label="Coupon rate, current yield and YTM"
        class="explanation-expansion"
      >
        <div class="expansion-content definition-list">
          <p><strong>Coupon rate</strong> — annual contractual coupon divided by face value.</p>
          <p><strong>Current yield</strong> — annual coupon divided by current market price.</p>
          <p>
            <strong>Yield to maturity</strong> — the annualized return implied by price and
            scheduled cash flows, assuming payments occur. Realizing an equivalent terminal return
            also depends on coupon reinvestment rates.
          </p>
        </div>
      </q-expansion-item>
      <p class="key-line">
        <strong>The coupon is fixed. The market price is not.</strong> Holding to maturity can avoid
        realizing interim price movements, but not credit, inflation, reinvestment or opportunity
        risk.
      </p>
    </LearnLessonSection>

    <LearnLessonSection label="Predictability vs. growth potential">
      <p>
        Contractual cash flows can be more predictable, while company outcomes span a wider range.
        These paths are illustrations—not forecasts or probabilities.
      </p>
      <div class="simulation-card">
        <div class="card-heading">
          <strong>Illustrative paths</strong
          ><q-btn flat dense no-caps icon="restart_alt" label="Reset" @click="resetScenarios" />
        </div>
        <div class="input-grid">
          <LearnInput
            v-model="scenarioInitial"
            label="Initial investment"
            prefix="€"
            :min="0"
            :step="500"
          />
          <LearnInput
            v-model="scenarioYears"
            label="Investment horizon"
            suffix="years"
            :min="1"
            :max="50"
            :step="1"
          />
          <LearnInput
            v-model="scenarioCoupon"
            label="Bond coupon"
            suffix="%"
            :min="0"
            :max="100"
            :step="0.1"
          />
          <LearnInput
            v-model="scenarioVolatility"
            label="Equity volatility"
            suffix="%"
            :min="0"
            :max="100"
            :step="1"
          />
          <LearnInput
            v-model="favourableGrowth"
            label="Favourable equity CAGR"
            suffix="%"
            :min="-99"
            :max="100"
            :step="0.1"
          />
          <LearnInput
            v-model="moderateGrowth"
            label="Moderate equity CAGR"
            suffix="%"
            :min="-99"
            :max="100"
            :step="0.1"
          />
          <LearnInput
            v-model="unfavourableGrowth"
            label="Unfavourable equity CAGR"
            suffix="%"
            :min="-99"
            :max="100"
            :step="0.1"
          />
        </div>
        <InvestmentLearnChart
          :series="scenarioSeries"
          aria-label="Contractual accumulated bond value and three hypothetical equity paths"
        />
        <p class="note">
          The bond line is accumulated contractual value—principal plus coupons held as
          cash—assuming no default. It is not market value and does not make the bond risk-free.
        </p>
      </div>
      <div class="risk-grid">
        <div>
          <span class="asset-label asset-label--bond">Bond risks</span>
          <ul>
            <li>Credit and default</li>
            <li>Interest rates</li>
            <li>Inflation</li>
            <li>Reinvestment</li>
            <li>Liquidity</li>
          </ul>
        </div>
        <div>
          <span class="asset-label asset-label--stock">Stock risks</span>
          <ul>
            <li>Business performance</li>
            <li>Valuation</li>
            <li>Market volatility</li>
            <li>Dividend cuts</li>
            <li>Permanent capital loss</li>
          </ul>
        </div>
      </div>
      <p class="priority-note">
        Bondholders generally rank ahead of shareholders in insolvency, but payment priority does
        not guarantee full recovery.
      </p>
      <div
        class="comparison-table"
        role="table"
        aria-label="Fixed-coupon bonds and stocks compared"
      >
        <div class="comparison-row comparison-row--header">
          <span></span><strong>Bonds</strong><strong>Stocks</strong>
        </div>
        <div v-for="row in finalComparison" :key="row.label" class="comparison-row">
          <span>{{ row.label }}</span
          ><span>{{ row.bond }}</span
          ><span>{{ row.stock }}</span>
        </div>
      </div>
    </LearnLessonSection>

    <aside class="final-takeaway">
      <strong>Different assets, different purposes</strong>
      <div class="role-grid">
        <span
          ><q-icon name="account_balance_wallet" /><strong>Cash — Liquidity</strong
          ><small>Immediate needs, emergencies and short-term commitments.</small></span
        ><span
          ><q-icon name="receipt_long" /><strong>Bonds — Predictability</strong
          ><small>Contractual income and repayment schedules with meaningful risks.</small></span
        ><span
          ><q-icon name="trending_up" /><strong>Stocks — Growth</strong
          ><small>Participation in business performance with greater uncertainty.</small></span
        >
      </div>
      <p>
        Different investments serve different purposes. Understanding how they generate returns and
        what risks they carry is the first step towards making better financial decisions.
      </p>
    </aside>
  </article>
</template>

<script setup>
import { computed, defineComponent, h, ref } from 'vue'
import { QInput } from 'quasar'
import InvestmentLearnChart from '@/components/learn/InvestmentLearnChart.vue'
import LearnLessonSection from '@/components/learn/LearnLessonSection.vue'
import {
  bondYieldCurve,
  buildRiskScenarioPaths,
  compareBondAndStock,
  priceFixedCouponBond,
} from '../../../functions/shared/assets/securities.js'
import { formatCurrency } from '@/utils/formatters'

const initialInvestment = ref(10_000),
  horizon = ref(20),
  couponRate = ref(4),
  reinvestCoupons = ref(false),
  couponReinvestmentRate = ref(4),
  shareGrowth = ref(5),
  dividendYield = ref(3),
  reinvestDividends = ref(false)
const faceValue = ref(10_000),
  pricingCoupon = ref(4),
  marketYield = ref(6),
  remainingYears = ref(10)
const scenarioInitial = ref(10_000),
  scenarioYears = ref(10),
  scenarioCoupon = ref(4),
  favourableGrowth = ref(10.8),
  moderateGrowth = ref(6),
  unfavourableGrowth = ref(-3.5),
  scenarioVolatility = ref(18)
const bondColor = '#8754ed',
  stockColor = '#0870d8'

const comparison = computed(() =>
  compareBondAndStock({
    initialInvestment: money(initialInvestment.value),
    years: years(horizon.value, 100),
    couponRate: positiveRate(couponRate.value),
    reinvestCoupons: reinvestCoupons.value,
    couponReinvestmentRate: positiveRate(couponReinvestmentRate.value),
    sharePriceGrowth: flexibleRate(shareGrowth.value),
    dividendYield: positiveRate(dividendYield.value),
    reinvestDividends: reinvestDividends.value,
  }),
)
const comparisonSeries = computed(() => [
  { name: 'Fixed-coupon bond', color: bondColor, points: comparison.value.bond.projection },
  { name: 'Company shares', color: stockColor, points: comparison.value.stock.projection },
])
const bondResult = computed(() => resultView(comparison.value.bond))
const stockResult = computed(() => resultView(comparison.value.stock))
const bondComposition = computed(() => [
  { label: 'Original face value', value: comparison.value.bond.faceValue, color: bondColor },
  {
    label: 'Contractual coupons',
    value: comparison.value.bond.contractualCoupons,
    color: '#b399ef',
  },
  {
    label: 'Coupon reinvestment return',
    value: comparison.value.bond.reinvestmentReturn,
    color: '#dfd4fa',
  },
])
const stockComposition = computed(() => [
  { label: 'Original investment', value: money(initialInvestment.value), color: stockColor },
  {
    label: 'Capital gain or loss',
    value: comparison.value.stock.capitalGain,
    color: comparison.value.stock.capitalGain < 0 ? '#c44750' : '#65a9ea',
  },
  {
    label: 'Dividends received',
    value: comparison.value.stock.dividendsReceived,
    color: '#36cdb0',
  },
  {
    label: 'Dividend reinvestment return',
    value: comparison.value.stock.reinvestmentReturn,
    color: '#a9e8dc',
  },
])
const sameReturnMessage = computed(() =>
  Number(couponRate.value) === 5 &&
  Number(couponReinvestmentRate.value) === 5 &&
  Number(shareGrowth.value) === 5 &&
  Number(dividendYield.value) === 0
    ? reinvestCoupons.value
      ? 'Same return. Same compounding effect. With coupons reinvested at the same rate, both examples reach the same final value.'
      : 'The stock compounds internally in this illustration. Enable coupon reinvestment to see the bond curve converge.'
    : '',
)

const bondPrice = computed(() =>
  priceFixedCouponBond({
    faceValue: money(faceValue.value),
    couponRate: positiveRate(pricingCoupon.value),
    marketYield: positiveRate(marketYield.value),
    years: years(remainingYears.value, 100),
  }),
)
const priceBarMaximum = computed(() =>
  Math.max(bondPrice.value.faceValue, bondPrice.value.marketPrice, 1),
)
const bondPriceTone = computed(() =>
  Math.abs(bondPrice.value.priceDifferencePercent) < 0.01
    ? 'neutral'
    : bondPrice.value.priceDifference > 0
      ? 'positive'
      : 'negative',
)
const bondPriceFeedback = computed(() =>
  bondPriceTone.value === 'neutral'
    ? 'The bond trades at face value in this simplified scenario.'
    : bondPriceTone.value === 'positive'
      ? 'The existing coupon is higher than the selected market yield, so the theoretical price rises.'
      : 'Comparable new bonds offer a higher yield, so the existing bond becomes less attractive and its theoretical price falls.',
)
const yieldCurve = computed(() =>
  bondYieldCurve({
    faceValue: money(faceValue.value),
    couponRate: positiveRate(pricingCoupon.value),
    years: years(remainingYears.value, 100),
    maximumYield: Math.max(12, positiveRate(marketYield.value) * 1.5),
  }),
)
const yieldCurveSeries = computed(() => [
  { name: 'Theoretical price', color: bondColor, points: yieldCurve.value },
])
const yieldHighlight = computed(() => ({
  name: 'Selected yield',
  x: positiveRate(marketYield.value),
  value: bondPrice.value.marketPrice,
  color: '#e58b43',
}))

const scenarioPaths = computed(() =>
  buildRiskScenarioPaths({
    initialInvestment: money(scenarioInitial.value),
    years: years(scenarioYears.value, 50),
    couponRate: positiveRate(scenarioCoupon.value),
    favourableGrowth: flexibleRate(favourableGrowth.value),
    moderateGrowth: flexibleRate(moderateGrowth.value),
    unfavourableGrowth: flexibleRate(unfavourableGrowth.value),
    volatility: positiveRate(scenarioVolatility.value),
  }),
)
const scenarioSeries = computed(() => [
  { name: 'Bond contractual value', color: bondColor, points: scenarioPaths.value.bond },
  { name: 'Equity — favourable', color: '#39a8a3', points: scenarioPaths.value.favourable },
  { name: 'Equity — moderate', color: stockColor, points: scenarioPaths.value.moderate },
  { name: 'Equity — unfavourable', color: '#e58b43', points: scenarioPaths.value.unfavourable },
])

const finalComparison = [
  { label: 'Relationship', bond: 'Lender', stock: 'Owner' },
  { label: 'Income', bond: 'Contractual coupons', stock: 'Discretionary dividends' },
  { label: 'Maturity', bond: 'Usually predefined', stock: 'None' },
  { label: 'Capital repayment', bond: 'Contractual; default risk', stock: 'Not guaranteed' },
  { label: 'Growth potential', bond: 'Limited by cash flows', stock: 'Potentially unlimited' },
  { label: 'Predictability', bond: 'Generally higher', stock: 'Generally lower' },
  { label: 'Market fluctuations', bond: 'Yes', stock: 'Yes' },
  { label: 'Compounding', bond: 'Coupon reinvestment', stock: 'Internal + external' },
]

const LearnInput = defineComponent({
  props: {
    modelValue: [Number, String],
    label: String,
    prefix: String,
    suffix: String,
    min: Number,
    max: Number,
    step: Number,
  },
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
          type: 'number',
          inputmode: 'decimal',
          prefix: props.prefix,
          suffix: props.suffix,
          min: props.min,
          max: props.max,
          step: props.step,
        }),
      ])
  },
})
const KpiValue = defineComponent({
  props: { label: String, value: String, supporting: String, tone: String },
  setup: (props) => () =>
    h('div', { class: ['kpi', props.tone && `kpi--${props.tone}`] }, [
      h('small', props.label),
      h('strong', props.value),
      props.supporting ? h('span', props.supporting) : null,
    ]),
})
const InvestmentResult = defineComponent({
  props: { title: String, tone: String, result: Object },
  setup: (props) => () =>
    h('div', { class: ['investment-result', `investment-result--${props.tone}`] }, [
      h('small', props.title),
      h('strong', props.result.final),
      h('dl', [
        h('div', [h('dt', 'Income'), h('dd', props.result.income)]),
        h('div', [h('dt', 'Capital gain/loss'), h('dd', props.result.capital)]),
        h('div', [h('dt', 'Cumulative return'), h('dd', props.result.cumulative)]),
        h('div', [h('dt', 'Annualized growth'), h('dd', props.result.annualized)]),
      ]),
    ]),
})
const CompositionBreakdown = defineComponent({
  props: { title: String, items: Array, total: Number },
  setup: (props) => () =>
    h('div', { class: 'composition' }, [
      h('strong', props.title),
      h(
        'div',
        { class: 'composition__bar' },
        props.items
          .filter((item) => item.value > 0)
          .map((item) =>
            h('span', {
              style: {
                width: `${(item.value / Math.max(props.total, 1)) * 100}%`,
                background: item.color,
              },
            }),
          ),
      ),
      props.items.map((item) =>
        h('div', { class: ['composition__row', item.value < 0 && 'composition__row--loss'] }, [
          h('i', { style: { background: item.color } }),
          h('span', item.label),
          h('strong', signedCurrency(item.value)),
        ]),
      ),
    ]),
})
const PriceBar = defineComponent({
  props: { label: String, value: Number, maximum: Number, tone: String },
  setup: (props) => () =>
    h('div', { class: 'price-bar' }, [
      h('div', [h('span', props.label), h('strong', formatCurrency(props.value))]),
      h('i', [
        h('span', {
          class: `price-bar__fill price-bar__fill--${props.tone}`,
          style: { width: `${(props.value / props.maximum) * 100}%` },
        }),
      ]),
    ]),
})

function resultView(result) {
  return {
    final: formatCurrency(result.finalValue),
    income: formatCurrency(result.totalIncome ?? result.dividendsReceived),
    capital: signedCurrency(result.capitalGain),
    cumulative: signedPercent(result.cumulativeReturn),
    annualized: `${signedPercent(result.annualizedReturn)} / year`,
  }
}
function resetComparison() {
  initialInvestment.value = 10_000
  horizon.value = 20
  couponRate.value = 4
  reinvestCoupons.value = false
  couponReinvestmentRate.value = 4
  shareGrowth.value = 5
  dividendYield.value = 3
  reinvestDividends.value = false
}
function applySameReturnPreset() {
  initialInvestment.value = 10_000
  horizon.value = 20
  couponRate.value = 5
  couponReinvestmentRate.value = 5
  shareGrowth.value = 5
  dividendYield.value = 0
  reinvestCoupons.value = false
  reinvestDividends.value = false
}
function resetBondPricing() {
  faceValue.value = 10_000
  pricingCoupon.value = 4
  marketYield.value = 6
  remainingYears.value = 10
}
function resetScenarios() {
  scenarioInitial.value = 10_000
  scenarioYears.value = 10
  scenarioCoupon.value = 4
  favourableGrowth.value = 10.8
  moderateGrowth.value = 6
  unfavourableGrowth.value = -3.5
  scenarioVolatility.value = 18
}
function money(value) {
  return Math.max(0, Number(value) || 0)
}
function years(value, maximum) {
  return Math.min(maximum, Math.max(1, Math.round(Number(value) || 1)))
}
function positiveRate(value) {
  return Math.min(100, Math.max(0, Number(value) || 0))
}
function flexibleRate(value) {
  return Math.min(100, Math.max(-99, Number(value) || 0))
}
function percent(value) {
  return `${(Number(value) || 0).toFixed(2)}%`
}
function signedPercent(value) {
  const number = Number(value) || 0
  return `${number > 0 ? '+' : number < 0 ? '−' : ''}${Math.abs(number).toFixed(1)}%`
}
function signedCurrency(value) {
  const number = Number(value) || 0
  return `${number > 0 ? '+' : number < 0 ? '−' : ''}${formatCurrency(Math.abs(number))}`
}
</script>

<style scoped lang="scss">
.investment-lesson {
  --learn-lesson-section-gap: var(--space-8);
  color: var(--color-ink);
}
.lesson-eyebrow {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-primary-dark);
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
h2 {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.85rem;
  line-height: 1.12;
}
.lesson-lead {
  margin: var(--space-3) 0 0;
  color: var(--color-copy);
  line-height: var(--line-height-body);
}
.relationship-grid,
.result-grid,
.composition-grid,
.risk-grid,
.role-grid,
.asset-inputs,
.mechanism-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.relationship {
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
}
.relationship--bond {
  background: var(--color-purple-soft);
}
.relationship--stock {
  background: var(--color-blue-soft);
}
.relationship__icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  margin-bottom: var(--space-3);
  border-radius: 50%;
  background: var(--color-surface);
}
.relationship small,
.asset-label {
  display: block;
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.relationship p,
.relationship li {
  color: var(--color-copy);
  font-size: 0.82rem;
  line-height: 1.4;
}
.relationship p {
  margin: var(--space-2) 0;
}
.relationship ul {
  margin: 0;
  padding-left: var(--space-4);
}
.key-line {
  margin-top: var(--space-5) !important;
  padding: var(--space-4);
  border-left: 3px solid var(--color-primary);
  background: var(--color-blue-soft);
  color: var(--color-ink) !important;
}
.simulation-card {
  margin-top: var(--space-5);
  padding: var(--space-5);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.input-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.input-grid--four {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.asset-inputs > div {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.asset-label--bond {
  color: var(--color-purple);
}
.asset-label--stock {
  color: var(--color-primary);
}
:deep(.learn-input) {
  display: grid;
  min-width: 0;
  gap: var(--space-1);
}
:deep(.learn-input > span) {
  color: var(--color-muted);
  font-size: 0.75rem;
}
:deep(.learn-input .q-field__control) {
  min-height: 2.7rem;
  height: 2.7rem;
  border-radius: var(--radius-button);
  background: var(--color-surface);
}
:deep(.learn-input .q-field__native),
:deep(.learn-input .q-field__prefix),
:deep(.learn-input .q-field__suffix) {
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}
.preset-button {
  margin: var(--space-4) 0;
  color: var(--color-primary-dark);
}
.feedback {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  margin: var(--space-4) 0;
  padding: var(--space-3);
  border-radius: var(--radius-button);
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
  font-size: 0.84rem;
  line-height: 1.4;
}
.feedback--positive {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.feedback--negative {
  background: var(--color-red-soft);
  color: var(--color-danger-dark);
}
:deep(.investment-result) {
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
:deep(.investment-result--bond) {
  background: var(--color-purple-soft);
}
:deep(.investment-result--stock) {
  background: var(--color-blue-soft);
}
:deep(.investment-result > small) {
  color: var(--color-muted);
}
:deep(.investment-result > strong) {
  display: block;
  margin: var(--space-1) 0 var(--space-3);
  font-size: 1.3rem;
}
:deep(.investment-result dl) {
  display: grid;
  gap: var(--space-1);
  margin: 0;
}
:deep(.investment-result dl div) {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: 0.75rem;
}
:deep(.investment-result dt) {
  color: var(--color-muted);
}
:deep(.investment-result dd) {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  text-align: right;
}
.composition-grid {
  margin-top: var(--space-4);
}
:deep(.composition) {
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
:deep(.composition > strong) {
  font-size: 0.82rem;
}
:deep(.composition__bar) {
  display: flex;
  height: 0.65rem;
  margin: var(--space-3) 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}
:deep(.composition__bar span) {
  display: block;
}
:deep(.composition__row) {
  display: grid;
  grid-template-columns: 0.5rem 1fr auto;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
  color: var(--color-muted);
  font-size: 0.7rem;
}
:deep(.composition__row i) {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}
:deep(.composition__row strong) {
  color: var(--color-ink);
}
:deep(.composition__row--loss strong) {
  color: var(--color-danger-dark);
}
.note {
  margin-top: var(--space-4) !important;
  color: var(--color-muted) !important;
  font-size: 0.76rem;
}
.explanation-expansion {
  margin-top: var(--space-4);
  border-block: 1px solid var(--color-line);
}
.expansion-content {
  padding: var(--space-4);
  color: var(--color-copy);
  font-size: 0.86rem;
}
.mechanism-grid span {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
}
.mechanism-grid small {
  color: var(--color-muted);
}
.price-comparison {
  display: grid;
  gap: var(--space-4);
  margin: var(--space-5) 0;
}
:deep(.price-bar > div) {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-1);
  font-size: 0.78rem;
}
:deep(.price-bar > i) {
  display: block;
  height: 0.75rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}
:deep(.price-bar__fill) {
  display: block;
  height: 100%;
  border-radius: inherit;
}
:deep(.price-bar__fill--face) {
  background: var(--color-muted);
}
:deep(.price-bar__fill--market) {
  background: var(--color-purple);
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-line);
}
:deep(.kpi) {
  display: grid;
  gap: 0.1rem;
}
:deep(.kpi small),
:deep(.kpi span) {
  color: var(--color-muted);
  font-size: 0.74rem;
}
:deep(.kpi strong) {
  font-size: 1.05rem;
}
:deep(.kpi--positive strong),
:deep(.kpi--positive span) {
  color: var(--color-success-dark);
}
:deep(.kpi--negative strong),
:deep(.kpi--negative span) {
  color: var(--color-danger-dark);
}
.definition-list p + p {
  margin-top: var(--space-3);
}
.risk-grid {
  margin-top: var(--space-5);
}
.risk-grid > div {
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
}
.risk-grid ul {
  margin: var(--space-3) 0 0;
  padding-left: var(--space-5);
  color: var(--color-copy);
  font-size: 0.82rem;
}
.priority-note {
  color: var(--color-copy);
  font-size: 0.84rem;
}
.comparison-table {
  margin-top: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.comparison-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
.comparison-row > * {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-line);
  font-size: 0.75rem;
}
.comparison-row > span:first-child {
  color: var(--color-muted);
}
.comparison-row--header {
  background: var(--color-surface-soft);
}
.comparison-row:last-child > * {
  border-bottom: 0;
}
.final-takeaway {
  margin-top: var(--space-8);
  padding: var(--space-5);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  background: var(--color-blue-soft);
}
.final-takeaway > strong {
  color: var(--color-primary-dark);
  font-size: 1.05rem;
}
.role-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--space-4);
}
.role-grid > span {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.role-grid .q-icon {
  color: var(--color-primary-dark);
  font-size: 1.3rem;
}
.role-grid small {
  color: var(--color-copy);
  line-height: 1.35;
}
.final-takeaway p {
  margin: var(--space-4) 0 0;
  color: var(--color-copy);
  font-size: 0.85rem;
  line-height: 1.5;
}
@media (max-width: 599px) {
  .simulation-card {
    padding: var(--space-4);
  }
  .relationship-grid,
  .result-grid,
  .composition-grid,
  .risk-grid,
  .asset-inputs,
  .mechanism-grid {
    grid-template-columns: 1fr;
  }
  .role-grid {
    grid-template-columns: 1fr;
  }
  .input-grid,
  .input-grid--four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .comparison-row > * {
    padding: var(--space-2);
    font-size: 0.68rem;
  }
  h2 {
    font-size: 1.65rem;
  }
}
</style>
