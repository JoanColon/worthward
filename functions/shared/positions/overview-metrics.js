/**
 * Deterministic secondary metrics used by the four financial overview cards.
 * Keeping these formulas here prevents presentation components from owning financial logic.
 */
import { roundMoneyOrZero } from '../core/money.js'
import { moneyForOwnershipScope } from '../core/ownership.js'
import {
  financialYearAvailableIncomeValue,
  financialYearExpenseNecessityValue,
  financialYearFlowValue,
  financialYearMonthCategoryValue,
  financialYearMonthValue,
} from './annual-projection.js'

/** Returns a one-decimal percentage, or zero when the comparison total is not positive. */
export function calculateFinancialSharePercent(value, total) {
  const denominator = Number(total) || 0
  if (denominator <= 0) return 0
  return Math.round((((Number(value) || 0) / denominator) * 100 + Number.EPSILON) * 10) / 10
}

/** Reads cash plus investments as financial assets, alongside real estate. */
export function calculateAssetOverviewMetrics(financialYear, month, memberId = 'all') {
  const total = financialYearMonthValue(financialYear, month, 'assets', memberId)
  const investments = financialYearMonthCategoryValue(
    financialYear,
    month,
    'assets',
    'investment',
    memberId,
  )
  const cash = financialYearMonthCategoryValue(
    financialYear,
    month,
    'assets',
    'cash',
    memberId,
  )
  const realEstate = financialYearMonthCategoryValue(
    financialYear,
    month,
    'assets',
    'real_estate',
    memberId,
  )
  const financialAssets = roundMoneyOrZero(investments + cash)
  return {
    financialAssets,
    financialAssetsPercent: calculateFinancialSharePercent(financialAssets, total),
    realEstate,
    realEstatePercent: calculateFinancialSharePercent(realEstate, total),
  }
}

/** Calculates the current debt-to-assets ratio for the same month and ownership scope. */
export function calculateLiabilityOverviewMetrics(financialYear, month, memberId = 'all') {
  const liabilities = financialYearMonthValue(financialYear, month, 'liabilities', memberId)
  const assets = financialYearMonthValue(financialYear, month, 'assets', memberId)
  return {
    debtToAssetsPercent: calculateFinancialSharePercent(liabilities, assets),
  }
}

/**
 * Sums contractual payments that actually exist in modeled mortgage liabilities.
 * Simple liability balances have no payment field and are intentionally excluded.
 */
export function calculateModeledMonthlyLiabilityPayments(liabilities, memberId = 'all') {
  return roundMoneyOrZero(
    (liabilities || []).reduce((total, liability) => {
      const payment = liability?.detail?.mortgage?.monthlyPayment
      if (!Number.isFinite(Number(payment)) || Number(payment) <= 0) return total
      return total + moneyForOwnershipScope(payment, liability.ownership, memberId)
    }, 0),
  )
}

/** Splits annual income into disposable and reinvested portions. */
export function calculateIncomeOverviewMetrics(financialYear, memberId = 'all') {
  const total = financialYearFlowValue(financialYear, 'income', memberId)
  const available = financialYearAvailableIncomeValue(financialYear, memberId)
  const reinvested = roundMoneyOrZero(Math.max(0, total - available))
  return {
    available,
    availablePercent: calculateFinancialSharePercent(available, total),
    reinvested,
    reinvestedPercent: calculateFinancialSharePercent(reinvested, total),
  }
}

/** Reads the two explicit expense classifications; unclassified spending stays outside both. */
export function calculateExpenseOverviewMetrics(financialYear, memberId = 'all') {
  const total = financialYearFlowValue(financialYear, 'expenses', memberId)
  const essential = financialYearExpenseNecessityValue(financialYear, 'essential', memberId)
  const lifestyle = financialYearExpenseNecessityValue(financialYear, 'lifestyle', memberId)
  return {
    essential,
    essentialPercent: calculateFinancialSharePercent(essential, total),
    lifestyle,
    lifestylePercent: calculateFinancialSharePercent(lifestyle, total),
  }
}
