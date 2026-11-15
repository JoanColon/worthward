import { describe, expect, it } from 'vitest'
import {
  isPurchasedState,
  obfuscatedAccountId,
} from '../../src/services/google-play-subscriptions.js'

describe('Google Play subscription client helpers', () => {
  it('uses the same opaque account hash expected by the backend', async () => {
    await expect(obfuscatedAccountId('user-a')).resolves.toBe(
      'fc95297aa4f56781f0decb7d4bf59b1447f09b3611039b80188b1c6beb03ee6a',
    )
  })

  it('accepts the purchased states returned by supported plugin versions', () => {
    expect(isPurchasedState('PURCHASED')).toBe(true)
    expect(isPurchasedState('1')).toBe(true)
    expect(isPurchasedState(1)).toBe(true)
    expect(isPurchasedState('PENDING')).toBe(false)
  })
})
