import { describe, expect, it } from 'vitest'
import {
  buildFrenchMortgageScheduleFromBalance,
  calculateFrenchMortgageMonthlyPayment,
  compareFrenchMortgageLumpSumScenarios,
  compareFrenchMortgagePayoffScenarios,
} from '../../../functions/shared/liabilities/mortgage.js'
import { nominalMonthlyRateFromAnnualPercent } from '../../../functions/shared/core/rates.js'

describe('French mortgage amortization', () => {
  it('converts a nominal annual percentage into a monthly decimal rate', () => {
    expect(nominalMonthlyRateFromAnnualPercent(2.4)).toBeCloseTo(0.002)
  })

  it('calculates the standard fixed monthly payment', () => {
    expect(
      calculateFrenchMortgageMonthlyPayment({
        principal: 200_000,
        annualInterestRate: 3,
        termMonths: 360,
      }),
    ).toBe(843.21)
  })

  it('supports a zero-interest mortgage', () => {
    expect(
      calculateFrenchMortgageMonthlyPayment({
        principal: 12_000,
        annualInterestRate: 0,
        termMonths: 12,
      }),
    ).toBe(1_000)
  })

  it('splits payments and uses a smaller final payment', () => {
    const schedule = buildFrenchMortgageScheduleFromBalance({
      currentBalance: 1_000,
      annualInterestRate: 12,
      monthlyPayment: 400,
      asOfDate: '2026-01-31',
    })

    expect(schedule[0]).toEqual({
      paymentNumber: 1,
      date: '2026-02-28',
      payment: 400,
      interest: 10,
      principal: 390,
      remainingBalance: 610,
    })
    expect(schedule.at(-1).payment).toBeLessThan(400)
    expect(schedule.at(-1).remainingBalance).toBe(0)
  })

  it('keeps future payments on the contractual mortgage day', () => {
    const schedule = buildFrenchMortgageScheduleFromBalance({
      currentBalance: 10_000,
      annualInterestRate: 0,
      monthlyPayment: 1_000,
      startDate: '2022-04-01',
      asOfDate: '2026-11-20',
    })

    expect(schedule[0].date).toBe('2026-12-01')
    expect(schedule[1].date).toBe('2027-01-01')
  })

  it('calculates the effect of an additional monthly payment', () => {
    const projection = compareFrenchMortgagePayoffScenarios({
      currentBalance: 146_230,
      annualInterestRate: 2.41,
      monthlyPayment: 812,
      extraMonthlyPayment: 200,
      asOfDate: '2026-10-27',
    })

    expect(projection.accelerated.remainingPayments).toBeLessThan(projection.remainingPayments)
    expect(projection.accelerated.monthsEarlier).toBeGreaterThan(0)
    expect(projection.accelerated.interestSaved).toBeGreaterThan(0)
    expect(projection.nextPayment.interest + projection.nextPayment.principal).toBe(
      projection.nextPayment.payment,
    )
  })

  it('compares lower-payment and shorter-term outcomes after a lump-sum repayment', () => {
    const comparison = compareFrenchMortgageLumpSumScenarios({
      principal: 200_000,
      annualInterestRate: 3,
      termMonths: 25 * 12,
      repaymentAmount: 10_000,
      repaymentAfterMonths: 5 * 12,
      asOfDate: '2026-01-01',
    })

    expect(comparison.monthlyPayment).toBe(948.42)
    expect(comparison.balanceBeforeRepayment).toBe(171_011.14)
    expect(comparison.reducePayment.monthlyPayment).toBe(892.96)
    expect(comparison.reducePayment.monthlyCashFlowImprovement).toBe(55.46)
    expect(comparison.reducePayment.interestSaved).toBe(3_310.23)
    expect(comparison.shortenTerm.remainingPayments).toBe(222)
    expect(comparison.shortenTerm.monthsEarlier).toBe(18)
    expect(comparison.shortenTerm.interestSaved).toBe(7_806.13)
  })

  it('uses an existing contractual payment when modelling a real mortgage', () => {
    const comparison = compareFrenchMortgageLumpSumScenarios({
      principal: 146_230,
      annualInterestRate: 2.41,
      termMonths: 204,
      monthlyPayment: 812,
      repaymentAmount: 10_000,
      repaymentAfterMonths: 0,
      asOfDate: '2026-10-27',
    })

    expect(comparison.monthlyPayment).toBe(812)
    expect(comparison.shortenTerm.monthlyPayment).toBe(812)
    expect(comparison.balanceBeforeRepayment).toBe(146_230)
  })

  it('returns an empty schedule for a paid-off mortgage', () => {
    expect(
      buildFrenchMortgageScheduleFromBalance({
        currentBalance: 0,
        annualInterestRate: 3,
        monthlyPayment: 800,
        asOfDate: '2026-10-27',
      }),
    ).toEqual([])
  })

  it('rejects a payment that cannot amortize the mortgage', () => {
    expect(() =>
      buildFrenchMortgageScheduleFromBalance({
        currentBalance: 100_000,
        annualInterestRate: 12,
        monthlyPayment: 500,
        asOfDate: '2026-10-27',
      }),
    ).toThrow('does not cover')
  })
})
