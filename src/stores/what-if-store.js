import { ref } from 'vue'
import { defineStore } from 'pinia'
import { defaultWhatIfConfig, normalizeWhatIfConfig } from '../../functions/shared/plan/what-if.js'
import {
  getWhatIfConfig,
  saveWhatIfSimulation as saveWhatIfSimulationDocument,
  saveWhatIfStrategy as saveWhatIfStrategyDocument,
} from '@/services/firebase/what-if.service'

export const useWhatIfStore = defineStore('what-if', () => {
  const config = ref(normalizeWhatIfConfig(defaultWhatIfConfig))
  const loading = ref(false)
  const saving = ref(false)
  const loadError = ref(null)
  const saveError = ref(null)
  const loadedWorkspaceId = ref(null)
  const strategyLoadedWorkspaceId = ref(null)
  let requestId = 0
  let pendingSaves = 0
  let saveQueue = Promise.resolve()
  let saveRevision = 0

  async function load(workspaceId, force = false, { includeStrategy = true } = {}) {
    const hasRequestedConfig =
      loadedWorkspaceId.value === workspaceId &&
      (!includeStrategy || strategyLoadedWorkspaceId.value === workspaceId)
    if (!workspaceId || (!force && hasRequestedConfig)) return config.value
    const currentRequest = ++requestId
    loading.value = true
    loadError.value = null
    try {
      const value = await getWhatIfConfig(workspaceId, { includeStrategy })
      if (currentRequest !== requestId) return null
      config.value = value
      loadedWorkspaceId.value = workspaceId
      strategyLoadedWorkspaceId.value = includeStrategy ? workspaceId : null
      return config.value
    } catch (caughtError) {
      if (currentRequest === requestId) loadError.value = caughtError
      throw caughtError
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  async function saveWith(workspaceId, changes, writer) {
    const previous = config.value
    const next = normalizeWhatIfConfig({ ...config.value, ...changes })
    const revision = ++saveRevision
    config.value = next
    pendingSaves += 1
    saving.value = true
    saveError.value = null
    try {
      const request = saveQueue.catch(() => null).then(() => writer(workspaceId, next))
      saveQueue = request
      await request
      loadedWorkspaceId.value = workspaceId
      return config.value
    } catch (caughtError) {
      saveError.value = caughtError
      if (revision === saveRevision) config.value = previous
      throw caughtError
    } finally {
      pendingSaves -= 1
      saving.value = pendingSaves > 0
    }
  }

  function saveSimulation(workspaceId, changes) {
    return saveWith(workspaceId, changes, saveWhatIfSimulationDocument)
  }

  function saveStrategy(workspaceId, changes) {
    return saveWith(workspaceId, changes, saveWhatIfStrategyDocument)
  }

  function reset() {
    requestId += 1
    config.value = normalizeWhatIfConfig(defaultWhatIfConfig)
    loading.value = false
    saving.value = false
    pendingSaves = 0
    saveQueue = Promise.resolve()
    saveRevision += 1
    loadError.value = null
    saveError.value = null
    loadedWorkspaceId.value = null
    strategyLoadedWorkspaceId.value = null
  }

  return {
    config,
    loading,
    saving,
    error: loadError,
    saveError,
    load,
    saveSimulation,
    saveStrategy,
    reset,
  }
})
