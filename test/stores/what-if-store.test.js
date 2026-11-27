import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { getWhatIfConfig, saveWhatIfSimulation, saveWhatIfStrategy } = vi.hoisted(() => ({
  getWhatIfConfig: vi.fn(),
  saveWhatIfSimulation: vi.fn(),
  saveWhatIfStrategy: vi.fn(),
}))

vi.mock('@/services/firebase/what-if.service', () => ({
  getWhatIfConfig,
  saveWhatIfSimulation,
  saveWhatIfStrategy,
}))

import { useWhatIfStore } from '../../src/stores/what-if-store'

const config = {
  discretionaryReductionPercent: 25,
  extraMonthlySavings: 0,
  activeScenarioId: 'custom',
  scenarios: [
    {
      id: 'custom',
      name: 'Custom strategy',
      allocation: { cash: 20, invest: 60, debt: 20 },
      investmentMix: { stockMarket: { allocation: 100, annualReturnPercent: 7 } },
      horizonYears: 20,
      cashTargetMonths: 12,
      selectedLiabilityId: null,
    },
  ],
}

describe('What If store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getWhatIfConfig.mockReset().mockResolvedValue(config)
    saveWhatIfSimulation.mockReset().mockImplementation(async (_workspaceId, value) => value)
    saveWhatIfStrategy.mockReset().mockImplementation(async (_workspaceId, value) => value)
  })

  it('caches the requested configuration per workspace', async () => {
    const store = useWhatIfStore()
    await store.load('workspace-a')
    await store.load('workspace-a')

    expect(getWhatIfConfig).toHaveBeenCalledTimes(1)
    expect(store.config.discretionaryReductionPercent).toBe(25)
  })

  it('loads only Free inputs for the What If simulation page', async () => {
    const store = useWhatIfStore()
    await store.load('workspace-a', false, { includeStrategy: false })

    expect(getWhatIfConfig).toHaveBeenCalledWith('workspace-a', { includeStrategy: false })
  })

  it('persists Free inputs without writing the Pro strategy', async () => {
    const store = useWhatIfStore()
    await store.load('workspace-a', false, { includeStrategy: false })
    await store.saveSimulation('workspace-a', { discretionaryReductionPercent: 50 })

    expect(saveWhatIfSimulation).toHaveBeenCalledWith(
      'workspace-a',
      expect.objectContaining({ discretionaryReductionPercent: 50 }),
    )
    expect(saveWhatIfStrategy).not.toHaveBeenCalled()
  })

  it('loads the Pro strategy later if only Free inputs were cached', async () => {
    const store = useWhatIfStore()
    await store.load('workspace-a', false, { includeStrategy: false })
    await store.load('workspace-a')

    expect(getWhatIfConfig).toHaveBeenNthCalledWith(1, 'workspace-a', {
      includeStrategy: false,
    })
    expect(getWhatIfConfig).toHaveBeenNthCalledWith(2, 'workspace-a', {
      includeStrategy: true,
    })
  })

  it('clears the previous workspace config while the next workspace loads', async () => {
    let resolveWorkspaceB
    getWhatIfConfig.mockResolvedValueOnce(config).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWorkspaceB = resolve
      }),
    )
    const store = useWhatIfStore()
    await store.load('workspace-a')

    const workspaceBRequest = store.load('workspace-b')
    expect(store.config.discretionaryReductionPercent).toBe(0)
    resolveWorkspaceB({ ...config, discretionaryReductionPercent: 50 })
    await workspaceBRequest

    expect(store.config.discretionaryReductionPercent).toBe(50)
  })

  it('isolates an old workspace save from the current workspace state', async () => {
    let finishWorkspaceASave
    saveWhatIfSimulation.mockReturnValueOnce(
      new Promise((resolve) => {
        finishWorkspaceASave = resolve
      }),
    )
    getWhatIfConfig
      .mockResolvedValueOnce(config)
      .mockResolvedValueOnce({ ...config, discretionaryReductionPercent: 50 })
    const store = useWhatIfStore()
    await store.load('workspace-a')
    const staleSave = store.saveSimulation('workspace-a', { discretionaryReductionPercent: 10 })

    await store.load('workspace-b')
    expect(store.saving).toBe(false)
    finishWorkspaceASave()
    await staleSave
    await store.load('workspace-b')

    expect(store.config.discretionaryReductionPercent).toBe(50)
    expect(store.saving).toBe(false)
    expect(store.saveError).toBeNull()
    expect(getWhatIfConfig).toHaveBeenCalledTimes(2)
  })

  it('persists strategy inputs but not calculated results', async () => {
    const store = useWhatIfStore()
    await store.load('workspace-a')
    const scenarios = JSON.parse(JSON.stringify(store.config.scenarios))
    scenarios[0].investmentMix.stockMarket.annualReturnPercent = 6
    await store.saveStrategy('workspace-a', { scenarios })

    expect(saveWhatIfStrategy).toHaveBeenCalledWith(
      'workspace-a',
      expect.objectContaining({
        scenarios: expect.arrayContaining([
          expect.objectContaining({
            investmentMix: expect.objectContaining({
              stockMarket: expect.objectContaining({ annualReturnPercent: 6 }),
            }),
          }),
        ]),
      }),
    )
    expect(saveWhatIfStrategy.mock.calls[0][1]).not.toHaveProperty('results')
  })

  it('keeps demo simulations interactive without persistence', async () => {
    const store = useWhatIfStore()
    await store.load('worthward_demo')

    await store.saveSimulation('worthward_demo', { discretionaryReductionPercent: 40 })
    await store.saveStrategy('worthward_demo', { activeScenarioId: 'custom' })

    expect(store.config.discretionaryReductionPercent).toBe(40)
    expect(saveWhatIfSimulation).not.toHaveBeenCalled()
    expect(saveWhatIfStrategy).not.toHaveBeenCalled()
  })
})
