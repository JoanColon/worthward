/** Authenticated boundary for permanent account deletion. */
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import { deleteAccountData } from './service.js'

const deleteAccount = onCall({ region: 'europe-west1', timeoutSeconds: 540 }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')
  try {
    return await deleteAccountData(getFirestore(), {
      auth: getAuth(),
      userId: request.auth.uid,
    })
  } catch (error) {
    if (error instanceof HttpsError) throw error
    let code = 'internal'
    if (['failed-precondition', 'permission-denied'].includes(error?.code)) code = error.code
    throw new HttpsError(code, error?.message || 'The account could not be deleted')
  }
})

export { deleteAccount }
