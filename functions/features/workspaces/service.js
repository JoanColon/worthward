/**
 * Workspace persistence service. It manages secure invitation tokens, membership changes, settings validation, and recursive workspace deletion.
 */
import crypto from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import {
  resolveUserEntitlements,
  workspaceEntitlementProjection,
} from '../../shared/billing/entitlements.js'
import { assertMutableWorkspaceId } from '../../shared/workspaces/demo.js'

// Workspace membership, invitations and deletion are persisted together in this feature service.
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const WORKSPACE_NAME_MAX_LENGTH = 80

async function createWorkspace(firestore, { userId, displayName = '', name }) {
  const normalizedName = String(name || '').trim()
  if (!normalizedName || normalizedName.length > WORKSPACE_NAME_MAX_LENGTH) {
    throw workspaceError('invalid-argument', 'A valid workspace name is required')
  }
  const workspaceReference = firestore.collection('workspaces').doc()
  let workspace
  await firestore.runTransaction(async (transaction) => {
    const ownedWorkspaces = await transaction.get(
      firestore.collection('workspaces').where('createdBy', '==', userId),
    )
    const [subscription, trial] = await Promise.all([
      transaction.get(
        firestore.collection('users').doc(userId).collection('private').doc('subscription'),
      ),
      transaction.get(
        firestore.collection('users').doc(userId).collection('private').doc('trial'),
      ),
    ])
    const entitlementInput = { subscription: subscription.data(), trial: trial.data() }
    const ownedWorkspaceCount = ownedWorkspaces.docs.filter(
      (document) => !document.data()?.deletionPendingAt,
    ).length
    const capabilities = resolveUserEntitlements(entitlementInput, { ownedWorkspaceCount })
    if (!capabilities.canCreateWorkspace) {
      throw workspaceError('permission-denied', 'Worthward Pro is required for another workspace')
    }

    workspace = {
      name: normalizedName,
      type: 'personal',
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isPrimaryWorkspace: ownedWorkspaceCount === 0,
      entitlement: workspaceEntitlementProjection(entitlementInput),
      milestoneTracking: { status: 'setup' },
      currency: 'EUR',
      memberIds: [userId],
      members: {
        [userId]: {
          displayName: String(displayName || '').trim().slice(0, 80),
          role: 'owner',
          joinedAt: FieldValue.serverTimestamp(),
        },
      },
    }
    transaction.create(workspaceReference, workspace)
  })
  return {
    id: workspaceReference.id,
    name: workspace.name,
    type: workspace.type,
    createdBy: workspace.createdBy,
    isPrimaryWorkspace: workspace.isPrimaryWorkspace,
    entitlement: workspace.entitlement,
    milestoneTracking: workspace.milestoneTracking,
    currency: workspace.currency,
    memberIds: workspace.memberIds,
    members: {
      [userId]: { ...workspace.members[userId], joinedAt: null },
    },
  }
}

/**
 * Creates a service error carrying a Firebase-compatible code.
 */
function workspaceError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

/**
 * Generates a cryptographically secure URL-safe invitation token.
 */
