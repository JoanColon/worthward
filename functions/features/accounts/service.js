/** Permanently removes an account and its private financial data. */
import { FieldValue } from 'firebase-admin/firestore'
import { deleteWorkspaceData } from '../workspaces/service.js'
import { workspaceOwnerId } from '../workspaces/access.js'

async function deleteAccountData(firestore, { auth, userId }) {
  const memberships = await firestore
    .collection('workspaces')
    .where('memberIds', 'array-contains', userId)
    .get()
  const owned = memberships.docs.filter((document) => workspaceOwnerId(document.data()) === userId)
  const sharedOwned = owned.filter((document) => (document.data().memberIds || []).length > 1)
  if (sharedOwned.length) {
    throw accountError(
      'failed-precondition',
      'Delete your shared workspaces before deleting your account',
    )
  }

  const guestMemberships = memberships.docs.filter(
    (document) => workspaceOwnerId(document.data()) !== userId,
  )
  for (const document of guestMemberships) {
    await removeWorkspaceMember(firestore, document.ref, userId)
  }
  for (const document of owned) {
    await deleteWorkspaceData(firestore, document.ref)
  }
  const purchases = await firestore
    .collection('billingPurchases')
    .where('userId', '==', userId)
    .get()
  for (const purchase of purchases.docs) {
    await firestore.recursiveDelete(purchase.ref)
  }

  const userReference = firestore.collection('users').doc(userId)
  await firestore.recursiveDelete(userReference)
  await auth.deleteUser(userId)

  return { status: 'deleted' }
}

async function removeWorkspaceMember(firestore, workspaceReference, userId) {
  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(workspaceReference)
    if (!snapshot.exists) return
    const workspace = snapshot.data()
    const memberIds = (workspace.memberIds || []).filter((memberId) => memberId !== userId)
    const members = { ...(workspace.members || {}) }
    delete members[userId]
    transaction.update(workspaceReference, {
      memberIds,
      members,
      type: memberIds.length > 1 ? 'shared' : 'personal',
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
}

function accountError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

export { deleteAccountData }
