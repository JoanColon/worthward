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
export function resolveUserEntitlements(
  value,
  { ownedWorkspaceCount = 0, now = Date.now() } = {},
) {
  const subscription = normalizeSubscription(value)
  const isPro =
    subscription.plan === SUBSCRIPTION_PLANS.PRO &&
    subscription.entitlementActive === true &&
    timestampMillis(subscription.currentPeriodEndsAt) > Number(now)
  const normalizedWorkspaceCount = Math.max(0, Number(ownedWorkspaceCount) || 0)

  return {
    tier: isPro ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE,
    isPro,
    canUsePlan: true,
    canUseWhatIf: true,
    canUseStrategy: isPro,
    canUseAdvancedModels: isPro,
    canCreateWorkspace: isPro || normalizedWorkspaceCount < 1,
    canCreateAdditionalWorkspace: isPro,
    canCreateSharedWorkspace: isPro,
    canInviteMembers: isPro,
    maximumWorkspaceMembers: isPro ? 5 : 1,
  }
}

function timestampMillis(value) {
  if (value?.toMillis) return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const timestamp = new Date(value || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

/** Creates the minimal owner-entitlement projection stored on each workspace. */
export function workspaceEntitlementProjection(value, { now = Date.now() } = {}) {
  const subscription = normalizeSubscription(value)
  const isPro = resolveUserEntitlements(subscription, { now }).isPro
  return {
    tier: isPro ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE,
    expiresAt: isPro ? subscription.currentPeriodEndsAt : null,
  }
}

/** Resolves whether a stored workspace entitlement is still active. */
export function workspaceEntitlementIsPro(value, { now = Date.now() } = {}) {
  return (
    value?.tier === SUBSCRIPTION_PLANS.PRO && timestampMillis(value.expiresAt) > Number(now)
  )
}

/** Guests inherit the owner's effective tier stored on the workspace. */
export function resolveWorkspaceEntitlements({
  workspaceEntitlement,
  isMember = false,
  isOwner = false,
  now = Date.now(),
} = {}) {
  const workspaceIsPro = workspaceEntitlementIsPro(workspaceEntitlement, { now })

  return {
    tier: workspaceIsPro ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE,
    isPro: workspaceIsPro,
    isMember,
    isOwner,
    canRead: isMember,
    canWrite: isMember,
    canUsePlan: isMember,
    canUseWhatIf: isMember,
    canUseStrategy: isMember && workspaceIsPro,
    canUseAdvancedModels: isMember && workspaceIsPro,
    canInviteMembers: isOwner && workspaceIsPro,
    maximumWorkspaceMembers: workspaceIsPro ? 5 : 1,
  }
}
