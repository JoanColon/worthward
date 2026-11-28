import { describe, expect, it, vi } from 'vitest'
import {
  ANDROID_PACKAGE_NAME,
  googlePlayAccountId,
  purchaseTokenHash,
  verifyGooglePlaySubscription,
} from '../../functions/features/billing/service.js'

const USER_ID = 'user-a'
const PURCHASE_TOKEN = 'play-purchase-token'

function snapshot(data, reference = null) {
  return { exists: data != null, data: () => data, ref: reference }
}

function createFirestore(initialRecords = {}) {
  const records = new Map(Object.entries(initialRecords))

  function reference(path) {
    return {
      id: path.split('/').at(-1),
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
        return {
          doc: (id) => reference(`${name}/${id}`),
          where(field, operator, value) {
            return { kind: 'query', collection: name, field, operator, value }
          },
        }
      },
      async runTransaction(callback) {
        return callback({
          get(target) {
            if (target.kind === 'query') {
              const docs = [...records.entries()]
                .filter(([path, data]) => {
                  const parts = path.split('/')
                  return (
                    parts.length === 2 &&
                    parts[0] === target.collection &&
                    target.operator === '==' &&
                    data?.[target.field] === target.value
                  )
                })
                .map(([path, data]) => {
                  const targetReference = reference(path)
                  return snapshot(data, targetReference)
                })
              return Promise.resolve({ docs })
            }
            return Promise.resolve(snapshot(records.get(target.path), target))
          },
          set(target, data, options) {
            records.set(
              target.path,
              options?.merge ? { ...records.get(target.path), ...data } : data,
            )
          },
          update(target, data) {
            records.set(target.path, { ...records.get(target.path), ...data })
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
    const workspacePath = 'workspaces/workspace-a'
    const { firestore, records } = createFirestore({
      [workspacePath]: { createdBy: USER_ID, entitlement: { tier: 'free', expiresAt: null } },
    })
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
    expect(records.get(workspacePath).entitlement).toMatchObject({
      tier: 'pro',
      expiresAt: new Date('2027-11-15T12:00:00Z'),
    })
  })

  it('accepts an out-of-app resubscription associated with the expired account', async () => {
    const { firestore } = createFirestore()
    const publisher = createPublisher({
      externalAccountIdentifiers: undefined,
      outOfAppPurchaseContext: {
        expiredExternalAccountIdentifiers: {
          obfuscatedExternalAccountId: googlePlayAccountId(USER_ID),
        },
      },
    })

    await expect(
      verifyGooglePlaySubscription(firestore, {
        publisher,
        userId: USER_ID,
        purchaseToken: PURCHASE_TOKEN,
      }),
    ).resolves.toMatchObject({ plan: 'pro', entitlementActive: true })
  })

  it('does not let an older token replace the current subscription', async () => {
    const currentTokenHash = purchaseTokenHash('current-token')
    const subscriptionPath = `users/${USER_ID}/private/subscription`
    const { firestore, records } = createFirestore({
      [subscriptionPath]: {
        plan: 'pro',
        source: 'google_play',
        status: 'active',
        entitlementActive: true,
        currentPeriodEndsAt: new Date('2028-11-15T12:00:00Z'),
        productId: 'worthward_pro',
        basePlanId: 'annual',
        purchaseTokenHash: currentTokenHash,
      },
    })
    const publisher = createPublisher({
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })

    const result = await verifyGooglePlaySubscription(firestore, {
      publisher,
      userId: USER_ID,
      purchaseToken: 'older-token',
    })

    expect(result).toMatchObject({ plan: 'pro', entitlementActive: true })
    expect(result.currentPeriodEndsAt).toBe('2028-11-15T12:00:00.000Z')
    expect(records.get(subscriptionPath).purchaseTokenHash).toBe(currentTokenHash)
  })

  it('accepts a replacement token linked to the current purchase', async () => {
    const oldToken = 'old-token'
    const newToken = 'new-token'
    const subscriptionPath = `users/${USER_ID}/private/subscription`
    const { firestore, records } = createFirestore({
      [subscriptionPath]: {
        plan: 'pro',
        source: 'google_play',
        status: 'active',
        entitlementActive: true,
        currentPeriodEndsAt: new Date('2027-11-15T12:00:00Z'),
        purchaseTokenHash: purchaseTokenHash(oldToken),
      },
    })
    const publisher = createPublisher({
      linkedPurchaseToken: oldToken,
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })

    await verifyGooglePlaySubscription(firestore, {
      publisher,
      userId: USER_ID,
      purchaseToken: newToken,
    })

    expect(records.get(subscriptionPath).purchaseTokenHash).toBe(purchaseTokenHash(newToken))
  })

  it('preserves an administrative Pro grant', async () => {
    const subscriptionPath = `users/${USER_ID}/private/subscription`
    const workspacePath = 'workspaces/workspace-a'
    const { firestore, records } = createFirestore({
      [subscriptionPath]: {
        plan: 'pro',
        source: 'admin',
        status: 'active',
        entitlementActive: true,
        currentPeriodEndsAt: new Date('2100-01-01T00:00:00Z'),
      },
      [workspacePath]: {
        createdBy: USER_ID,
        entitlement: { tier: 'pro', expiresAt: new Date('2100-01-01T00:00:00Z') },
      },
    })
    const publisher = createPublisher({
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })

    await verifyGooglePlaySubscription(firestore, {
      publisher,
      userId: USER_ID,
      purchaseToken: PURCHASE_TOKEN,
    })

    expect(records.get(subscriptionPath)).toMatchObject({
      source: 'admin',
      currentPeriodEndsAt: new Date('2100-01-01T00:00:00Z'),
    })
    expect(records.get(workspacePath).entitlement).toMatchObject({
      tier: 'pro',
      expiresAt: new Date('2100-01-01T00:00:00Z'),
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

  it('does not grant access when an active provider state has already expired', async () => {
    const { firestore } = createFirestore()
    const publisher = createPublisher({
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
      lineItems: [
        {
          productId: 'worthward_pro',
          expiryTime: '2026-11-14T12:00:00Z',
          offerDetails: { basePlanId: 'annual' },
        },
      ],
    })

    await expect(
      verifyGooglePlaySubscription(firestore, {
        publisher,
        userId: USER_ID,
        purchaseToken: PURCHASE_TOKEN,
        now: new Date('2026-11-15T12:00:00Z'),
      }),
    ).resolves.toMatchObject({ status: 'active', entitlementActive: false, plan: 'free' })
  })

  it('does not let an inactive Google Play result invalidate an active Worthward trial', async () => {
    const trialExpiry = new Date('2026-12-01T12:00:00Z')
    const subscriptionPath = `users/${USER_ID}/private/subscription`
    const trialPath = `users/${USER_ID}/private/trial`
    const workspacePath = 'workspaces/workspace-a'
    const { firestore, records } = createFirestore({
      [trialPath]: {
        startedAt: new Date('2026-11-01T12:00:00Z'),
        expiresAt: trialExpiry,
      },
      [workspacePath]: {
        createdBy: USER_ID,
        entitlement: { tier: 'pro', expiresAt: trialExpiry },
      },
    })
    const publisher = createPublisher({
      subscriptionState: 'SUBSCRIPTION_STATE_ON_HOLD',
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })

    await verifyGooglePlaySubscription(firestore, {
      publisher,
      userId: USER_ID,
      purchaseToken: PURCHASE_TOKEN,
      now: new Date('2026-11-15T12:00:00Z'),
    })

    expect(records.get(subscriptionPath)).toMatchObject({
      source: 'google_play',
      entitlementActive: false,
    })
    expect(records.get(workspacePath).entitlement).toMatchObject({
      tier: 'pro',
      expiresAt: trialExpiry,
    })
  })

  it('removes access immediately when Google Play revokes the subscription', async () => {
    const { firestore } = createFirestore()
    const publisher = createPublisher({
      subscriptionState: 'SUBSCRIPTION_STATE_REVOKED',
      acknowledgementState: 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    })

    await expect(
      verifyGooglePlaySubscription(firestore, {
        publisher,
        userId: USER_ID,
        purchaseToken: PURCHASE_TOKEN,
      }),
    ).resolves.toMatchObject({ status: 'revoked', entitlementActive: false, plan: 'free' })
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
