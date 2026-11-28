/**
 * Verifies Google Play subscription tokens and projects their effective access into Firestore.
 */
import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import {
  GOOGLE_PLAY_SUBSCRIPTION,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  normalizeSubscription,
  workspaceEntitlementProjection,
} from '../../shared/billing/entitlements.js'
import { isDemoWorkspaceId } from '../../shared/workspaces/demo.js'

export const ANDROID_PACKAGE_NAME = 'com.worthward.app'

/** Produces the opaque account identifier sent to Google Play by the Android client. */
export function googlePlayAccountId(userId) {
  return createHash('sha256').update(String(userId)).digest('hex')
}

export function purchaseTokenHash(purchaseToken) {
  return createHash('sha256').update(String(purchaseToken)).digest('hex')
}

/**
 * Verifies one subscription against Google Play, persists it idempotently, and acknowledges it.
 */
export async function verifyGooglePlaySubscription(
  firestore,
  { publisher, userId, purchaseToken, now = new Date() },
) {
  const token = String(purchaseToken || '').trim()
  if (!userId || !token || token.length > 4096) {
    throw billingError('invalid-argument', 'A valid Google Play purchase is required', 'INVALID_TOKEN')
  }

  let purchase
  try {
    const response = await publisher.purchases.subscriptionsv2.get({
      packageName: ANDROID_PACKAGE_NAME,
      token,
    })
    purchase = response.data
  } catch (error) {
    throw billingError(
      'unavailable',
      'Google Play could not verify the subscription',
      'PLAY_VERIFICATION_FAILED',
      error,
    )
  }

  const expectedAccountId = googlePlayAccountId(userId)
  const purchaseAccountIds = [
    purchase?.externalAccountIdentifiers?.obfuscatedExternalAccountId,
    purchase?.outOfAppPurchaseContext?.expiredExternalAccountIdentifiers?.obfuscatedExternalAccountId,
  ].filter(Boolean)
  if (!purchaseAccountIds.includes(expectedAccountId)) {
    throw billingError(
      'failed-precondition',
      'The subscription does not belong to this Worthward account',
      'ACCOUNT_MISMATCH',
    )
  }

  const lineItem = matchingLineItem(purchase?.lineItems)
  if (!lineItem) {
    throw billingError(
      'failed-precondition',
      'Google Play returned a different subscription product',
      'PRODUCT_MISMATCH',
    )
  }

  const state = resolveSubscriptionState(purchase.subscriptionState, lineItem.expiryTime, now)
  const tokenHash = purchaseTokenHash(token)
  const linkedTokenHash = purchase.linkedPurchaseToken ? purchaseTokenHash(purchase.linkedPurchaseToken) : null
  const purchaseReference = firestore.collection('billingPurchases').doc(tokenHash)
  const subscriptionReference = firestore
    .collection('users')
    .doc(userId)
    .collection('private')
    .doc('subscription')
  const trialReference = firestore
    .collection('users')
    .doc(userId)
    .collection('private')
    .doc('trial')
  const expiryTime = validDate(lineItem.expiryTime)
  const basePlanId = lineItem.offerDetails?.basePlanId || null
  const subscriptionProjection = {
    plan: state.entitlementActive ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE,
    source: 'google_play',
    status: state.status,
    entitlementActive: state.entitlementActive,
    currentPeriodEndsAt: expiryTime,
    productId: GOOGLE_PLAY_SUBSCRIPTION.productId,
    basePlanId,
    purchaseTokenHash: tokenHash,
    updatedAt: FieldValue.serverTimestamp(),
  }

  const effectiveSubscription = await firestore.runTransaction(async (transaction) => {
    const ownedWorkspacesQuery = firestore.collection('workspaces').where('createdBy', '==', userId)
    const [purchaseSnapshot, currentSubscriptionSnapshot, trialSnapshot, ownedWorkspaces] =
      await Promise.all([
        transaction.get(purchaseReference),
        transaction.get(subscriptionReference),
        transaction.get(trialReference),
        transaction.get(ownedWorkspacesQuery),
      ])
    if (purchaseSnapshot.exists && purchaseSnapshot.data()?.userId !== userId) {
      throw billingError(
        'permission-denied',
        'This Google Play purchase belongs to another Worthward account',
        'TOKEN_ALREADY_CLAIMED',
      )
    }

    transaction.set(
      purchaseReference,
      {
        userId,
        provider: 'google_play',
        packageName: ANDROID_PACKAGE_NAME,
        productId: GOOGLE_PLAY_SUBSCRIPTION.productId,
        basePlanId,
        purchaseToken: token,
        purchaseTokenHash: tokenHash,
        linkedPurchaseTokenHash: linkedTokenHash,
        providerState: purchase.subscriptionState || null,
        expiryTime,
        acknowledgementState: purchase.acknowledgementState || null,
        latestOrderId: lineItem.latestSuccessfulOrderId || null,
        ...(purchaseSnapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    const currentSubscription = currentSubscriptionSnapshot.data()
    if (
      !purchaseShouldBecomeCurrent({
        currentSubscription,
        tokenHash,
        linkedTokenHash,
        expiryTime,
      })
    ) {
      return currentSubscription
    }

    transaction.set(subscriptionReference, subscriptionProjection, { merge: true })
    const entitlement = {
      ...workspaceEntitlementProjection(
        { subscription: subscriptionProjection, trial: trialSnapshot.data() },
        { now: now.getTime() },
      ),
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const workspace of ownedWorkspaces.docs.filter(
      (document) => !isDemoWorkspaceId(document.id),
    )) {
      transaction.update(workspace.ref, { entitlement })
    }
    return subscriptionProjection
  })

  if (
    state.entitlementActive &&
    purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING'
  ) {
    try {
      await publisher.purchases.subscriptions.acknowledge({
        packageName: ANDROID_PACKAGE_NAME,
        subscriptionId: GOOGLE_PLAY_SUBSCRIPTION.productId,
        token,
        requestBody: {},
      })
      await purchaseReference.update({
        acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
        acknowledgedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    } catch (error) {
      throw billingError(
        'unavailable',
        'The subscription was verified but could not be acknowledged yet',
        'ACKNOWLEDGEMENT_RETRY_REQUIRED',
        error,
      )
    }
  }

  const normalizedSubscription = normalizeSubscription(effectiveSubscription)
  return {
    ...normalizedSubscription,
    updatedAt: null,
    currentPeriodEndsAt: validDate(normalizedSubscription.currentPeriodEndsAt)?.toISOString() || null,
  }
}

function purchaseShouldBecomeCurrent({
  currentSubscription,
  tokenHash,
  linkedTokenHash,
  expiryTime,
}) {
  if (currentSubscription?.source && currentSubscription.source !== 'google_play') return false

  const currentTokenHash = currentSubscription?.purchaseTokenHash || null
  if (!currentTokenHash || currentTokenHash === tokenHash) return true
  if (linkedTokenHash === currentTokenHash) return true
  if (currentSubscription?.entitlementActive === true) return false

  return dateValue(expiryTime) > dateValue(currentSubscription?.currentPeriodEndsAt)
}

function matchingLineItem(lineItems) {
  return (lineItems || [])
    .filter((lineItem) => lineItem?.productId === GOOGLE_PLAY_SUBSCRIPTION.productId)
    .sort((left, right) => dateValue(right.expiryTime) - dateValue(left.expiryTime))[0]
}

function resolveSubscriptionState(providerState, expiryTime, now) {
  const hasRemainingAccess = dateValue(expiryTime) > now.getTime()
  const states = {
    SUBSCRIPTION_STATE_PENDING: { status: SUBSCRIPTION_STATUSES.PENDING, entitlementActive: false },
    SUBSCRIPTION_STATE_ACTIVE: {
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      entitlementActive: hasRemainingAccess,
    },
    SUBSCRIPTION_STATE_PAUSED: { status: SUBSCRIPTION_STATUSES.PAUSED, entitlementActive: false },
    SUBSCRIPTION_STATE_IN_GRACE_PERIOD: {
      status: SUBSCRIPTION_STATUSES.GRACE_PERIOD,
      entitlementActive: hasRemainingAccess,
    },
    SUBSCRIPTION_STATE_ON_HOLD: {
      status: SUBSCRIPTION_STATUSES.ON_HOLD,
      entitlementActive: false,
    },
    SUBSCRIPTION_STATE_CANCELED: {
      status: SUBSCRIPTION_STATUSES.CANCELED,
      entitlementActive: hasRemainingAccess,
    },
    SUBSCRIPTION_STATE_EXPIRED: {
      status: SUBSCRIPTION_STATUSES.EXPIRED,
      entitlementActive: false,
    },
    SUBSCRIPTION_STATE_REVOKED: {
      status: SUBSCRIPTION_STATUSES.REVOKED,
      entitlementActive: false,
    },
  }
  return states[providerState] || {
    status: SUBSCRIPTION_STATUSES.NONE,
    entitlementActive: false,
  }
}

function validDate(value) {
  const date = value ? new Date(value) : null
  return date && Number.isFinite(date.getTime()) ? date : null
}

function dateValue(value) {
  return validDate(value)?.getTime() || 0
}

function billingError(code, message, reason, cause) {
  const error = new Error(message, cause ? { cause } : undefined)
  error.code = code
  error.reason = reason
  return error
}
