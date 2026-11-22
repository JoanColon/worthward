/**
 * Firebase callable boundaries for workspace invitations, membership settings, and deletion. It handles authentication and converts service errors into stable callable errors.
 */
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import {
  assertWorkspaceCapability,
  getWorkspaceAccess,
  promotePrimaryWorkspace,
} from './access.js'
import {
  acceptWorkspaceInvite as acceptWorkspaceInviteData,
  createWorkspaceInvite as createWorkspaceInviteData,
  createWorkspace as createWorkspaceData,
  deleteWorkspaceData,
  getWorkspaceInvite as getWorkspaceInviteData,
  isWorkspaceOwner,
  updateWorkspaceSettings as updateWorkspaceSettingsData,
} from './service.js'

/**
 * Converts service failures into stable Firebase callable error codes.
 */
function callableError(error) {
  if (error instanceof HttpsError) return error
  const supportedCodes = new Set([
    'deadline-exceeded',
    'failed-precondition',
    'invalid-argument',
    'not-found',
    'permission-denied',
    'resource-exhausted',
  ])
  return new HttpsError(
    supportedCodes.has(error?.code) ? error.code : 'internal',
    error?.message || 'The operation could not be completed',
  )
}

/**
 * Creates a time-limited invitation whose secret token is stored only as a hash.
 */
const createWorkspaceInvite = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')

  const workspaceId = String(request.data?.workspaceId || '').trim()
  if (!workspaceId) throw new HttpsError('invalid-argument', 'A workspace is required')

  try {
    await assertWorkspaceCapability(
      getFirestore(),
      { workspaceId, userId: request.auth.uid },
      'canInviteMembers',
    )
    return await createWorkspaceInviteData(getFirestore(), {
      workspaceId,
      userId: request.auth.uid,
    })
  } catch (error) {
    throw callableError(error)
  }
})

/**
 * Loads invitation details while enforcing status, expiry, and workspace availability.
 */
const getWorkspaceInvite = onCall({ region: 'europe-west1' }, async (request) => {
  try {
    return await getWorkspaceInviteData(getFirestore(), {
      token: request.data?.token,
      userId: request.auth?.uid || null,
    })
  } catch (error) {
    throw callableError(error)
  }
})

/**
 * Atomically adds the user to the workspace and marks the invitation accepted.
 */
const acceptWorkspaceInvite = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')

  try {
    const firestore = getFirestore()
    const invite = await getWorkspaceInviteData(firestore, {
      token: request.data?.token,
      userId: request.auth.uid,
    })
    const access = await getWorkspaceAccess(firestore, {
      workspaceId: invite.workspaceId,
      userId: request.auth.uid,
    })
    if (!access.capabilities.isPro) {
      throw new HttpsError('permission-denied', 'The workspace owner needs Worthward Pro')
    }
    return await acceptWorkspaceInviteData(firestore, {
      token: request.data?.token,
      userId: request.auth.uid,
      displayName: request.auth.token.name || request.auth.token.email || '',
      photoURL: request.auth.token.picture || '',
      maximumMembers: access.capabilities.maximumWorkspaceMembers,
    })
  } catch (error) {
    throw callableError(error)
  }
})

const createWorkspace = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')
  try {
    return await createWorkspaceData(getFirestore(), {
      userId: request.auth.uid,
      displayName: request.auth.token.name || request.auth.token.email || '',
      name: request.data?.name,
    })
  } catch (error) {
    throw callableError(error)
  }
})

/**
 * Verifies workspace ownership and delegates recursive workspace deletion to the service.
 */
const deleteWorkspace = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')

  const workspaceId = String(request.data?.workspaceId || '').trim()
  if (!workspaceId) throw new HttpsError('invalid-argument', 'A workspace is required')

  const firestore = getFirestore()
  const workspaceReference = firestore.collection('workspaces').doc(workspaceId)
  const workspaceSnapshot = await workspaceReference.get()

  if (!workspaceSnapshot.exists) {
    throw new HttpsError('not-found', 'The workspace does not exist')
  }
  if (!isWorkspaceOwner(workspaceSnapshot.data(), request.auth.uid)) {
    throw new HttpsError('permission-denied', 'Workspace ownership is required')
  }

  const result = await deleteWorkspaceData(firestore, workspaceReference)
  await promotePrimaryWorkspace(firestore, request.auth.uid)
  return result
})

/**
 * Validates and updates workspace currency and all member display names transactionally.
 */
const updateWorkspaceSettings = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')

  try {
    const workspaceId = String(request.data?.workspaceId || '').trim()
    await assertWorkspaceCapability(
      getFirestore(),
      { workspaceId, userId: request.auth.uid },
      'canWrite',
    )
    return await updateWorkspaceSettingsData(getFirestore(), {
      workspaceId,
      userId: request.auth.uid,
      currency: request.data?.currency,
      memberNames: request.data?.memberNames,
    })
  } catch (error) {
    throw callableError(error)
  }
})

export {
  acceptWorkspaceInvite,
  createWorkspace,
  createWorkspaceInvite,
  deleteWorkspace,
  getWorkspaceInvite,
  updateWorkspaceSettings,
}
