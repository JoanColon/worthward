import { describe, expect, it } from 'vitest'
import {
  GOOGLE_PLAY_SUBSCRIPTION,
  normalizeSubscription,
  resolveUserEntitlements,
  resolveWorkspaceEntitlements,
} from '../../functions/shared/billing/entitlements.js'

describe('subscription entitlements', () => {
  it('reserves one subscription product with an annual base plan', () => {
    expect(GOOGLE_PLAY_SUBSCRIPTION).toEqual({
      productId: 'worthward_pro',
      basePlanIds: { annual: 'annual' },
    })
  })

  it('defaults a missing or malformed subscription to Free', () => {
    expect(normalizeSubscription(null)).toMatchObject({
      plan: 'free',
      status: 'none',
      entitlementActive: false,
    })
    expect(resolveUserEntitlements({ plan: 'pro', entitlementActive: false }).isPro).toBe(false)
  })

  it('preserves provider states that do not grant access', () => {
    expect(normalizeSubscription({ status: 'pending' }).status).toBe('pending')
    expect(normalizeSubscription({ status: 'paused' }).status).toBe('paused')
  })

  it('only grants Pro when the backend projection activates the entitlement', () => {
    const entitlements = resolveUserEntitlements({
      plan: 'pro',
      source: 'google_play',
      status: 'active',
      entitlementActive: true,
    })

    expect(entitlements).toMatchObject({
      tier: 'pro',
      isPro: true,
      canUsePlan: true,
      canUseWhatIf: true,
      canCreateAdditionalWorkspace: true,
      maximumWorkspaceMembers: 5,
    })
  })

  it('allows a Free account to create its first workspace but not another one', () => {
    expect(resolveUserEntitlements(null, { ownedWorkspaceCount: 0 }).canCreateWorkspace).toBe(true)
    expect(resolveUserEntitlements(null, { ownedWorkspaceCount: 1 }).canCreateWorkspace).toBe(false)
  })

  it("inherits the owner's Pro capabilities without letting a guest invite members", () => {
    const ownerSubscription = { plan: 'pro', status: 'active', entitlementActive: true }

    expect(
      resolveWorkspaceEntitlements({ ownerSubscription, isMember: true, isOwner: false }),
    ).toMatchObject({
      tier: 'pro',
      canRead: true,
      canWrite: true,
      canUsePlan: true,
      canInviteMembers: false,
    })
  })

  it('keeps only the primary personal workspace editable for a Free owner', () => {
    expect(
      resolveWorkspaceEntitlements({
        ownerSubscription: null,
        isMember: true,
        isOwner: true,
        isPrimaryWorkspace: true,
      }).canWrite,
    ).toBe(true)
    expect(
      resolveWorkspaceEntitlements({
        ownerSubscription: null,
        isMember: true,
        isOwner: true,
        isPrimaryWorkspace: true,
        isSharedWorkspace: true,
      }).canWrite,
    ).toBe(false)
  })
})
