import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { ensureFinancialYear, getFinancialYear, subscribeFinancialYear } = vi.hoisted(() => ({
  ensureFinancialYear: vi.fn(),
  getFinancialYear: vi.fn(),
  subscribeFinancialYear: vi.fn(),
}))

vi.mock('@/services/firebase/financial-years.service', () => ({
  ensureFinancialYear,
  getFinancialYear,
  subscribeFinancialYear,
}))

import { currentFinancialYear } from '../../functions/shared/positions/annual-projection.js'
import { useFinancialYearsStore } from '../../src/stores/financial-years-store'

describe('financial years store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    ensureFinancialYear.mockReset().mockResolvedValue({})
    getFinancialYear.mockReset()
    subscribeFinancialYear.mockReset()
    getFinancialYear.mockResolvedValue({ id: String(currentFinancialYear()), months: {} })
    subscribeFinancialYear.mockImplementation(() => vi.fn())
  })

  it('reactivates the current-year listener when a cached workspace is reopened', async () => {
    const store = useFinancialYearsStore()
    const year = currentFinancialYear()

    await store.load('workspace-a', year)
    store.stopWatching()
    await store.load('workspace-a', year)

    expect(getFinancialYear).toHaveBeenCalledTimes(1)
    expect(subscribeFinancialYear).toHaveBeenCalledTimes(2)
    expect(ensureFinancialYear).toHaveBeenCalledTimes(1)
  })

  it('moves the listener when returning to another cached workspace', async () => {
    const store = useFinancialYearsStore()
    const year = currentFinancialYear()

    await store.load('workspace-a', year)
    await store.load('workspace-b', year)
    await store.load('workspace-a', year)

    expect(getFinancialYear).toHaveBeenCalledTimes(2)
    expect(subscribeFinancialYear).toHaveBeenCalledTimes(3)
  })

  it('does not wait for current-year maintenance before returning existing data', async () => {
    let finishEnsure
    ensureFinancialYear.mockReturnValue(
      new Promise((resolve) => {
        finishEnsure = resolve
      }),
    )
    const store = useFinancialYearsStore()
    const year = currentFinancialYear()

    await expect(store.load('workspace-a', year)).resolves.toEqual({
      id: String(year),
      months: {},
    })

    expect(ensureFinancialYear).toHaveBeenCalledWith('workspace-a', year)
    finishEnsure({})
  })

  it('deduplicates concurrent reads and background maintenance', async () => {
    const store = useFinancialYearsStore()
    const year = currentFinancialYear()

    await Promise.all([
      store.load('workspace-a', year),
      store.load('workspace-a', year),
      store.load('workspace-a', year),
    ])

    expect(getFinancialYear).toHaveBeenCalledTimes(1)
    expect(ensureFinancialYear).toHaveBeenCalledTimes(1)
  })

  it('keeps an existing snapshot when background maintenance fails', async () => {
    ensureFinancialYear.mockRejectedValueOnce(new Error('maintenance unavailable'))
    const store = useFinancialYearsStore()
    const year = currentFinancialYear()

    await store.load('workspace-a', year)
    await Promise.resolve()

    expect(store.get('workspace-a', year)).toEqual({ id: String(year), months: {} })
    expect(store.errorFor('workspace-a', year)).toBeNull()
  })

  it('does not retain completion from maintenance that finishes after reset', async () => {
    let finishFirstEnsure
    ensureFinancialYear
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishFirstEnsure = resolve
        }),
      )
      .mockResolvedValueOnce({})
    const store = useFinancialYearsStore()
    const year = currentFinancialYear()

    await store.load('workspace-a', year)
    store.reset()
    finishFirstEnsure({})
    await Promise.resolve()
    await store.load('workspace-a', year)

    expect(ensureFinancialYear).toHaveBeenCalledTimes(2)
  })

  it('subscribes to a selected historical year so trigger updates reach the cache', async () => {
    const store = useFinancialYearsStore()

    await store.load('workspace-a', 2025)

    expect(subscribeFinancialYear).toHaveBeenCalledWith(
      'workspace-a',
      2025,
      expect.any(Function),
      expect.any(Function),
    )
  })

  it('keeps load errors scoped to their workspace and year', async () => {
    const store = useFinancialYearsStore()
    const failure = new Error('unavailable')
    getFinancialYear.mockRejectedValueOnce(failure)

    await expect(store.load('workspace-a', 2025)).rejects.toThrow('unavailable')

    expect(store.errorFor('workspace-a', 2025)).toBe(failure)
    expect(store.errorFor('workspace-b', 2025)).toBeNull()
  })
})
