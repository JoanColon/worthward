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
export const PRO_TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000

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
    source: ['google_play', 'admin'].includes(value.source) ? value.source : null,
    status: VALID_STATUSES.has(value.status) ? value.status : SUBSCRIPTION_STATUSES.NONE,
    entitlementActive: value.entitlementActive === true,
    currentPeriodEndsAt: value.currentPeriodEndsAt || null,
    productId: typeof value.productId === 'string' ? value.productId : null,
    basePlanId: typeof value.basePlanId === 'string' ? value.basePlanId : null,
    updatedAt: value.updatedAt || null,
  }
}

export function defaultTrial() {
  return {
    startedAt: null,
    expiresAt: null,
    endedNoticeShownAt: null,
  }
}

export function normalizeTrial(value) {
  const trial = defaultTrial()
  if (!value || typeof value !== 'object') return trial

  return {
    startedAt: value.startedAt || null,
    expiresAt: value.expiresAt || null,
    endedNoticeShownAt: value.endedNoticeShownAt || null,
  }
}

/** Resolves the winning source of Pro without mixing provider and trial records. */
export function resolveEffectiveEntitlement(value, { now = Date.now() } = {}) {
  const isComposite =
    value &&
    typeof value === 'object' &&
    (Object.hasOwn(value, 'subscription') || Object.hasOwn(value, 'trial'))
  const input = isComposite ? value : { subscription: value }
  const subscription = normalizeSubscription(input.subscription)
  const trial = normalizeTrial(input.trial)
  const clock = Number(now)
  const subscriptionIsPro =
    subscription.plan === SUBSCRIPTION_PLANS.PRO &&
    subscription.entitlementActive === true &&
    timestampMillis(subscription.currentPeriodEndsAt) > clock
  const trialIsActive =
    timestampMillis(trial.startedAt) > 0 && timestampMillis(trial.expiresAt) > clock

  if (subscriptionIsPro) {
    return {
      tier: SUBSCRIPTION_PLANS.PRO,
      isPro: true,
      source: subscription.source || 'admin',
      expiresAt: subscription.currentPeriodEndsAt,
      subscription,
      trial,
    }
  }
  if (trialIsActive) {
    return {
      tier: SUBSCRIPTION_PLANS.PRO,
      isPro: true,
      source: 'trial',
      expiresAt: trial.expiresAt,
      subscription,
      trial,
    }
  }
  return {
    tier: SUBSCRIPTION_PLANS.FREE,
    isPro: false,
    source: null,
    expiresAt: null,
    subscription,
    trial,
  }
}

/** Resolves account-level capabilities without depending on a billing provider. */
export function resolveUserEntitlements(
  value,
  { ownedWorkspaceCount = 0, now = Date.now() } = {},
) {
  const effective = resolveEffectiveEntitlement(value, { now })
  const isPro = effective.isPro
  const trialStartedAt = timestampMillis(effective.trial.startedAt)
  const trialExpiresAt = timestampMillis(effective.trial.expiresAt)
  let trialDaysRemaining = 0
  if (effective.source === 'trial') {
    trialDaysRemaining = Math.max(
      1,
      Math.ceil((trialExpiresAt - Number(now)) / (24 * 60 * 60 * 1000)),
    )
  }
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
    source: effective.source,
    expiresAt: effective.expiresAt,
    trial: {
      used: trialStartedAt > 0,
      eligible: trialStartedAt === 0 && !isPro,
      active: effective.source === 'trial',
      startedAt: effective.trial.startedAt,
      expiresAt: effective.trial.expiresAt,
      endedNoticeShown: Boolean(effective.trial.endedNoticeShownAt),
      daysRemaining: trialDaysRemaining,
    },
  }
}

export function timestampMillis(value) {
  if (value?.toMillis) return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const timestamp = new Date(value || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

/** Creates the minimal owner-entitlement projection stored on each workspace. */
export function workspaceEntitlementProjection(value, { now = Date.now() } = {}) {
  const effective = resolveEffectiveEntitlement(value, { now })
  return {
    tier: effective.tier,
    expiresAt: effective.expiresAt,
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
