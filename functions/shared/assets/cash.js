/**
 * Pure Cash asset projections and portfolio return aggregation.
 * Recorded balances remain observations; these functions only model future values.
 */
import { roundMoneyOrZero } from '../core/money.js'
import {
  compoundReturnFactorForMonths,
  normalizeAnnualReturnPercent,
} from '../core/rates.js'

const MAX_CASH_SCENARIO_YEARS = 100

/** Projects a recorded Cash balance using an effective annual compound return. */
export function projectCashValue({ currentBalance = 0, annualReturnPercent = 0, months = 0 } = {}) {
  return roundMoneyOrZero(
    compoundCashBalance({ currentBalance, annualReturnPercent, months }),
  )
}

/** Compounds a Cash balance without intermediate currency rounding. */
export function compoundCashBalance({
  currentBalance = 0,
  annualReturnPercent = 0,
  months = 0,
} = {}) {
  const balance = nonNegativeBalance(currentBalance)
  const rate = requireAnnualReturn(annualReturnPercent)
  const horizon = nonNegativeMonths(months)
  return balance * compoundReturnFactorForMonths(rate, horizon)
}

/**
 * Calculates the balance-weighted annual return for normalized Cash positions.
 * Missing or invalid returns contribute zero; invalid or negative balances are ignored.
 */
export function calculateWeightedCashAnnualReturn(positions = []) {
  let totalBalance = 0
  let weightedReturn = 0

  for (const position of Array.isArray(positions) ? positions : []) {
    const balance = Number(position?.balance)
    if (!Number.isFinite(balance) || balance <= 0) continue
    const annualReturnPercent = normalizeAnnualReturnPercent(position?.annualReturnPercent, 0) || 0
    totalBalance += balance
    weightedReturn += balance * annualReturnPercent
  }

  return totalBalance > 0 ? weightedReturn / totalBalance : 0
}

/** Models the real value of unremunerated Cash after inflation. */
export function purchasingPowerScenario({ initialCash, inflationRate, years }) {
  const values = normalizeCashScenario({ initialCash, inflationRate, years })
  const finalPurchasingPower =
    values.initialCash / (1 + values.inflationRate / 100) ** values.years
  const purchasingPowerChange = finalPurchasingPower - values.initialCash

  return {
    ...values,
    finalNominalValue: values.initialCash,
    finalPurchasingPower,
    purchasingPowerChange,
    purchasingPowerChangePercent: percentageChange(purchasingPowerChange, values.initialCash),
    projection: project(values.years, (year) => ({
      year,
      nominalValue: values.initialCash,
      realValue: values.initialCash / (1 + values.inflationRate / 100) ** year,
    })),
  }
}

/** Models the nominal and inflation-adjusted value of remunerated Cash. */
export function remuneratedCashScenario({ initialCash, interestRate, inflationRate, years }) {
  const values = normalizeCashScenario({ initialCash, inflationRate, years })
  const normalizedInterestRate = finiteRate(interestRate, 'interestRate')
  const inflationGrowth = 1 + values.inflationRate / 100
  const balanceAt = (year) =>
    compoundCashBalance({
      currentBalance: values.initialCash,
      annualReturnPercent: normalizedInterestRate,
      months: year * 12,
    })
  const finalNominalValue = balanceAt(values.years)
  const finalPurchasingPower = finalNominalValue / inflationGrowth ** values.years
  const purchasingPowerChange = finalPurchasingPower - values.initialCash

  return {
    ...values,
    interestRate: normalizedInterestRate,
    finalNominalValue,
    finalPurchasingPower,
    realAnnualReturn: ((1 + normalizedInterestRate / 100) / inflationGrowth - 1) * 100,
    purchasingPowerChange,
    purchasingPowerChangePercent: percentageChange(purchasingPowerChange, values.initialCash),
    projection: project(values.years, (year) => {
      const nominalValue = balanceAt(year)
      return {
        year,
        nominalValue,
        realValue: nominalValue / inflationGrowth ** year,
        referenceValue: values.initialCash,
      }
    }),
  }
}

/** Splits available Cash between emergency coverage, planned needs, surplus and shortfall. */
export function emergencyFundScenario({
  monthlyEssentialExpenses,
  monthsOfCoverage,
  availableCash,
  plannedShortTermExpenses,
}) {
  const monthlyExpenses = nonNegative(monthlyEssentialExpenses, 'monthlyEssentialExpenses')
  const coverageMonths = boundedInteger(monthsOfCoverage, 1, 24, 'monthsOfCoverage')
  const cash = nonNegative(availableCash, 'availableCash')
  const plannedExpenses = nonNegative(plannedShortTermExpenses, 'plannedShortTermExpenses')
  const emergencyFund = monthlyExpenses * coverageMonths
  const cashTarget = emergencyFund + plannedExpenses
  const surplusCash = Math.max(0, cash - cashTarget)
  const cashShortfall = Math.max(0, cashTarget - cash)
  const cashAvailableForEmergency = Math.max(0, cash - plannedExpenses)

  return {
    monthlyEssentialExpenses: monthlyExpenses,
    monthsOfCoverage: coverageMonths,
    availableCash: cash,
    plannedShortTermExpenses: plannedExpenses,
    emergencyFund,
    cashTarget,
    surplusCash,
    cashShortfall,
    coveredEmergencyFund: Math.min(emergencyFund, cashAvailableForEmergency),
    coveredPlannedExpenses: Math.min(plannedExpenses, cash),
    identifiedNeeds: Math.min(cash, cashTarget),
    emergencyCoverageMonths:
      monthlyExpenses > 0 ? cashAvailableForEmergency / monthlyExpenses : coverageMonths,
  }
}

function normalizeCashScenario({ initialCash, inflationRate, years }) {
  return {
    initialCash: nonNegative(initialCash, 'initialCash'),
    inflationRate: finiteRate(inflationRate, 'inflationRate'),
    years: boundedInteger(years, 0, MAX_CASH_SCENARIO_YEARS, 'years'),
  }
}

function project(years, pointAt) {
  return Array.from({ length: years + 1 }, (_, year) => pointAt(year))
}

function percentageChange(change, base) {
  return base > 0 ? (change / base) * 100 : 0
}

function nonNegative(value, field) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new RangeError(`Invalid ${field}`)
  return number
}

function finiteRate(value, field) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= -100 || number > 100) {
    throw new RangeError(`Invalid ${field}`)
  }
  return number
}

function boundedInteger(value, minimum, maximum, field) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new RangeError(`Invalid ${field}`)
  }
  return number
}

function nonNegativeBalance(value) {
  const balance = Number(value)
  if (!Number.isFinite(balance) || balance < 0) {
    throw new RangeError('A valid Cash balance is required')
  }
  return balance
}

function requireAnnualReturn(value) {
  const rate = normalizeAnnualReturnPercent(value)
  if (rate == null) throw new RangeError('A valid annual Cash return is required')
  return rate
}

function nonNegativeMonths(value) {
  const months = Number(value)
  if (!Number.isFinite(months) || months < 0) {
    throw new RangeError('A valid Cash projection horizon is required')
  }
  return months
}
