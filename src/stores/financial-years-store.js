import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  currentFinancialDate,
  currentFinancialYear,
} from '../../functions/shared/positions/annual-projection.js'
import {
  ensureFinancialYear,
  getFinancialYear,
  subscribeFinancialYear,
} from '@/services/firebase/financial-years.service'

export const useFinancialYearsStore = defineStore('financial-years', () => {
  const documents = ref({})
  const loading = ref(false)
  const errors = ref({})
  const requestIds = new Map()
  const loadingKeys = new Set()
  const ensuredPeriods = new Set()
  const ensureRequests = new Map()
  const readRequests = new Map()
  let activeSubscription = null
  let latestLoadId = 0

  async function load(workspaceId, year = currentFinancialYear(), force = false) {
    const key = `${workspaceId}:${year}`
    const loadId = ++latestLoadId
    watchFinancialYear(workspaceId, year)
    if (!force && Object.hasOwn(documents.value, key)) {
      if (year === currentFinancialYear()) refreshCurrentPeriod(workspaceId, year)
      return documents.value[key]
    }
    const currentRequest = (requestIds.get(key) || 0) + 1
    requestIds.set(key, currentRequest)
    loadingKeys.add(key)
    loading.value = true
    setError(key, null)
    if (year === currentFinancialYear()) refreshCurrentPeriod(workspaceId, year, force)
    try {
      const value = await readFinancialYear(workspaceId, year, key)
      if (currentRequest !== requestIds.get(key)) return null
      documents.value = { ...documents.value, [key]: value }
      if (loadId === latestLoadId) watchFinancialYear(workspaceId, year)
      return value
    } catch (loadError) {
      if (currentRequest === requestIds.get(key)) setError(key, loadError)
      throw loadError
    } finally {
      if (currentRequest === requestIds.get(key)) {
        loadingKeys.delete(key)
        loading.value = loadingKeys.size > 0
      }
    }
  }

  function get(workspaceId, year = currentFinancialYear()) {
    return documents.value[`${workspaceId}:${year}`] || null
  }

  function errorFor(workspaceId, year = currentFinancialYear()) {
    return errors.value[`${workspaceId}:${year}`] || null
  }

  function reset() {
    stopWatching()
    latestLoadId += 1
    requestIds.clear()
    loadingKeys.clear()
    ensuredPeriods.clear()
    ensureRequests.clear()
    readRequests.clear()
    documents.value = {}
    loading.value = false
    errors.value = {}
  }

  function watchFinancialYear(workspaceId, year) {
    const key = `${workspaceId}:${year}`
    if (activeSubscription?.key === key) return
    stopWatching()
    activeSubscription = {
      key,
      unsubscribe: subscribeFinancialYear(
        workspaceId,
        year,
        (value) => {
          documents.value = { ...documents.value, [key]: value }
          setError(key, null)
        },
        (subscriptionError) => {
          setError(key, subscriptionError)
        },
      ),
    }
  }

  function clearWorkspace(workspaceId) {
    const prefix = `${workspaceId}:`
    if (activeSubscription?.key.startsWith(prefix)) stopWatching()
    documents.value = Object.fromEntries(
      Object.entries(documents.value).filter(([key]) => !key.startsWith(prefix)),
    )
    errors.value = Object.fromEntries(
      Object.entries(errors.value).filter(([key]) => !key.startsWith(prefix)),
    )
    for (const key of requestIds.keys()) {
      if (key.startsWith(prefix)) requestIds.delete(key)
    }
    for (const key of loadingKeys) {
      if (key.startsWith(prefix)) loadingKeys.delete(key)
    }
    for (const key of ensuredPeriods) {
      if (key.startsWith(prefix)) ensuredPeriods.delete(key)
    }
    for (const key of ensureRequests.keys()) {
      if (key.startsWith(prefix)) ensureRequests.delete(key)
    }
    for (const key of readRequests.keys()) {
      if (key.startsWith(prefix)) readRequests.delete(key)
    }
    loading.value = loadingKeys.size > 0
  }

  function stopWatching() {
    activeSubscription?.unsubscribe()
    activeSubscription = null
  }

  function setError(key, value) {
    const next = { ...errors.value }
    if (value) next[key] = value
    else delete next[key]
    errors.value = next
  }

  function refreshCurrentPeriod(workspaceId, year, force = false) {
    const key = periodKey(workspaceId, year)
    if (force) ensuredPeriods.delete(key)
    if (ensuredPeriods.has(key)) return Promise.resolve()
    if (!ensureRequests.has(key)) {
      const request = ensureFinancialYear(workspaceId, year)
        .then(() => {
          if (ensureRequests.get(key) === request) ensuredPeriods.add(key)
        })
        .catch(() => {
          // The existing snapshot remains valid. The active listener will receive
          // any update if the background synchronization completed remotely.
        })
        .finally(() => {
          if (ensureRequests.get(key) === request) ensureRequests.delete(key)
        })
      ensureRequests.set(key, request)
    }
    return ensureRequests.get(key)
  }

  function readFinancialYear(workspaceId, year, key) {
    if (!readRequests.has(key)) {
      const request = getFinancialYear(workspaceId, year).finally(() => {
        if (readRequests.get(key) === request) readRequests.delete(key)
      })
      readRequests.set(key, request)
    }
    return readRequests.get(key)
  }

  function periodKey(workspaceId, year) {
    return `${workspaceId}:${year}:${currentFinancialDate()}`
  }

  return {
    documents,
    loading,
    errors,
    load,
    errorFor,
    get,
    clearWorkspace,
    stopWatching,
    reset,
  }
})
