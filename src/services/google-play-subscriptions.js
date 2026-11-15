import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '@/firebase/firebase'
import { GOOGLE_PLAY_SUBSCRIPTION } from '../../functions/shared/billing/entitlements.js'

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.worthward.app'

const verifySubscription = httpsCallable(functions, 'verifyGooglePlaySubscription')

export async function loadAnnualSubscription() {
  const { NativePurchases, PURCHASE_TYPE } = await nativePurchases()
  const { isBillingSupported } = await NativePurchases.isBillingSupported()
  if (!isBillingSupported) return null

  const { products } = await NativePurchases.getProducts({
    productIdentifiers: [GOOGLE_PLAY_SUBSCRIPTION.productId],
    productType: PURCHASE_TYPE.SUBS,
  })
  return (
    products.find(
      (product) =>
        product.identifier === GOOGLE_PLAY_SUBSCRIPTION.basePlanIds.annual &&
        product.planIdentifier === GOOGLE_PLAY_SUBSCRIPTION.productId &&
        !product.offerId,
    ) ||
    products.find(
      (product) => product.identifier === GOOGLE_PLAY_SUBSCRIPTION.basePlanIds.annual,
    ) ||
    null
  )
}

export async function purchaseAnnualSubscription(product) {
  const userId = authenticatedUserId()
  const { NativePurchases, PURCHASE_TYPE } = await nativePurchases()
  const purchase = await NativePurchases.purchaseProduct({
    productIdentifier: GOOGLE_PLAY_SUBSCRIPTION.productId,
    planIdentifier: GOOGLE_PLAY_SUBSCRIPTION.basePlanIds.annual,
    ...(product?.offerToken ? { offerToken: product.offerToken } : {}),
    productType: PURCHASE_TYPE.SUBS,
    quantity: 1,
    appAccountToken: await obfuscatedAccountId(userId),
    isConsumable: false,
    autoAcknowledgePurchases: false,
  })

  if (!isPurchasedState(purchase.purchaseState)) return { pending: true }
  return verifyPurchase(purchase)
}

export async function restoreAnnualSubscription() {
  authenticatedUserId()
  const { NativePurchases, PURCHASE_TYPE } = await nativePurchases()
  const { purchases } = await NativePurchases.getPurchases({
    productType: PURCHASE_TYPE.SUBS,
    onlyCurrentEntitlements: true,
  })
  const purchase = purchases.find(
    (candidate) =>
      candidate.productIdentifier === GOOGLE_PLAY_SUBSCRIPTION.productId &&
      isPurchasedState(candidate.purchaseState),
  )
  return purchase ? verifyPurchase(purchase) : null
}

export async function manageGooglePlaySubscriptions() {
  const { NativePurchases } = await nativePurchases()
  return NativePurchases.manageSubscriptions()
}

export async function obfuscatedAccountId(userId) {
  const bytes = new TextEncoder().encode(String(userId))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function isPurchasedState(state) {
  return state === 'PURCHASED' || state === '1' || state === 1
}

async function verifyPurchase(purchase) {
  if (!purchase.purchaseToken) throw new Error('Google Play did not return a purchase token')
  const result = await verifySubscription({ purchaseToken: purchase.purchaseToken })
  return { pending: false, subscription: result.data }
}

function authenticatedUserId() {
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('Authentication is required')
  return userId
}

async function nativePurchases() {
  return import('@capgo/native-purchases')
}
