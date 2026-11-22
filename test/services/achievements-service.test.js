import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  batch: {
    commit: vi.fn(),
    delete: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  },
  getDocs: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...segments) => ({ path: segments.join('/') })),
  doc: vi.fn((_db, ...segments) => ({ path: segments.join('/') })),
  getDocs: mocks.getDocs,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  writeBatch: vi.fn(() => mocks.batch),
}))
vi.mock('@/firebase/firebase', () => ({ db: {} }))

import {
  activateMilestoneTracking,
  confirmationIsDue,
  MILESTONE_CONFIRMATION_DELAY_MS,
  syncMilestoneAchievements,
} from '@/services/firebase/achievements.service'

describe('achievements client service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.batch.commit.mockResolvedValue()
  })

  it('only confirms a pending milestone after 24 hours', () => {
    const qualifiedAt = Date.UTC(2026, 9, 18, 10)
    expect(confirmationIsDue(qualifiedAt, qualifiedAt + MILESTONE_CONFIRMATION_DELAY_MS - 1)).toBe(
      false,
    )
    expect(confirmationIsDue(qualifiedAt, qualifiedAt + MILESTONE_CONFIRMATION_DELAY_MS)).toBe(true)
  })

  it('activates tracking and stores the reached baseline in one batch', async () => {
    const progress = [{ id: 'safety_3_months', family: 'safety', reached: true, currentValue: 4 }]
    const result = await activateMilestoneTracking('workspace-a', progress, [
      { id: 'obsolete', milestoneId: 'obsolete' },
    ])

    expect(mocks.batch.delete).toHaveBeenCalledWith({
      path: 'workspaces/workspace-a/achievements/obsolete',
    })
    expect(mocks.batch.set).toHaveBeenCalledWith(
      { path: 'workspaces/workspace-a/achievements/safety_3_months' },
      expect.objectContaining({ milestoneId: 'safety_3_months', status: 'achieved' }),
    )
    expect(mocks.batch.update).toHaveBeenCalledWith(
      { path: 'workspaces/workspace-a' },
      expect.objectContaining({ milestoneTracking: expect.objectContaining({ status: 'active' }) }),
    )
    expect(mocks.batch.commit).toHaveBeenCalledOnce()
    expect(result.achievements).toMatchObject([
      { milestoneId: 'safety_3_months', status: 'achieved' },
    ])
  })

  it('writes only changed achievements', async () => {
    const progress = [
      { id: 'safety_3_months', family: 'safety', reached: true, currentValue: 4 },
      { id: 'safety_6_months', family: 'safety', reached: false, currentValue: 4 },
    ]
    const result = await syncMilestoneAchievements('workspace-a', progress, [
      { id: 'safety_6_months', milestoneId: 'safety_6_months', status: 'pending' },
    ])

    expect(mocks.batch.set).toHaveBeenCalledOnce()
    expect(mocks.batch.delete).toHaveBeenCalledOnce()
    expect(mocks.batch.commit).toHaveBeenCalledOnce()
    expect(result).toMatchObject([{ milestoneId: 'safety_3_months', status: 'pending' }])
  })

  it('does not write when achievement state is unchanged', async () => {
    const achievement = {
      id: 'safety_3_months',
      milestoneId: 'safety_3_months',
      status: 'achieved',
    }
    const result = await syncMilestoneAchievements(
      'workspace-a',
      [{ id: 'safety_3_months', reached: true, currentValue: 4 }],
      [achievement],
    )

    expect(mocks.batch.commit).not.toHaveBeenCalled()
    expect(result).toEqual([achievement])
  })

  it('confirms a due pending achievement locally', async () => {
    const qualifiedAt = Date.UTC(2026, 9, 18, 10)
    const result = await syncMilestoneAchievements(
      'workspace-a',
      [{ id: 'safety_3_months', reached: true, currentValue: 4 }],
      [{ id: 'safety_3_months', milestoneId: 'safety_3_months', status: 'pending', qualifiedAt }],
      qualifiedAt + MILESTONE_CONFIRMATION_DELAY_MS,
    )

    expect(mocks.batch.update).toHaveBeenCalledWith(
      { path: 'workspaces/workspace-a/achievements/safety_3_months' },
      expect.objectContaining({ status: 'achieved' }),
    )
    expect(result[0].status).toBe('achieved')
  })
})
