import { describe, expect, it } from 'vitest'
import { learnContexts, learnTopics, resolveLearnContext } from '../../src/learn/registry.js'

describe('Worthward Learn registry', () => {
  it('resolves the detailed mortgage context', () => {
    const context = resolveLearnContext({ name: 'mortgage-detail' })
    const categoryContext = resolveLearnContext({
      name: 'liability-category',
      params: { category: 'mortgage' },
    })

    expect(context.id).toBe('mortgage-detail')
    expect(context.topics.map(({ id }) => id)).toEqual([
      'frenchAmortization',
      'principalVsInterest',
      'earlyRepayment',
    ])
    expect(categoryContext.id).toBe('mortgages')
    expect(categoryContext.topics.map(({ id }) => id)).toEqual(context.topics.map(({ id }) => id))
  })

  it('does not expose Learn on unrelated routes', () => {
    expect(resolveLearnContext({ name: 'login' })).toBeNull()
    expect(resolveLearnContext({ name: 'home' })).toBeNull()
    expect(resolveLearnContext({ name: 'account' })).toBeNull()
    expect(resolveLearnContext({ name: 'workspace-dashboard' })).toBeNull()
    expect(resolveLearnContext({ name: 'assets' })).toBeNull()
    expect(resolveLearnContext({ name: 'liabilities' })).toBeNull()
    expect(resolveLearnContext({ name: 'income' })).toBeNull()
    expect(resolveLearnContext({ name: 'expenses' })).toBeNull()
    expect(resolveLearnContext({ name: 'expense-tracker' })).toBeNull()
    expect(resolveLearnContext({ name: 'plan' })).toBeNull()
    expect(resolveLearnContext({ name: 'what-if-strategy' })).toBeNull()
    expect(resolveLearnContext({ name: 'progress' })).toBeNull()
    expect(resolveLearnContext({ name: 'investment-portfolio' })).toBeNull()
    expect(resolveLearnContext({ name: 'real-estate-model' })).toBeNull()
  })

  it('exposes the interactive cash lesson for the category and individual model', () => {
    const cash = resolveLearnContext({ name: 'asset-category', params: { category: 'cash' } })

    expect(cash.id).toBe('cash')
    expect(cash.topics.map(({ id }) => id)).toEqual(['inflationPurchasingPower'])
    const cashModel = resolveLearnContext({ name: 'cash-model', params: { assetId: 'cash-1' } })
    expect(cashModel.id).toBe('cash-model')
    expect(cashModel.topics.map(({ id }) => id)).toEqual(['inflationPurchasingPower'])
    expect(
      resolveLearnContext({ name: 'asset-category', params: { category: 'vehicles' } }),
    ).toBeNull()
  })

  it('exposes the detailed investment lesson only on the general Investments page', () => {
    const investments = resolveLearnContext({
      name: 'asset-category',
      params: { category: 'investment' },
    })

    expect(investments.id).toBe('investments')
    expect(investments.topics.map(({ id }) => id)).toEqual(['understandingBondsStocks'])
    expect(resolveLearnContext({ name: 'investment-portfolio' })).toBeNull()
  })

  it('only references defined reusable topics', () => {
    for (const context of Object.values(learnContexts)) {
      for (const topicId of context.topicIds) expect(learnTopics[topicId]).toBeDefined()
    }
  })

  it('contains only the detailed learning contexts', () => {
    expect(Object.keys(learnContexts)).toEqual([
      'cash',
      'cash-model',
      'investments',
      'mortgages',
      'mortgage-detail',
    ])
    expect(Object.keys(learnTopics)).toEqual([
      'frenchAmortization',
      'principalVsInterest',
      'earlyRepayment',
      'inflationPurchasingPower',
      'understandingBondsStocks',
    ])
  })
})
