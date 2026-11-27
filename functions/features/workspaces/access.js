import { resolveWorkspaceEntitlements } from '../../shared/billing/entitlements.js'
import { isDemoWorkspaceId } from '../../shared/workspaces/demo.js'

function workspaceOwnerId(workspace = {}) {
  return Object.entries(workspace.members || {}).find(([, member]) => member?.role === 'owner')?.[0] || null
}

async function getWorkspaceAccess(firestore, { workspaceId, userId }) {
  const workspaceReference = firestore.collection('workspaces').doc(workspaceId)
  const workspaceSnapshot = await workspaceReference.get()
  const workspace = workspaceSnapshot.data()
  if (!workspaceSnapshot.exists || workspace?.deletionPendingAt) {
    throw accessError('not-found', 'The workspace does not exist')
  }
  if (!workspace.entitlement) {
    throw accessError('failed-precondition', 'The workspace entitlement is missing')
  }

  if (isDemoWorkspaceId(workspaceId)) {
    return {
      workspaceReference,
      workspaceSnapshot,
      workspace,
      ownerId: workspaceOwnerId(workspace),
      capabilities: {
        tier: 'pro',
        isPro: true,
        isMember: false,
        isOwner: false,
        canRead: true,
        canWrite: false,
        canUsePlan: true,
        canUseWhatIf: true,
        canUseStrategy: true,
        canUseAdvancedModels: true,
        canInviteMembers: false,
        maximumWorkspaceMembers: 0,
      },
    }
  }

  const ownerId = workspaceOwnerId(workspace)
  const isMember = workspace.memberIds?.includes(userId) === true
  const isOwner = ownerId === userId
  const capabilities = resolveWorkspaceEntitlements({
    workspaceEntitlement: workspace.entitlement,
    isMember,
    isOwner,
  })

  return { workspaceReference, workspaceSnapshot, workspace, ownerId, capabilities }
}

async function promotePrimaryWorkspace(firestore, ownerId) {
  const snapshot = await firestore
    .collection('workspaces')
    .where('createdBy', '==', ownerId)
    .get()
  const active = snapshot.docs.filter((document) => !document.data()?.deletionPendingAt)
  const explicitPrimary = active.find((document) => document.data()?.isPrimaryWorkspace === true)
  if (explicitPrimary) return explicitPrimary.id

  const primary = active.sort((left, right) => {
    const dateDifference = timestampMillis(left.data()?.createdAt) - timestampMillis(right.data()?.createdAt)
    return dateDifference || left.id.localeCompare(right.id)
  })[0]
  if (!primary) return null

  await primary.ref.update({ isPrimaryWorkspace: true })
  return primary.id
}

function timestampMillis(value) {
  if (value?.toMillis) return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return 0
}

async function assertWorkspaceCapability(firestore, input, capability) {
  const access = await getWorkspaceAccess(firestore, input)
  if (!access.capabilities[capability]) {
    throw accessError('permission-denied', 'Your plan does not allow this workspace operation')
  }
  return access
}

function accessError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

export { assertWorkspaceCapability, getWorkspaceAccess, promotePrimaryWorkspace, workspaceOwnerId }
