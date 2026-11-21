import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const {
  createTrackedExpense,
  getExpenseTrackingMonth,
  getExpenseTrackingPreferences,
  getExpenseTrackingYear,
  saveExpenseTrackingPreferences,
} = vi.hoisted(() => ({
  createTrackedExpense: vi.fn(),
  getExpenseTrackingMonth: vi.fn(),
  getExpenseTrackingPreferences: vi.fn(),
  getExpenseTrackingYear: vi.fn(),
  saveExpenseTrackingPreferences: vi.fn(),
}))

vi.mock('@/services/firebase/expense-tracking.service', () => ({
  createTrackedExpense,
  getExpenseTrackingMonth,
  getExpenseTrackingPreferences,
  getExpenseTrackingYear,
  removeTrackedExpense: vi.fn(),
  saveExpenseTrackingPreferences,
  saveTrackingReconciliation: vi.fn(),
  saveTrackingReconciliations: vi.fn(),
  updateTrackedExpense: vi.fn(),
}))

import { useExpenseTrackingStore } from '../../src/stores/expense-tracking-store'

describe('expense tracking store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getExpenseTrackingMonth.mockReset()
    getExpenseTrackingPreferences.mockReset()
    getExpenseTrackingYear.mockReset()
    saveExpenseTrackingPreferences.mockReset()
    createTrackedExpense.mockReset()
    getExpenseTrackingMonth.mockImplementation(async (_, period) => ({ period, categories: {} }))
    getExpenseTrackingPreferences.mockResolvedValue({
      enabledSubcategories: ['groceries'],
    })
    getExpenseTrackingYear.mockImplementation(async (_, year) => ({
      '01': { year, month: 1, categories: {} },
    }))
    saveExpenseTrackingPreferences.mockImplementation(async (_, subcategoryIds) => subcategoryIds)
  })

  it('reuses workspace preferences while loading different months', async () => {
    const store = useExpenseTrackingStore()

    await store.load('workspace-a', '2026-09', true)
    await store.load('workspace-a', '2026-10', true)
    await store.load('workspace-a', '2026-11', true)

    expect(getExpenseTrackingMonth).toHaveBeenCalledTimes(3)
    expect(getExpenseTrackingPreferences).toHaveBeenCalledTimes(1)
  })

  it('reloads preferences after the expense model is invalidated', async () => {
    const store = useExpenseTrackingStore()

    await store.load('workspace-a', '2026-09', true)
    store.invalidatePreferences('workspace-a')
    await store.load('workspace-a', '2026-10', true)

    expect(getExpenseTrackingPreferences).toHaveBeenCalledTimes(2)
  })

  it('adds a subcategory to the tracker when its tracking preference is enabled', async () => {
    const store = useExpenseTrackingStore()
    await store.loadPreferences('workspace-a')

    await store.savePreferences('workspace-a', ['groceries', 'fuel_charging'])

    expect(saveExpenseTrackingPreferences).toHaveBeenCalledWith('workspace-a', [
      'groceries',
      'fuel_charging',
    ])
    expect(store.enabledSubcategories).toEqual(['groceries', 'fuel_charging'])
  })

  it('loads and caches the selected tracking year independently from the active month', async () => {
    const store = useExpenseTrackingStore()

    await store.loadYear('workspace-a', 2026)
    await store.loadYear('workspace-a', 2026)
    await store.loadYear('workspace-a', 2027)

    expect(getExpenseTrackingYear).toHaveBeenCalledTimes(2)
    expect(store.yearMonths['01'].year).toBe(2027)
  })

  it('ignores a completed mutation after the user has moved to another month', async () => {
    const store = useExpenseTrackingStore()
    let resolveMutation
    createTrackedExpense.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMutation = resolve
        }),
    )

    await store.load('workspace-a', '2026-09', true)
    const mutation = store.add('workspace-a', '2026-09', 'groceries', {}, [])
    await store.load('workspace-a', '2026-10', true)
    resolveMutation({ period: '2026-09', categories: { groceries: { items: [{}] } } })
    await mutation

    expect(store.month.period).toBe('2026-10')
  })

  it('breaks a subcategory total down by expense item', async () => {
    getExpenseTrackingMonth.mockResolvedValue({
      categories: {
        streaming: {
          items: [
            { id: 'entry-a', itemId: 'netflix', amount: 18 },
            { id: 'entry-b', itemId: 'spotify', amount: 12 },
            { id: 'entry-c', itemId: 'netflix', amount: 5 },
          ],
        },
      },
    })
    const store = useExpenseTrackingStore()

    await store.load('workspace-a', '2026-10', true)

    expect(store.totalForItem('streaming', 'netflix')).toBe(23)
    expect(store.totalForItem('streaming', 'spotify')).toBe(12)
  })
})
