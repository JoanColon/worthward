import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  defaultSubscription,
  normalizeSubscription,
  resolveUserEntitlements,
} from '../../functions/shared/billing/entitlements.js'
import { subscribeUserSubscription } from '@/services/firebase/subscription.service'

export const useEntitlementsStore = defineStore('entitlements', () => {
  const subscription = ref(defaultSubscription())
  const loading = ref(false)
  const ready = ref(false)
  const error = ref(null)
  const entitlements = computed(() => resolveUserEntitlements(subscription.value))
  let activeUserId = null
  let unsubscribe = null

  function start(userId) {
    if (!userId || (activeUserId === userId && unsubscribe)) return
    reset()
    activeUserId = userId
    loading.value = true

    unsubscribe = subscribeUserSubscription(
      userId,
      (value) => {
        subscription.value = normalizeSubscription(value)
        loading.value = false
        ready.value = true
        error.value = null
      },
      (subscriptionError) => {
        subscription.value = defaultSubscription()
        loading.value = false
        ready.value = true
        error.value = subscriptionError
      },
    )
  }

  function reset() {
    unsubscribe?.()
    unsubscribe = null
    activeUserId = null
    subscription.value = defaultSubscription()
    loading.value = false
    ready.value = false
    error.value = null
  }

  return { subscription, entitlements, loading, ready, error, start, reset }
})
