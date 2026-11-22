import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { subscribeUserSubscription } = vi.hoisted(() => ({
  subscribeUserSubscription: vi.fn(),
}))

vi.mock('@/services/firebase/subscription.service', () => ({ subscribeUserSubscription }))

import { useEntitlementsStore } from '../../src/stores/entitlements-store.js'

describe('entitlements store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    subscribeUserSubscription.mockReset()
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
    const stop = vi.fn()
    subscribeUserSubscription.mockReturnValue(stop)
    const store = useEntitlementsStore()

    store.start('user-a')
    store.reset()

    expect(stop).toHaveBeenCalledOnce()
    expect(store.entitlements.isPro).toBe(false)
    expect(store.entitlements.canUseStrategy).toBe(false)
    expect(store.ready).toBe(false)
  })
})
