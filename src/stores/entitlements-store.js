import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  defaultSubscription,
  defaultTrial,
  normalizeSubscription,
  normalizeTrial,
  resolveUserEntitlements,
  timestampMillis,
} from '../../functions/shared/billing/entitlements.js'
import {
  subscribeUserSubscription,
  subscribeUserTrial,
} from '@/services/firebase/subscription.service'

export const useEntitlementsStore = defineStore('entitlements', () => {
  const subscription = ref(defaultSubscription())
  const trial = ref(defaultTrial())
  const now = ref(Date.now())
  const loading = ref(false)
  const ready = ref(false)
  const error = ref(null)
  const entitlements = computed(() =>
    resolveUserEntitlements(
      { subscription: subscription.value, trial: trial.value },
      { now: now.value },
    ),
  )
  let activeUserId = null
  let unsubscribers = []
  let expiryTimer = null
  let subscriptionReady = false
  let trialReady = false

  function start(userId) {
    if (!userId || (activeUserId === userId && unsubscribers.length)) return
    reset()
    activeUserId = userId
    loading.value = true

    unsubscribers = [
      subscribeUserSubscription(
        userId,
        (value) => {
          subscription.value = normalizeSubscription(value)
          subscriptionReady = true
          finishLoad()
        },
        handleError,
      ),
      subscribeUserTrial(
        userId,
        (value) => {
          trial.value = normalizeTrial(value)
          trialReady = true
          finishLoad()
        },
        handleError,
      ),
    ]
    globalThis.document?.addEventListener('visibilitychange', refreshOnVisibility)
    globalThis.window?.addEventListener('focus', refreshClock)
  }

  function reset() {
    unsubscribers.forEach((unsubscribe) => unsubscribe?.())
    unsubscribers = []
    clearTimeout(expiryTimer)
    expiryTimer = null
    globalThis.document?.removeEventListener('visibilitychange', refreshOnVisibility)
    globalThis.window?.removeEventListener('focus', refreshClock)
    activeUserId = null
    subscription.value = defaultSubscription()
    trial.value = defaultTrial()
    now.value = Date.now()
    loading.value = false
    ready.value = false
    error.value = null
    subscriptionReady = false
    trialReady = false
  }

  function finishLoad() {
    if (!subscriptionReady || !trialReady) return
    loading.value = false
    ready.value = true
    error.value = null
    refreshClock()
  }

  function handleError(subscriptionError) {
    loading.value = false
    ready.value = true
    error.value = subscriptionError
    refreshClock()
  }

  function refreshClock() {
    now.value = Date.now()
    scheduleExpiry()
  }

  function refreshOnVisibility() {
    if (globalThis.document?.visibilityState === 'visible') refreshClock()
  }

  function scheduleExpiry() {
    clearTimeout(expiryTimer)
    expiryTimer = null
    const expiresAt = timestampMillis(entitlements.value.expiresAt)
    if (expiresAt <= now.value) return
    const maximumDelay = 2_147_000_000
    expiryTimer = setTimeout(refreshClock, Math.min(expiresAt - now.value + 50, maximumDelay))
  }

  return {
    subscription,
    trial,
    now,
    entitlements,
    loading,
    ready,
    error,
    start,
    reset,
    refreshClock,
  }
})
