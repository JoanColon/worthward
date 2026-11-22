import { describe, expect, it } from 'vitest'
import { resolveWorkspaceHasPro } from '../../../src/domain/access/workspace-entitlements.js'

describe('workspace Pro entitlement', () => {
  it('uses the workspace entitlement as its only source', () => {
    expect(
      resolveWorkspaceHasPro({
        entitlement: { tier: 'pro', expiresAt: '2099-01-01T00:00:00.000Z' },
      }),
    ).toBe(true)
    expect(resolveWorkspaceHasPro({ entitlement: { tier: 'free', expiresAt: null } })).toBe(false)
    expect(resolveWorkspaceHasPro({})).toBe(false)
  })
})
