import { describe, expect, it } from 'vitest'
import {
  emergencyFundScenario,
  purchasingPowerScenario,
  remuneratedCashScenario,
} from '../../../functions/shared/assets/cash.js'

describe('cash learning simulations', () => {
  it('shows the purchasing power lost to inflation', () => {
    const result = purchasingPowerScenario({ initialCash: 20_000, inflationRate: 3, years: 20 })

    expect(result.finalNominalValue).toBe(20_000)
    expect(result.finalPurchasingPower).toBeCloseTo(11_073.52, 2)
    expect(result.purchasingPowerChangePercent).toBeCloseTo(-44.63, 2)
    expect(result.projection).toHaveLength(21)
  })

  it('keeps real purchasing power flat when interest matches inflation', () => {
    const result = remuneratedCashScenario({
      initialCash: 20_000,
      interestRate: 3,
      inflationRate: 3,
      years: 20,
    })

    expect(result.realAnnualReturn).toBeCloseTo(0, 8)
    expect(result.finalPurchasingPower).toBeCloseTo(20_000, 8)
  })

  it('handles zero inflation and zero remuneration', () => {
    const result = remuneratedCashScenario({
      initialCash: 20_000,
      interestRate: 0,
      inflationRate: 0,
      years: 20,
    })

    expect(result.finalNominalValue).toBe(20_000)
    expect(result.finalPurchasingPower).toBe(20_000)
    expect(result.realAnnualReturn).toBe(0)
  })

  it('separates emergency needs, planned expenses, surplus and shortfall', () => {
    expect(
      emergencyFundScenario({
        monthlyEssentialExpenses: 1_500,
        monthsOfCoverage: 6,
        availableCash: 20_000,
        plannedShortTermExpenses: 0,
      }),
    ).toMatchObject({ emergencyFund: 9_000, cashTarget: 9_000, surplusCash: 11_000 })

    expect(
      emergencyFundScenario({
        monthlyEssentialExpenses: 2_000,
        monthsOfCoverage: 6,
        availableCash: 10_000,
        plannedShortTermExpenses: 2_000,
      }),
    ).toMatchObject({ emergencyFund: 12_000, cashTarget: 14_000, cashShortfall: 4_000 })
  })
})