function createInviteToken() {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Derives the non-reversible invitation document ID from its secret token.
 */
function inviteDocumentId(token) {
  const normalizedToken = String(token || '').trim()
  if (!INVITE_TOKEN_PATTERN.test(normalizedToken)) {
    throw workspaceError('invalid-argument', 'A valid invitation token is required')
  }
  return crypto.createHash('sha256').update(normalizedToken).digest('hex')
}

/**
 * Reports whether an invitation has expired at the supplied clock value.
 */
function inviteHasExpired(invite, now) {
  return !invite?.expiresAt || invite.expiresAt.toMillis() <= now
}

/**
 * Creates a time-limited invitation whose secret token is stored only as a hash.
 */
async function createWorkspaceInvite(firestore, { workspaceId, userId, now = Date.now() }) {
  assertMutableWorkspaceId(workspaceId)
  const token = createInviteToken()
  const inviteReference = firestore.collection('workspaceInvites').doc(inviteDocumentId(token))
  const workspaceReference = firestore.collection('workspaces').doc(workspaceId)
  const expiresAt = Timestamp.fromMillis(now + INVITE_TTL_MS)

  await firestore.runTransaction(async (transaction) => {
    const workspaceSnapshot = await transaction.get(workspaceReference)
    const workspace = workspaceSnapshot.data()

    if (!workspaceSnapshot.exists || workspace?.deletionPendingAt) {
      throw workspaceError('not-found', 'The workspace does not exist')
    }
    if (!isWorkspaceMember(workspace, userId)) {
      throw workspaceError('permission-denied', 'Workspace membership is required')
    }

    transaction.create(inviteReference, {
      workspaceId,
      role: 'member',
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      status: 'pending',
    })
  })

  return { token, expiresAt: expiresAt.toMillis() }
}

/**
 * Loads invitation details while enforcing status, expiry, and workspace availability.
 */
async function getWorkspaceInvite(firestore, { token, userId = null, now = Date.now() }) {
  const inviteReference = firestore.collection('workspaceInvites').doc(inviteDocumentId(token))
  const inviteSnapshot = await inviteReference.get()

  if (!inviteSnapshot.exists) {
    throw workspaceError('not-found', 'The invitation does not exist')
  }

  const invite = inviteSnapshot.data()
  assertMutableWorkspaceId(invite.workspaceId)
  if (invite.status === 'accepted') {
    if (!userId || invite.acceptedBy !== userId) {
      throw workspaceError('failed-precondition', 'The invitation has already been used')
    }
  } else if (invite.status !== 'pending') {
    throw workspaceError('failed-precondition', 'The invitation is no longer available')
  } else if (inviteHasExpired(invite, now)) {
    throw workspaceError('deadline-exceeded', 'The invitation has expired')
  }

  const workspaceSnapshot = await firestore.collection('workspaces').doc(invite.workspaceId).get()
  const workspace = workspaceSnapshot.data()
  if (!workspaceSnapshot.exists || workspace?.deletionPendingAt) {
    throw workspaceError('not-found', 'The workspace does not exist')
  }

  return {
    workspaceId: workspaceSnapshot.id,
    workspaceName: workspace.name || '',
    status: invite.status,
    expiresAt: invite.expiresAt?.toMillis() || null,
  }
}

/**
 * Atomically adds the user to the workspace and marks the invitation accepted.
 */
async function acceptWorkspaceInvite(
  firestore,
  { token, userId, displayName = '', photoURL = '', now = Date.now(), maximumMembers = 5 },
) {
  const inviteReference = firestore.collection('workspaceInvites').doc(inviteDocumentId(token))

  return firestore.runTransaction(async (transaction) => {
    const inviteSnapshot = await transaction.get(inviteReference)
    if (!inviteSnapshot.exists) {
      throw workspaceError('not-found', 'The invitation does not exist')
    }

    const invite = inviteSnapshot.data()
    assertMutableWorkspaceId(invite.workspaceId)
    if (invite.status === 'accepted') {
      if (invite.acceptedBy === userId) {
        return { status: 'joined', workspaceId: invite.workspaceId }
      }
      throw workspaceError('failed-precondition', 'The invitation has already been used')
    }
    if (invite.status !== 'pending') {
      throw workspaceError('failed-precondition', 'The invitation is no longer available')
    }
    if (inviteHasExpired(invite, now)) {
      throw workspaceError('deadline-exceeded', 'The invitation has expired')
    }

    const workspaceReference = firestore.collection('workspaces').doc(invite.workspaceId)
    const workspaceSnapshot = await transaction.get(workspaceReference)
    const workspace = workspaceSnapshot.data()
    if (!workspaceSnapshot.exists || workspace?.deletionPendingAt) {
      throw workspaceError('not-found', 'The workspace does not exist')
    }

    const existingMember = workspace.members?.[userId]
    if (!existingMember && (workspace.memberIds || []).length >= maximumMembers) {
      throw workspaceError('resource-exhausted', 'The workspace member limit has been reached')
    }
    const member = existingMember || {
      displayName,
      photoURL,
      role: 'member',
      joinedAt: FieldValue.serverTimestamp(),
    }
    const memberIds = [...new Set([...(workspace.memberIds || []), userId])]

    transaction.update(workspaceReference, {
      memberIds,
      members: { ...(workspace.members || {}), [userId]: member },
      type: memberIds.length > 1 ? 'shared' : workspace.type || 'personal',
      updatedAt: FieldValue.serverTimestamp(),
    })
    transaction.update(inviteReference, {
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: FieldValue.serverTimestamp(),
    })

    return { status: 'joined', workspaceId: workspaceReference.id }
  })
}

/**
 * Validates and updates workspace currency and all member display names transactionally.
 */
async function updateWorkspaceSettings(
  firestore,
  { workspaceId, userId, currency, memberNames },
) {
  assertMutableWorkspaceId(workspaceId)
  const workspaceReference = firestore.collection('workspaces').doc(workspaceId)
  return firestore.runTransaction(async (transaction) => {
    const workspaceSnapshot = await transaction.get(workspaceReference)
    const workspace = workspaceSnapshot.data()
    if (!workspaceSnapshot.exists || workspace?.deletionPendingAt) {
      throw workspaceError('not-found', 'The workspace does not exist')
    }
    if (!isWorkspaceMember(workspace, userId)) {
      throw workspaceError('permission-denied', 'Workspace membership is required')
    }

    const normalizedCurrency = String(currency || '').trim().toUpperCase()
    if (!CURRENCY_PATTERN.test(normalizedCurrency)) {
      throw workspaceError('invalid-argument', 'A valid workspace currency is required')
    }
    const names = memberNames && typeof memberNames === 'object' ? memberNames : {}
    const memberIds = [...new Set((workspace.memberIds || []).filter(Boolean))]
    if (
      Object.keys(names).length !== memberIds.length ||
      Object.keys(names).some((memberId) => !memberIds.includes(memberId))
    ) {
      throw workspaceError('invalid-argument', 'Names are required for every workspace member')
    }

    const members = { ...(workspace.members || {}) }
    for (const memberId of memberIds) {
      const displayName = String(names[memberId] || '').trim()
      if (!displayName || displayName.length > 80) {
        throw workspaceError('invalid-argument', 'Each member needs a valid name')
      }
      members[memberId] = { ...(members[memberId] || {}), displayName }
    }

    transaction.update(workspaceReference, {
      currency: normalizedCurrency,
      members,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { currency: normalizedCurrency, members }
  })
}

/**
 * Marks a workspace for deletion and recursively removes its invitations and data.
 */
async function deleteWorkspaceData(firestore, workspaceReference) {
  assertMutableWorkspaceId(workspaceReference.id)
  await workspaceReference.update({
    deletionPendingAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const invites = await firestore
    .collection('workspaceInvites')
    .where('workspaceId', '==', workspaceReference.id)
    .get()

  for (const invite of invites.docs) {
    await firestore.recursiveDelete(invite.ref)
  }

  await firestore.recursiveDelete(workspaceReference)

  return {
    status: 'deleted',
    workspaceId: workspaceReference.id,
    deletedInvites: invites.size,
  }
}

/**
 * Reports whether workspace owner satisfies the required condition.
 */
function isWorkspaceOwner(workspace, userId) {
  return workspace?.members?.[userId]?.role === 'owner'
}

/**
 * Reports whether workspace member satisfies the required condition.
 */
function isWorkspaceMember(workspace, userId) {
  return workspace?.memberIds?.includes(userId) === true
}

export {
  acceptWorkspaceInvite,
  createWorkspace,
  createWorkspaceInvite,
  deleteWorkspaceData,
  getWorkspaceInvite,
  inviteDocumentId,
  isWorkspaceMember,
  isWorkspaceOwner,
  updateWorkspaceSettings,
}
