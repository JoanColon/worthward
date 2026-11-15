/** Firebase callable boundary for verified Google Play subscriptions. */
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/https'
import * as logger from 'firebase-functions/logger'
import { google } from 'googleapis'
import { verifyGooglePlaySubscription as verifyGooglePlaySubscriptionData } from './service.js'

let publisherPromise = null

const verifyGooglePlaySubscription = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')

  try {
    return await verifyGooglePlaySubscriptionData(getFirestore(), {
      publisher: await getAndroidPublisher(),
      userId: request.auth.uid,
      purchaseToken: request.data?.purchaseToken,
    })
  } catch (error) {
    logger.error('Google Play subscription verification failed', {
      userId: request.auth.uid,
      reason: error?.reason || 'UNKNOWN',
      error: error?.cause?.message || error?.message || String(error),
    })
    throw new HttpsError(
      callableErrorCode(error?.code),
      error?.message || 'The subscription could not be verified',
      { reason: error?.reason || 'UNKNOWN' },
    )
  }
})

async function getAndroidPublisher() {
  publisherPromise ||= createAndroidPublisher()
  return publisherPromise
}

async function createAndroidPublisher() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  })
  return google.androidpublisher({ version: 'v3', auth: await auth.getClient() })
}

function callableErrorCode(code) {
  const supportedCodes = new Set([
    'failed-precondition',
    'invalid-argument',
    'permission-denied',
    'unavailable',
  ])
  return supportedCodes.has(code) ? code : 'internal'
}

export { verifyGooglePlaySubscription }
