/**
 * Provider-independent subscription and capability rules shared by the SPA and backend.
 * Purchase verification must set entitlementActive; clients never infer Pro from provider data.
 */

export const GOOGLE_PLAY_SUBSCRIPTION = Object.freeze({
  productId: 'worthward_pro',
  basePlanIds: Object.freeze({ annual: 'annual' }),
})

export const SUBSCRIPTION_PLANS = Object.freeze({
  FREE: 'free',
  PRO: 'pro',
})

export const SUBSCRIPTION_STATUSES = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  ACTIVE: 'active',
  GRACE_PERIOD: 'grace_period',
  ON_HOLD: 'on_hold',
  PAUSED: 'paused',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
})

const VALID_STATUSES = new Set(Object.values(SUBSCRIPTION_STATUSES))

export function defaultSubscription() {
  return {
    plan: SUBSCRIPTION_PLANS.FREE,
    source: null,
    status: SUBSCRIPTION_STATUSES.NONE,
    entitlementActive: false,
    currentPeriodEndsAt: null,
    productId: null,
    basePlanId: null,
    updatedAt: null,
  }
}

/** Returns a complete client-safe subscription projection. */
export function normalizeSubscription(value) {
  const subscription = defaultSubscription()
  if (!value || typeof value !== 'object') return subscription

  return {
    ...subscription,
    plan:
      value.plan === SUBSCRIPTION_PLANS.PRO ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE,
    source: value.source === 'google_play' ? value.source : null,
    status: VALID_STATUSES.has(value.status) ? value.status : SUBSCRIPTION_STATUSES.NONE,
    entitlementActive: value.entitlementActive === true,
    currentPeriodEndsAt: value.currentPeriodEndsAt || null,
    productId: typeof value.productId === 'string' ? value.productId : null,
    basePlanId: typeof value.basePlanId === 'string' ? value.basePlanId : null,
    updatedAt: value.updatedAt || null,
  }
}

/** Resolves account-level capabilities without depending on a billing provider. */
export function resolveUserEntitlements(value, { ownedWorkspaceCount = 0 } = {}) {
  const subscription = normalizeSubscription(value)
  const isPro =
    subscription.plan === SUBSCRIPTION_PLANS.PRO && subscription.entitlementActive === true
  const normalizedWorkspaceCount = Math.max(0, Number(ownedWorkspaceCount) || 0)

  return {
    tier: isPro ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE,
    isPro,
    canUsePlan: isPro,
    canUseWhatIf: isPro,
    canUseAdvancedModels: isPro,
    canCreateWorkspace: isPro || normalizedWorkspaceCount < 1,
    canCreateAdditionalWorkspace: isPro,
    canCreateSharedWorkspace: isPro,
    canInviteMembers: isPro,
    maximumWorkspaceMembers: isPro ? 5 : 1,
  }
}

/** Guests inherit the owner's effective tier inside a workspace. */
export function resolveWorkspaceEntitlements({
  ownerSubscription,
  isMember = false,
  isOwner = false,
  isPrimaryWorkspace = false,
  isSharedWorkspace = false,
} = {}) {
  const ownerEntitlements = resolveUserEntitlements(ownerSubscription)
  const workspaceIsPro = ownerEntitlements.isPro
  const freeWorkspaceIsEditable = isOwner && isPrimaryWorkspace && !isSharedWorkspace

  return {
    tier: workspaceIsPro ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE,
    isMember,
    isOwner,
    canRead: isMember,
    canWrite: isMember && (workspaceIsPro || freeWorkspaceIsEditable),
    canUsePlan: isMember && workspaceIsPro,
    canUseWhatIf: isMember && workspaceIsPro,
    canUseAdvancedModels: isMember && workspaceIsPro,
    canInviteMembers: isOwner && workspaceIsPro,
    maximumWorkspaceMembers: workspaceIsPro ? 5 : 1,
  }
}
