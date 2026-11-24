const MAX_HORIZON_YEARS = 100

export function purchasingPowerScenario({ initialCash, inflationRate, years }) {
  const values = normalizeScenario({ initialCash, inflationRate, years })
  const finalPurchasingPower = values.initialCash / (1 + values.inflationRate / 100) ** values.years
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

export function remuneratedCashScenario({ initialCash, interestRate, inflationRate, years }) {
  const values = normalizeScenario({ initialCash, inflationRate, years })
  const normalizedInterestRate = finiteRate(interestRate, 'interestRate')
  const nominalGrowth = 1 + normalizedInterestRate / 100
  const inflationGrowth = 1 + values.inflationRate / 100
  const finalNominalValue = values.initialCash * nominalGrowth ** values.years
  const finalPurchasingPower = finalNominalValue / inflationGrowth ** values.years
  const purchasingPowerChange = finalPurchasingPower - values.initialCash

  return {
    ...values,
    interestRate: normalizedInterestRate,
    finalNominalValue,
    finalPurchasingPower,
    realAnnualReturn: (nominalGrowth / inflationGrowth - 1) * 100,
    purchasingPowerChange,
    purchasingPowerChangePercent: percentageChange(purchasingPowerChange, values.initialCash),
    projection: project(values.years, (year) => {
      const nominalValue = values.initialCash * nominalGrowth ** year
      return {
        year,
        nominalValue,
        realValue: nominalValue / inflationGrowth ** year,
        referenceValue: values.initialCash,
      }
    }),
  }
}

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

function normalizeScenario({ initialCash, inflationRate, years }) {
  return {
    initialCash: nonNegative(initialCash, 'initialCash'),
    inflationRate: finiteRate(inflationRate, 'inflationRate'),
    years: boundedInteger(years, 0, MAX_HORIZON_YEARS, 'years'),
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
  if (!Number.isFinite(number) || number <= -100 || number > 1_000) {
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
