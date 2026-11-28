import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import {
  PRO_TRIAL_DURATION_MS,
  resolveEffectiveEntitlement,
  timestampMillis,
  workspaceEntitlementProjection,
} from '../../shared/billing/entitlements.js'
import { isDemoWorkspaceId } from '../../shared/workspaces/demo.js'

function privateReference(firestore, userId, documentId) {
  return firestore.collection('users').doc(userId).collection('private').doc(documentId)
}

async function startProTrial(
  firestore,
  { userId, emailVerified, now = new Date() },
) {
  if (!userId) throw trialError('unauthenticated', 'Authentication is required')
  if (!emailVerified) {
    throw trialError(
      'failed-precondition',
      'Verify your email address before starting the trial',
      'EMAIL_NOT_VERIFIED',
    )
  }

  const startedAt = Timestamp.fromDate(now)
  const expiresAt = Timestamp.fromMillis(startedAt.toMillis() + PRO_TRIAL_DURATION_MS)
  const subscriptionReference = privateReference(firestore, userId, 'subscription')
  const trialReference = privateReference(firestore, userId, 'trial')

  const trial = await firestore.runTransaction(async (transaction) => {
    const ownedWorkspacesQuery = firestore.collection('workspaces').where('createdBy', '==', userId)
    const [subscriptionSnapshot, trialSnapshot, ownedWorkspaces] = await Promise.all([
      transaction.get(subscriptionReference),
      transaction.get(trialReference),
      transaction.get(ownedWorkspacesQuery),
    ])
    const subscription = subscriptionSnapshot.data()
    const existingTrial = trialSnapshot.data()
    const effective = resolveEffectiveEntitlement(
      { subscription, trial: existingTrial },
      { now: startedAt.toMillis() },
    )
    if (effective.source && effective.source !== 'trial') {
      throw trialError(
        'failed-precondition',
        'Worthward Pro is already active',
        'PRO_ALREADY_ACTIVE',
      )
    }
    if (trialSnapshot.exists) {
      if (effective.source === 'trial') return existingTrial
      throw trialError(
        'failed-precondition',
        'This account has already used its Pro trial',
        'TRIAL_ALREADY_USED',
      )
    }

    const createdTrial = {
      startedAt,
      expiresAt,
      endedNoticeShownAt: null,
      createdAt: FieldValue.serverTimestamp(),
    }
    transaction.create(trialReference, createdTrial)
    const entitlement = {
      ...workspaceEntitlementProjection(
        { subscription, trial: createdTrial },
        { now: startedAt.toMillis() },
      ),
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const workspace of ownedWorkspaces.docs.filter(
      (document) => !isDemoWorkspaceId(document.id) && !document.data()?.deletionPendingAt,
    )) {
      transaction.update(workspace.ref, { entitlement })
    }
    return createdTrial
  })

  return clientTrial(trial)
}

async function claimProTrialEndNotice(firestore, { userId, now = new Date() }) {
  if (!userId) throw trialError('unauthenticated', 'Authentication is required')
  const clock = Timestamp.fromDate(now)
  const subscriptionReference = privateReference(firestore, userId, 'subscription')
  const trialReference = privateReference(firestore, userId, 'trial')

  return firestore.runTransaction(async (transaction) => {
    const [subscriptionSnapshot, trialSnapshot] = await Promise.all([
      transaction.get(subscriptionReference),
      transaction.get(trialReference),
    ])
    if (!trialSnapshot.exists) return { shouldShow: false }
    const trial = trialSnapshot.data()
    const effective = resolveEffectiveEntitlement(
      { subscription: subscriptionSnapshot.data(), trial },
      { now: clock.toMillis() },
    )
    if (
      effective.isPro ||
      timestampMillis(trial.expiresAt) > clock.toMillis() ||
      trial.endedNoticeShownAt
    ) {
      return { shouldShow: false }
    }

    transaction.update(trialReference, {
      endedNoticeShownAt: FieldValue.serverTimestamp(),
    })
    return { shouldShow: true }
  })
}

function clientTrial(trial) {
  return {
    startedAt: trial.startedAt?.toDate?.().toISOString() || null,
    expiresAt: trial.expiresAt?.toDate?.().toISOString() || null,
  }
}

function trialError(code, message, reason = 'UNKNOWN') {
  const error = new Error(message)
  error.code = code
  error.reason = reason
  return error
}

export { claimProTrialEndNotice, startProTrial }
