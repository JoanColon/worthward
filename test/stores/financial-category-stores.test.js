import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  getAssetsConfig: vi.fn(),
  getCategoryAssets: vi.fn(),
  getLiabilitiesConfig: vi.fn(),
  getCategoryLiabilities: vi.fn(),
  getIncomeConfig: vi.fn(),
  getCategoryIncome: vi.fn(),
  getExpensesConfig: vi.fn(),
  getCategoryExpenses: vi.fn(),
}))

vi.mock('@/services/firebase/assets.service', () => ({
  createAsset: vi.fn(),
  deleteAsset: vi.fn(),
  deleteAssetCategory: vi.fn(),
  getAssetsConfig: mocks.getAssetsConfig,
  getCategoryAssets: mocks.getCategoryAssets,
  saveAssetsSetup: vi.fn(),
  updateAsset: vi.fn(),
  updateAssetsCategories: vi.fn(),
  updateSimpleCategoryOwnership: vi.fn(),
  updateSimpleCategoryValue: vi.fn(),
}))

vi.mock('@/services/firebase/liabilities.service', () => ({
  createLiability: vi.fn(),
  deleteLiability: vi.fn(),
  deleteLiabilityCategory: vi.fn(),
  getCategoryLiabilities: mocks.getCategoryLiabilities,
  getLiabilitiesConfig: mocks.getLiabilitiesConfig,
  saveLiabilitiesSetup: vi.fn(),
  updateLiability: vi.fn(),
  updateLiabilityCategories: vi.fn(),
  updateSimpleLiabilityOwnership: vi.fn(),
  updateSimpleLiabilityValue: vi.fn(),
}))

vi.mock('@/services/firebase/income.service', () => ({
  createIncome: vi.fn(),
  deleteIncome: vi.fn(),
  deleteIncomeCategory: vi.fn(),
  getCategoryIncome: mocks.getCategoryIncome,
  getIncomeConfig: mocks.getIncomeConfig,
  saveIncomeSetup: vi.fn(),
  updateIncome: vi.fn(),
  updateIncomeCategories: vi.fn(),
}))

vi.mock('@/services/firebase/expenses.service', () => ({
  createExpense: vi.fn(),
  deleteExpense: vi.fn(),
  deleteExpenseCategory: vi.fn(),
  getCategoryExpenses: mocks.getCategoryExpenses,
  getExpensesConfig: mocks.getExpensesConfig,
  saveExpensesSetup: vi.fn(),
  updateExpense: vi.fn(),
  updateExpensesCategories: vi.fn(),
}))

vi.mock('@/services/firebase/investment-portfolios.service', () => ({
  disconnectInvestmentPortfolio: vi.fn(),
  saveInvestmentPortfolio: vi.fn(),
}))

import { useAssetsStore } from '../../src/stores/assets-store'
import { useExpensesStore } from '../../src/stores/expenses-store'
import { useIncomeStore } from '../../src/stores/income-store'
import { useLiabilitiesStore } from '../../src/stores/liabilities-store'

const storeCases = [
  {
    name: 'assets',
    useStore: useAssetsStore,
    getConfig: mocks.getAssetsConfig,
    getCategory: mocks.getCategoryAssets,
    refreshesCategories: true,
  },
  {
    name: 'liabilities',
    useStore: useLiabilitiesStore,
    getConfig: mocks.getLiabilitiesConfig,
    getCategory: mocks.getCategoryLiabilities,
    refreshesCategories: true,
  },
  {
    name: 'income',
    useStore: useIncomeStore,
    getConfig: mocks.getIncomeConfig,
    getCategory: mocks.getCategoryIncome,
  },
  {
    name: 'expenses',
    useStore: useExpensesStore,
    getConfig: mocks.getExpensesConfig,
    getCategory: mocks.getCategoryExpenses,
  },
]

