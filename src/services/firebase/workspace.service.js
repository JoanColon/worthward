import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '@/firebase/firebase'
import { DEMO_WORKSPACE_ID, assertMutableWorkspaceId } from '@/domain/access/demo-workspace'

export async function getUserWorkspaces() {
  const user = auth.currentUser
  if (!user) throw new Error('Authentication is required')
  const workspacesQuery = query(
    collection(db, 'workspaces'),
    where('memberIds', 'array-contains', user.uid),
  )
  const [workspaceSnapshot, demoSnapshot] = await Promise.all([
    getDocs(workspacesQuery),
    getDoc(doc(db, 'workspaces', DEMO_WORKSPACE_ID)).catch(() => null),
  ])

  return [
    ...workspaceSnapshot.docs.map((workspaceDocument) => ({
      id: workspaceDocument.id,
      ...workspaceDocument.data(),
    })),
    ...(demoSnapshot?.exists()
      ? [{ id: demoSnapshot.id, ...demoSnapshot.data(), accessMode: 'demo-read-only' }]
      : []),
  ]
}

export async function createWorkspace({ name }) {
  const result = await httpsCallable(functions, 'createWorkspace')({ name })
  return result.data
}

export async function deleteWorkspace(workspaceId) {
  assertMutableWorkspaceId(workspaceId)
  await httpsCallable(functions, 'deleteWorkspace')({ workspaceId })
}

export async function updateWorkspaceSettings(workspaceId, settings) {
  assertMutableWorkspaceId(workspaceId)
  const result = await httpsCallable(
    functions,
    'updateWorkspaceSettings',
  )({
    workspaceId,
    currency: settings.currency,
    memberNames: settings.memberNames,
  })
  return result.data
}

export async function createWorkspaceInvite(workspaceId) {
  assertMutableWorkspaceId(workspaceId)
  const result = await httpsCallable(functions, 'createWorkspaceInvite')({ workspaceId })
  return result.data
}

export async function getWorkspaceInvite(token) {
  const result = await httpsCallable(functions, 'getWorkspaceInvite')({ token })
  return result.data
}

export async function acceptWorkspaceInvite(token) {
  const result = await httpsCallable(functions, 'acceptWorkspaceInvite')({ token })
  return result.data
}
