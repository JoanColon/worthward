import { describe, expect, it, vi } from 'vitest'
import {
  ANDROID_PACKAGE_NAME,
  googlePlayAccountId,
  purchaseTokenHash,
  verifyGooglePlaySubscription,
} from '../../functions/features/billing/service.js'

const USER_ID = 'user-a'
const PURCHASE_TOKEN = 'play-purchase-token'

function snapshot(data) {
  return { exists: data != null, data: () => data }
}

function createFirestore(initialRecords = {}) {
  const records = new Map(Object.entries(initialRecords))

  function reference(path) {
    return {
      path,
      collection(name) {
        return { doc: (id) => reference(`${path}/${name}/${id}`) }
      },
      async update(data) {
        records.set(path, { ...records.get(path), ...data })
      },
    }
  }

  return {
    records,
    firestore: {
      collection(name) {
        return { doc: (id) => reference(`${name}/${id}`) }
      },
      async runTransaction(callback) {
        return callback({
          get: (target) => Promise.resolve(snapshot(records.get(target.path))),
          set(target, data, options) {
            records.set(
              target.path,
              options?.merge ? { ...records.get(target.path), ...data } : data,
            )
          },
        })
      },
    },
  }
}

function createPublisher(overrides = {}) {
  const data = {
    subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE',
    acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING',
    externalAccountIdentifiers: {
      obfuscatedExternalAccountId: googlePlayAccountId(USER_ID),
    },
    lineItems: [
      {
        productId: 'worthward_pro',
        expiryTime: '2027-11-15T12:00:00Z',
        offerDetails: { basePlanId: 'annual' },
        latestSuccessfulOrderId: 'GPA.1234',
      },
    ],
    ...overrides,
  }
  return {
    purchases: {
      subscriptionsv2: { get: vi.fn().mockResolvedValue({ data }) },
      subscriptions: { acknowledge: vi.fn().mockResolvedValue({}) },
    },
  }
}

describe('Google Play subscription verification', () => {
  it('grants Pro, persists the purchase, and acknowledges it', async () => {
    const { firestore, records } = createFirestore()
    const publisher = createPublisher()

    const result = await verifyGooglePlaySubscription(firestore, {
      publisher,
      userId: USER_ID,
      purchaseToken: PURCHASE_TOKEN,
      now: new Date('2026-11-15T12:00:00Z'),
    })

    expect(publisher.purchases.subscriptionsv2.get).toHaveBeenCalledWith({
      packageName: ANDROID_PACKAGE_NAME,
      token: PURCHASE_TOKEN,
    })
    expect(publisher.purchases.subscriptions.acknowledge).toHaveBeenCalledWith({
      packageName: ANDROID_PACKAGE_NAME,
      subscriptionId: 'worthward_pro',
      token: PURCHASE_TOKEN,
      requestBody: {},
    })
    expect(result).toMatchObject({
      plan: 'pro',
      status: 'active',
      entitlementActive: true,
      productId: 'worthward_pro',
      basePlanId: 'annual',
    })
    expect(records.get(`users/${USER_ID}/private/subscription`)).toMatchObject({
      plan: 'pro',
      entitlementActive: true,
    })
    expect(records.get(`billingPurchases/${purchaseTokenHash(PURCHASE_TOKEN)}`)).toMatchObject({
      userId: USER_ID,
      purchaseToken: PURCHASE_TOKEN,
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })
  })

  it('keeps a canceled subscription active until its paid period ends', async () => {
    const { firestore } = createFirestore()
    const publisher = createPublisher({
      subscriptionState: 'SUBSCRIPTION_STATE_CANCELED',
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })

    await expect(
      verifyGooglePlaySubscription(firestore, {
        publisher,
        userId: USER_ID,
        purchaseToken: PURCHASE_TOKEN,
        now: new Date('2026-11-15T12:00:00Z'),
      }),
    ).resolves.toMatchObject({ status: 'canceled', entitlementActive: true, plan: 'pro' })
  })

  it('does not grant access while Google Play has the subscription on hold', async () => {
    const { firestore } = createFirestore()
    const publisher = createPublisher({
      subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD',
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })

    await expect(
      verifyGooglePlaySubscription(firestore, {
        publisher,
        userId: USER_ID,
        purchaseToken: PURCHASE_TOKEN,
      }),
    ).resolves.toMatchObject({ status: 'on_hold', entitlementActive: false, plan: 'free' })
  })

  it('rejects a purchase created for another account', async () => {
    const { firestore, records } = createFirestore()
    const publisher = createPublisher({
      externalAccountIdentifiers: {
        obfuscatedExternalAccountId: googlePlayAccountId('another-user'),
      },
    })

    await expect(
      verifyGooglePlaySubscription(firestore, {
        publisher,
        userId: USER_ID,
        purchaseToken: PURCHASE_TOKEN,
      }),
    ).rejects.toMatchObject({ code: 'failed-precondition', reason: 'ACCOUNT_MISMATCH' })
    expect(records.size).toBe(0)
  })

  it('does not let two Worthward accounts claim the same purchase token', async () => {
    const purchasePath = `billingPurchases/${purchaseTokenHash(PURCHASE_TOKEN)}`
    const { firestore } = createFirestore({ [purchasePath]: { userId: 'another-user' } })
    const publisher = createPublisher()

    await expect(
      verifyGooglePlaySubscription(firestore, {
        publisher,
        userId: USER_ID,
        purchaseToken: PURCHASE_TOKEN,
      }),
    ).rejects.toMatchObject({ code: 'permission-denied', reason: 'TOKEN_ALREADY_CLAIMED' })
  })
})
