import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { subscribeUserSubscription, subscribeUserTrial } = vi.hoisted(() => ({
  subscribeUserSubscription: vi.fn(),
  subscribeUserTrial: vi.fn(),
}))

vi.mock('@/services/firebase/subscription.service', () => ({
  subscribeUserSubscription,
  subscribeUserTrial,
}))

import { useEntitlementsStore } from '../../src/stores/entitlements-store.js'

describe('entitlements store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    subscribeUserSubscription.mockReset()
    subscribeUserTrial.mockReset()
    subscribeUserTrial.mockImplementation((_userId, onValue) => {
      onValue(null)
      return vi.fn()
    })
  })

  it('starts as Free and applies the server subscription projection', () => {
    subscribeUserSubscription.mockImplementation((_userId, onValue) => {
      onValue({
        plan: 'pro',
        source: 'google_play',
        status: 'active',
        entitlementActive: true,
        currentPeriodEndsAt: '2099-01-01T00:00:00.000Z',
      })
      return vi.fn()
    })
    const store = useEntitlementsStore()

    store.start('user-a')

    expect(store.ready).toBe(true)
    expect(store.entitlements.isPro).toBe(true)
    expect(store.entitlements.canUsePlan).toBe(true)
    expect(store.entitlements.canUseStrategy).toBe(true)
  })

  it('returns to Free and stops the listener on reset', () => {
    const stopSubscription = vi.fn()
    const stopTrial = vi.fn()
    subscribeUserSubscription.mockReturnValue(stopSubscription)
    subscribeUserTrial.mockReturnValue(stopTrial)
    const store = useEntitlementsStore()

    store.start('user-a')
    store.reset()

    expect(stopSubscription).toHaveBeenCalledOnce()
    expect(stopTrial).toHaveBeenCalledOnce()
    expect(store.entitlements.isPro).toBe(false)
    expect(store.entitlements.canUseStrategy).toBe(false)
    expect(store.ready).toBe(false)
  })

  it('grants and expires trial access from the separate trial record', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-01T00:00:00Z'))
    subscribeUserSubscription.mockImplementation((_userId, onValue) => {
      onValue(null)
      return vi.fn()
    })
    subscribeUserTrial.mockImplementation((_userId, onValue) => {
      onValue({
        startedAt: '2026-11-01T00:00:00Z',
        expiresAt: '2026-12-01T00:00:00Z',
      })
      return vi.fn()
    })
    const store = useEntitlementsStore()

    store.start('user-a')
    expect(store.entitlements.source).toBe('trial')
    expect(store.entitlements.trial.daysRemaining).toBe(30)

    vi.setSystemTime(new Date('2026-12-01T00:00:01Z'))
    store.refreshClock()
    expect(store.entitlements.isPro).toBe(false)
    expect(store.entitlements.trial.used).toBe(true)
    store.reset()
    vi.useRealTimers()
  })
})
