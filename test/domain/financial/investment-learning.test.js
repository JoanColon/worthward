import { describe, expect, it } from 'vitest'
import {
  bondYieldCurve,
  buildRiskScenarioPaths,
  compareBondAndStock,
  priceFixedCouponBond,
} from '../../../functions/shared/assets/securities.js'

const defaults = {
  initialInvestment: 10_000,
  years: 20,
  couponRate: 4,
  reinvestCoupons: false,
  couponReinvestmentRate: 4,
  sharePriceGrowth: 5,
  dividendYield: 3,
  reinvestDividends: false,
}

describe('investment learning calculations', () => {
  it('does not double-count distributed coupons or dividends', () => {
    const result = compareBondAndStock(defaults)
    expect(result.bond.finalValue).toBe(18_000)
    expect(result.bond.totalIncome).toBe(8_000)
    expect(result.bond.reinvestmentReturn).toBe(0)
    expect(result.stock.finalValue).toBeCloseTo(
      result.stock.marketValue + result.stock.cashDividends,
      8,
    )
  })

  it('handles zero rates and negative share price growth', () => {
    const result = compareBondAndStock({
      ...defaults,
      couponRate: 0,
      couponReinvestmentRate: 0,
      dividendYield: 0,
      sharePriceGrowth: -5,
    })
    expect(result.bond.finalValue).toBe(10_000)
    expect(result.stock.capitalGain).toBeLessThan(0)
    expect(result.stock.finalValue).toBeCloseTo(10_000 * 0.95 ** 20, 8)
  })

  it('supports coupon and dividend reinvestment independently', () => {
    const reinvested = compareBondAndStock({
      ...defaults,
      reinvestCoupons: true,
      reinvestDividends: true,
    })
    const distributed = compareBondAndStock(defaults)
    expect(reinvested.bond.finalValue).toBeGreaterThan(distributed.bond.finalValue)
    expect(reinvested.stock.finalValue).toBeGreaterThan(distributed.stock.finalValue)
  })

  it('produces equivalent compound values under equivalent assumptions', () => {
    const result = compareBondAndStock({
      ...defaults,
      couponRate: 5,
      couponReinvestmentRate: 5,
      reinvestCoupons: true,
      sharePriceGrowth: 5,
      dividendYield: 0,
    })
    expect(result.bond.finalValue).toBeCloseTo(result.stock.finalValue, 8)
    expect(result.bond.finalValue).toBeCloseTo(26_532.98, 2)
  })

  it('prices bonds above, below and at face value as yields change', () => {
    expect(
      priceFixedCouponBond({ faceValue: 10_000, couponRate: 4, marketYield: 4, years: 10 })
        .marketPrice,
    ).toBeCloseTo(10_000, 8)
    expect(
      priceFixedCouponBond({ faceValue: 10_000, couponRate: 4, marketYield: 6, years: 10 })
        .marketPrice,
    ).toBeLessThan(10_000)
    expect(
      priceFixedCouponBond({ faceValue: 10_000, couponRate: 4, marketYield: 2, years: 10 })
        .marketPrice,
    ).toBeGreaterThan(10_000)
  })

  it('handles a zero market yield and different maturities', () => {
    expect(
      priceFixedCouponBond({ faceValue: 10_000, couponRate: 4, marketYield: 0, years: 10 })
        .marketPrice,
    ).toBe(14_000)
    const short = priceFixedCouponBond({
      faceValue: 10_000,
      couponRate: 4,
      marketYield: 6,
      years: 2,
    })
    const long = priceFixedCouponBond({
      faceValue: 10_000,
      couponRate: 4,
      marketYield: 6,
      years: 20,
    })
    expect(long.priceDifference).toBeLessThan(short.priceDifference)
    expect(bondYieldCurve({ faceValue: 10_000, couponRate: 4, years: 10 })).toHaveLength(25)
  })

  it('creates deterministic non-smooth equity paths with the requested terminal CAGRs', () => {
    const input = {
      initialInvestment: 10_000,
      years: 10,
      couponRate: 4,
      favourableGrowth: 10.8,
      moderateGrowth: 6,
      unfavourableGrowth: -3.5,
      volatility: 18,
    }
    const first = buildRiskScenarioPaths(input)
    const second = buildRiskScenarioPaths(input)
    expect(first).toEqual(second)
    expect(first.favourable.at(-1).value).toBeCloseTo(10_000 * 1.108 ** 10, 6)
    expect(first.moderate.map(({ value }) => value)).not.toEqual(
      [...first.moderate].sort((a, b) => a.value - b.value).map(({ value }) => value),
    )
  })
})
