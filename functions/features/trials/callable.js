import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import {
  claimProTrialEndNotice as claimProTrialEndNoticeData,
  startProTrial as startProTrialData,
} from './service.js'

const startProTrial = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')
  try {
    return await startProTrialData(getFirestore(), {
      userId: request.auth.uid,
      emailVerified: request.auth.token.email_verified === true,
    })
  } catch (error) {
    throw callableError(error)
  }
})

const claimProTrialEndNotice = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')
  try {
    return await claimProTrialEndNoticeData(getFirestore(), { userId: request.auth.uid })
  } catch (error) {
    throw callableError(error)
  }
})

function callableError(error) {
  if (error instanceof HttpsError) return error
  const supportedCodes = new Set(['failed-precondition', 'permission-denied'])
  return new HttpsError(
    supportedCodes.has(error?.code) ? error.code : 'internal',
    error?.message || 'The Pro trial could not be updated',
    { reason: error?.reason || 'UNKNOWN' },
  )
}

export { claimProTrialEndNotice, startProTrial }
