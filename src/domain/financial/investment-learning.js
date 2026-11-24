export function compareBondAndStock({
  initialInvestment,
  years,
  couponRate,
  reinvestCoupons,
  couponReinvestmentRate,
  sharePriceGrowth,
  dividendYield,
  reinvestDividends,
}) {
  const initial = nonNegative(initialInvestment, 'initialInvestment')
  const horizon = integerBetween(years, 1, 100, 'years')
  const coupon = rate(couponRate, 'couponRate')
  const couponReinvestment = rate(couponReinvestmentRate, 'couponReinvestmentRate')
  const priceGrowth = rate(sharePriceGrowth, 'sharePriceGrowth')
  const dividend = rate(dividendYield, 'dividendYield')
  const annualCoupon = initial * coupon
  let couponValue = 0
  let stockMarketValue = initial
  let dividendCash = 0
  let dividendsReceived = 0
  const bondProjection = [{ year: 0, value: initial }]
  const stockProjection = [{ year: 0, value: initial }]

  for (let year = 1; year <= horizon; year += 1) {
    couponValue = reinvestCoupons
      ? couponValue * (1 + couponReinvestment) + annualCoupon
      : annualCoupon * year

    const annualDividend = stockMarketValue * dividend
    dividendsReceived += annualDividend
    stockMarketValue *= 1 + priceGrowth
    if (reinvestDividends) stockMarketValue += annualDividend
    else dividendCash += annualDividend

    bondProjection.push({ year, value: initial + couponValue })
    stockProjection.push({ year, value: stockMarketValue + dividendCash })
  }

  const contractualCoupons = annualCoupon * horizon
  const priceOnlyStockValue = initial * (1 + priceGrowth) ** horizon
  const bondTotal = initial + couponValue
  const stockTotal = stockMarketValue + dividendCash

  return {
    bond: {
      annualCoupon,
      faceValue: initial,
      contractualCoupons,
      reinvestmentReturn: couponValue - contractualCoupons,
      totalIncome: contractualCoupons,
      capitalGain: 0,
      finalValue: bondTotal,
      cumulativeReturn: percentageReturn(bondTotal, initial),
      annualizedReturn: annualizedReturn(bondTotal, initial, horizon),
      projection: bondProjection,
    },
    stock: {
      marketValue: stockMarketValue,
      cashDividends: dividendCash,
      dividendsReceived,
      capitalGain: priceOnlyStockValue - initial,
      reinvestmentReturn: stockTotal - priceOnlyStockValue - dividendsReceived,
      finalValue: stockTotal,
      cumulativeReturn: percentageReturn(stockTotal, initial),
      annualizedReturn: annualizedReturn(stockTotal, initial, horizon),
      projection: stockProjection,
    },
  }
}

export function priceFixedCouponBond({ faceValue, couponRate, marketYield, years }) {
  const face = nonNegative(faceValue, 'faceValue')
  const coupon = rate(couponRate, 'couponRate')
  const yieldRate = rate(marketYield, 'marketYield')
  const horizon = integerBetween(years, 1, 100, 'years')
  const annualCoupon = face * coupon
  const marketPrice =
    Math.abs(yieldRate) < 1e-12
      ? face + annualCoupon * horizon
      : annualCoupon * ((1 - (1 + yieldRate) ** -horizon) / yieldRate) +
        face / (1 + yieldRate) ** horizon

  return {
    faceValue: face,
    annualCoupon,
    marketPrice,
    priceDifference: marketPrice - face,
    priceDifferencePercent: percentageReturn(marketPrice, face),
    couponRate: coupon * 100,
    currentYield: marketPrice > 0 ? (annualCoupon / marketPrice) * 100 : 0,
    yieldToMaturity: yieldRate * 100,
  }
}

export function bondYieldCurve({ faceValue, couponRate, years, maximumYield = 12, steps = 24 }) {
  const max = Math.max(0, Number(maximumYield) || 0)
  const count = integerBetween(steps, 2, 200, 'steps')
  return Array.from({ length: count + 1 }, (_, index) => {
    const marketYield = (max * index) / count
    return {
      yield: marketYield,
      value: priceFixedCouponBond({ faceValue, couponRate, marketYield, years }).marketPrice,
    }
  })
}

export function buildRiskScenarioPaths({
  initialInvestment,
  years,
  couponRate,
  favourableGrowth,
  moderateGrowth,
  unfavourableGrowth,
  volatility,
}) {
  const initial = nonNegative(initialInvestment, 'initialInvestment')
  const horizon = integerBetween(years, 1, 50, 'years')
  const coupon = rate(couponRate, 'couponRate')
  const volatilityRate = Math.max(0, rate(volatility, 'volatility'))

  return {
    bond: Array.from({ length: horizon + 1 }, (_, year) => ({
      year,
      value: initial * (1 + coupon * year),
    })),
    favourable: equityPath(
      initial,
      horizon,
      rate(favourableGrowth, 'favourableGrowth'),
      volatilityRate,
      1,
    ),
    moderate: equityPath(
      initial,
      horizon,
      rate(moderateGrowth, 'moderateGrowth'),
      volatilityRate,
      2,
    ),
    unfavourable: equityPath(
      initial,
      horizon,
      rate(unfavourableGrowth, 'unfavourableGrowth'),
      volatilityRate,
      3,
    ),
  }
}

function equityPath(initial, years, annualGrowth, volatility, seed) {
  const shocks = Array.from(
    { length: years },
    (_, index) =>
      Math.sin((index + 1) * (1.73 + seed * 0.31)) +
      0.55 * Math.cos((index + 1) * (0.91 + seed * 0.17)),
  )
  const mean = shocks.reduce((sum, value) => sum + value, 0) / years
  const targetLogGrowth = Math.log1p(annualGrowth)
  let value = initial
  const points = [{ year: 0, value }]

  for (let index = 0; index < years; index += 1) {
    value *= Math.exp(targetLogGrowth + volatility * 0.45 * (shocks[index] - mean))
    points.push({ year: index + 1, value })
  }
  return points
}

function percentageReturn(finalValue, initialValue) {
  return initialValue > 0 ? (finalValue / initialValue - 1) * 100 : 0
}

function annualizedReturn(finalValue, initialValue, years) {
  return initialValue > 0 && finalValue >= 0
    ? ((finalValue / initialValue) ** (1 / years) - 1) * 100
    : -100
}

function nonNegative(value, field) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new RangeError(`Invalid ${field}`)
  return number
}

function rate(value, field) {
  const number = Number(value) / 100
  if (!Number.isFinite(number) || number <= -1 || number > 10)
    throw new RangeError(`Invalid ${field}`)
  return number
}

function integerBetween(value, minimum, maximum, field) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new RangeError(`Invalid ${field}`)
  }
  return number
}
