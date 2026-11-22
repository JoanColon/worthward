import { getFirestore } from 'firebase-admin/firestore'
import * as logger from 'firebase-functions/logger'
import { onSchedule } from 'firebase-functions/scheduler'
import { getAndroidPublisher } from './publisher.js'
import { verifyGooglePlaySubscription } from './service.js'

const reconcileGooglePlaySubscriptions = onSchedule(
  {
    schedule: 'every 6 hours',
    timeZone: 'Europe/Madrid',
    region: 'europe-west1',
    timeoutSeconds: 540,
    retryCount: 3,
  },
  async () => {
    const firestore = getFirestore()
    const purchases = await firestore.collection('billingPurchases').get()
    const purchasesByHash = new Map()
    const userIds = new Set()
    for (const document of purchases.docs) {
      const purchase = document.data()
      if (!purchase?.userId || !purchase?.purchaseToken) continue
      purchasesByHash.set(document.id, purchase)
      userIds.add(purchase.userId)
    }

    if (!userIds.size) return

    const publisher = await getAndroidPublisher()
    const failures = []
    for (const userId of userIds) {
      const subscription = await firestore
        .collection('users')
        .doc(userId)
        .collection('private')
        .doc('subscription')
        .get()
      const purchase = purchasesByHash.get(subscription.data()?.purchaseTokenHash)
      if (!purchase || purchase.userId !== userId) continue

      try {
        await verifyGooglePlaySubscription(firestore, {
          publisher,
          userId,
          purchaseToken: purchase.purchaseToken,
        })
      } catch (error) {
        failures.push({ userId, reason: error?.reason || 'UNKNOWN' })
        logger.error('Google Play subscription reconciliation failed', {
          userId,
          reason: error?.reason || 'UNKNOWN',
          error: error?.cause?.message || error?.message || String(error),
        })
      }
    }
    if (failures.length) {
      throw new Error(`Failed to reconcile ${failures.length} Google Play subscriptions`)
    }
  },
)

export { reconcileGooglePlaySubscriptions }