describe.each(storeCases)(
  '$name store category loading',
  ({ useStore, getConfig, getCategory, refreshesCategories }) => {
    beforeEach(() => {
      setActivePinia(createPinia())
      getConfig.mockReset()
      getCategory.mockReset()
      getConfig.mockResolvedValue({
        schemaVersion: 1,
        setupCompleted: true,
        categories: {
          first: { enabled: true },
          second: { enabled: true },
        },
      })
    })

    it('keeps every category when parallel requests finish out of order', async () => {
      const pending = new Map()
      getCategory.mockImplementation(
        (_workspaceId, categoryId) =>
          new Promise((resolve) => {
            pending.set(categoryId, resolve)
          }),
      )
      const store = useStore()

      await store.loadConfig('workspace-a')
      const firstRequest = store.loadCategory('workspace-a', 'first')
      const secondRequest = store.loadCategory('workspace-a', 'second')
      await vi.waitFor(() => expect(pending.size).toBe(2))

      pending.get('second')([{ id: 'second-item', categoryId: 'second' }])
      await secondRequest
      expect(store.categoryLoading).toBe(true)
      pending.get('first')([{ id: 'first-item', categoryId: 'first' }])
      await firstRequest

      expect(store.itemsForCategory('first')).toEqual([{ id: 'first-item', categoryId: 'first' }])
      expect(store.itemsForCategory('second')).toEqual([
        { id: 'second-item', categoryId: 'second' },
      ])
      expect(store.categoryLoading).toBe(false)
    })

    it('shares the initial config request between parallel category loads', async () => {
      let resolveConfig
      getConfig.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveConfig = resolve
        }),
      )
      getCategory.mockImplementation(async (_workspaceId, categoryId) => [
        { id: `${categoryId}-item`, categoryId },
      ])
      const store = useStore()

      const firstRequest = store.loadCategory('workspace-a', 'first')
      const secondRequest = store.loadCategory('workspace-a', 'second')
      expect(getConfig).toHaveBeenCalledTimes(1)
      resolveConfig({
        setupCompleted: true,
        categories: { first: { enabled: true }, second: { enabled: true } },
      })
      await Promise.all([firstRequest, secondRequest])

      expect(getCategory).toHaveBeenCalledTimes(2)
      expect(store.itemsForCategory('first')).toHaveLength(1)
      expect(store.itemsForCategory('second')).toHaveLength(1)
    })

    it('does not let an old workspace category load update the current workspace', async () => {
      let resolveWorkspaceA
      getConfig
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveWorkspaceA = resolve
          }),
        )
        .mockResolvedValueOnce({
          setupCompleted: true,
          categories: { first: { enabled: true } },
        })
      const store = useStore()

      const staleCategoryRequest = store.loadCategory('workspace-a', 'first')
      await store.loadConfig('workspace-b')
      resolveWorkspaceA({
        setupCompleted: true,
        categories: { first: { enabled: true } },
      })
      await staleCategoryRequest

      expect(getCategory).not.toHaveBeenCalledWith('workspace-a', 'first')
      expect(store.config).toEqual(
        expect.objectContaining({ categories: { first: { enabled: true } } }),
      )
    })

    it('ignores a category response that finishes after a workspace change', async () => {
      let resolveWorkspaceACategory
      getCategory.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveWorkspaceACategory = resolve
        }),
      )
      const store = useStore()
      await store.loadConfig('workspace-a')
      const staleCategoryRequest = store.loadCategory('workspace-a', 'first')
      await vi.waitFor(() => expect(getCategory).toHaveBeenCalledTimes(1))

      await store.loadConfig('workspace-b')
      resolveWorkspaceACategory([{ id: 'stale-item', categoryId: 'first' }])
      await staleCategoryRequest

      expect(store.itemsForCategory('first')).toEqual([])
    })

    it('forces category data without redundantly reloading config', async () => {
      getCategory.mockResolvedValue([])
      const store = useStore()

      await store.loadConfig('workspace-a')
      await Promise.all([
        store.loadCategory('workspace-a', 'first', true),
        store.loadCategory('workspace-a', 'second', true),
      ])

      expect(getConfig).toHaveBeenCalledTimes(1)
      expect(getCategory).toHaveBeenCalledTimes(2)
    })

    if (refreshesCategories) {
      it('refreshes every loaded category without resetting the loaded set', async () => {
        getCategory.mockImplementation(async (_workspaceId, categoryId) => [
          { id: `${categoryId}-item`, categoryId },
        ])
        const store = useStore()
        await Promise.all([
          store.loadCategory('workspace-a', 'first'),
          store.loadCategory('workspace-a', 'second'),
        ])

        await store.refreshLoadedCategories('workspace-a')

        expect(getConfig).toHaveBeenCalledTimes(1)
        expect(getCategory).toHaveBeenCalledTimes(4)
        expect(store.itemsForCategory('first')).toHaveLength(1)
        expect(store.itemsForCategory('second')).toHaveLength(1)
      })
    }

    it('retries the same workspace after a config load fails', async () => {
      getConfig.mockRejectedValueOnce(new Error('Temporary Firestore error'))
      const store = useStore()

      await store.loadConfig('workspace-a')
      expect(store.error).toEqual(expect.objectContaining({ message: 'Temporary Firestore error' }))

      await store.loadConfig('workspace-a')

      expect(getConfig).toHaveBeenCalledTimes(2)
      expect(store.error).toBeNull()
      expect(store.config).toEqual(expect.objectContaining({ setupCompleted: true }))
    })

    it('invalidates a previous successful load when a forced reload fails', async () => {
      const store = useStore()
      await store.loadConfig('workspace-a')
      getConfig.mockRejectedValueOnce(new Error('Temporary Firestore error'))

      await store.loadConfig('workspace-a', true)
      await store.loadConfig('workspace-a')

      expect(getConfig).toHaveBeenCalledTimes(3)
      expect(store.error).toBeNull()
    })
  },
)
