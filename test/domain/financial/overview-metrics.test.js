import { describe, expect, it } from 'vitest'
import {
  calculateAssetOverviewMetrics,
  calculateExpenseOverviewMetrics,
  calculateFinancialSharePercent,
  calculateIncomeOverviewMetrics,
  calculateLiabilityOverviewMetrics,
  calculateModeledMonthlyLiabilityPayments,
} from '../../../functions/shared/positions/overview-metrics.js'

const positionItem = (total, memberValues = {}) => ({ total, memberValues })
const flowItem = (total, extra = {}) => ({ total, memberValues: { a: total * 0.6 }, ...extra })

const financialYear = {
  months: {
    '01': {
      assets: {
        categories: {
          real_estate: {
            subcategories: { home: positionItem(200, { a: 120 }) },
          },
          investment: {
            subcategories: { funds: positionItem(300, { a: 180 }) },
          },
        },
      },
      liabilities: {
        categories: {
          mortgage: { subcategories: { home: positionItem(100, { a: 60 }) } },
        },
      },
      income: {
        categories: {
          employment: {
            subcategories: {
              salary: {
                ...flowItem(1_000),
                items: { salary: flowItem(1_000, { disposablePercentage: 80 }) },
              },
            },
          },
        },
      },
      expenses: {
        categories: {
          living: {
            subcategories: {
              housing: { ...flowItem(300), effective: 300, necessity: 'essential' },
              leisure: { ...flowItem(100), effective: 100, necessity: 'lifestyle' },
              unknown: { ...flowItem(100), effective: 100, necessity: null },
            },
          },
        },
      },
    },
  },
}

describe('financial overview metrics', () => {
  it('calculates stable one-decimal shares', () => {
    expect(calculateFinancialSharePercent(1, 3)).toBe(33.3)
    expect(calculateFinancialSharePercent(10, 0)).toBe(0)
  })

  it('splits assets and calculates debt to assets for the selected scope', () => {
    expect(calculateAssetOverviewMetrics(financialYear, '01')).toEqual({
      financialAssets: 300,
      financialAssetsPercent: 60,
      realEstate: 200,
      realEstatePercent: 40,
    })
    expect(calculateLiabilityOverviewMetrics(financialYear, '01', 'a')).toEqual({
      debtToAssetsPercent: 20,
    })
  })

  it('separates available and reinvested income', () => {
    expect(calculateIncomeOverviewMetrics(financialYear)).toEqual({
      available: 800,
      availablePercent: 80,
      reinvested: 200,
      reinvestedPercent: 20,
    })
  })

  it('keeps unclassified expenses outside the explicit classifications', () => {
    expect(calculateExpenseOverviewMetrics(financialYear)).toEqual({
      essential: 300,
      essentialPercent: 60,
      lifestyle: 100,
      lifestylePercent: 20,
    })
  })

  it('only sums payments from modeled mortgages and applies ownership scope', () => {
    const liabilities = [
      {
        detail: { mortgage: { monthlyPayment: 800 } },
        ownership: {
          shares: [
            { memberId: 'a', percentage: 75 },
            { memberId: 'b', percentage: 25 },
          ],
        },
      },
      { balance: 2_000 },
    ]
    expect(calculateModeledMonthlyLiabilityPayments(liabilities)).toBe(800)
    expect(calculateModeledMonthlyLiabilityPayments(liabilities, 'a')).toBe(600)
  })
})
