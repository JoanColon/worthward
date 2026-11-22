import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getModelConfig: vi.fn(),
  setDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  setDoc: mocks.setDoc,
}))
vi.mock('@/firebase/firebase', () => ({ auth: { currentUser: { uid: 'user-a' } } }))
vi.mock('@/services/firebase/model-config.service', () => ({
  getModelConfig: mocks.getModelConfig,
  modelConfigRef: vi.fn((workspaceId, configId) => ({ workspaceId, configId })),
}))

import {
  getWhatIfConfig,
  saveWhatIfSimulation,
  saveWhatIfStrategy,
} from '../../src/services/firebase/what-if.service'

describe('What If persistence', () => {
  beforeEach(() => {
    mocks.getModelConfig.mockReset()
    mocks.setDoc.mockReset().mockResolvedValue()
  })

  it('loads the Free simulation inputs without reading the Pro strategy', async () => {
    mocks.getModelConfig.mockResolvedValueOnce({
      discretionaryReductionPercent: 25,
      extraMonthlySavings: 100,
    })

    const config = await getWhatIfConfig('workspace-a', { includeStrategy: false })

    expect(mocks.getModelConfig).toHaveBeenCalledOnce()
    expect(mocks.getModelConfig).toHaveBeenCalledWith('workspace-a', 'whatIf')
    expect(config).toMatchObject({
      discretionaryReductionPercent: 25,
      extraMonthlySavings: 100,
    })
  })

  it('loads the Free inputs and Pro strategy together when both cards need them', async () => {
    mocks.getModelConfig.mockResolvedValueOnce({
      discretionaryReductionPercent: 25,
      extraMonthlySavings: 100,
    })
    mocks.getModelConfig.mockResolvedValueOnce({
      activeScenarioId: 'custom',
      scenarios: [
        {
          id: 'custom',
          name: 'Custom',
          allocation: { cash: 10, invest: 90, debt: 0 },
          investmentMix: { stockMarket: { allocation: 100, annualReturnPercent: 6 } },
        },
      ],
    })

    const config = await getWhatIfConfig('workspace-a')

    expect(config.discretionaryReductionPercent).toBe(25)
    expect(config.activeScenarioId).toBe('custom')
  })

  it('writes only the Free simulation inputs to their document', async () => {
    await saveWhatIfSimulation('workspace-a', {
      discretionaryReductionPercent: 25,
      extraMonthlySavings: 100,
    })

    expect(mocks.setDoc).toHaveBeenCalledWith(
      { workspaceId: 'workspace-a', configId: 'whatIf' },
      {
        schemaVersion: 2,
        discretionaryReductionPercent: 25,
        extraMonthlySavings: 100,
        updatedAt: 'server-timestamp',
        updatedBy: 'user-a',
      },
    )
  })

  it('writes strategy changes to the Rules-protected Pro document', async () => {
    await saveWhatIfStrategy('workspace-a', {
      activeScenarioId: 'default',
      scenarios: [
        {
          id: 'default',
          name: 'Balanced',
          allocation: { cash: 20, invest: 60, debt: 20 },
          investmentMix: { stockMarket: { allocation: 100, annualReturnPercent: 6 } },
        },
      ],
    })

    expect(mocks.setDoc).toHaveBeenCalledWith(
      { workspaceId: 'workspace-a', configId: 'whatIfStrategies' },
      expect.objectContaining({
        schemaVersion: 2,
        activeScenarioId: 'default',
        updatedBy: 'user-a',
      }),
    )
  })
})
