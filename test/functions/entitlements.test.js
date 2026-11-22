import { describe, expect, it } from 'vitest'
import {
  GOOGLE_PLAY_SUBSCRIPTION,
  normalizeSubscription,
  resolveUserEntitlements,
  resolveWorkspaceEntitlements,
  workspaceEntitlementIsPro,
  workspaceEntitlementProjection,
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
      currentPeriodEndsAt: '2099-01-01T00:00:00.000Z',
    })

    expect(entitlements).toMatchObject({
      tier: 'pro',
      isPro: true,
      canUsePlan: true,
      canUseWhatIf: true,
      canUseStrategy: true,
      canCreateAdditionalWorkspace: true,
      maximumWorkspaceMembers: 5,
    })
  })

  it('allows a Free account to create its first workspace but not another one', () => {
    const firstWorkspace = resolveUserEntitlements(null, { ownedWorkspaceCount: 0 })
    expect(firstWorkspace).toMatchObject({
      canCreateWorkspace: true,
      canUsePlan: true,
      canUseWhatIf: true,
      canUseStrategy: false,
      canUseAdvancedModels: false,
    })
    expect(resolveUserEntitlements(null, { ownedWorkspaceCount: 1 }).canCreateWorkspace).toBe(false)
  })

  it("inherits the owner's Pro capabilities without letting a guest invite members", () => {
    const workspaceEntitlement = workspaceEntitlementProjection({
      plan: 'pro',
      status: 'active',
      entitlementActive: true,
      currentPeriodEndsAt: '2099-01-01T00:00:00.000Z',
    })

    expect(
      resolveWorkspaceEntitlements({ workspaceEntitlement, isMember: true, isOwner: false }),
    ).toMatchObject({
      tier: 'pro',
      isPro: true,
      canRead: true,
      canWrite: true,
      canUsePlan: true,
      canUseStrategy: true,
      canInviteMembers: false,
    })
  })

  it('keeps ordinary workspace writes available to Free members', () => {
    const freeWorkspace = resolveWorkspaceEntitlements({
      workspaceEntitlement: { tier: 'free', expiresAt: null },
      isMember: true,
      isOwner: true,
    })
    expect(freeWorkspace).toMatchObject({
      canWrite: true,
      canUsePlan: true,
      canUseWhatIf: true,
      canUseStrategy: false,
      canUseAdvancedModels: false,
    })
    expect(resolveWorkspaceEntitlements({ isMember: false }).canWrite).toBe(false)
  })

  it('keeps Free What If available without enabling Strategy', () => {
    const capabilities = resolveWorkspaceEntitlements({
      workspaceEntitlement: { tier: 'free', expiresAt: null },
      isMember: true,
      isOwner: false,
    })

    expect(capabilities.canWrite).toBe(true)
    expect(capabilities.canUseWhatIf).toBe(true)
    expect(capabilities.canUseStrategy).toBe(false)
  })

  it('expires a workspace projection without another backend call', () => {
    const projection = workspaceEntitlementProjection(
      {
        plan: 'pro',
        entitlementActive: true,
        currentPeriodEndsAt: '2027-01-01T00:00:00.000Z',
      },
      { now: Date.UTC(2026, 0, 1) },
    )

    expect(workspaceEntitlementIsPro(projection, { now: Date.UTC(2026, 0, 1) })).toBe(true)
    expect(workspaceEntitlementIsPro(projection, { now: Date.UTC(2028, 0, 1) })).toBe(false)
  })
})
