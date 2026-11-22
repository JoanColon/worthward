import { serverTimestamp, setDoc } from 'firebase/firestore'
import { normalizeWhatIfConfig } from '../../../functions/shared/plan/what-if.js'
import { auth } from '@/firebase/firebase'
import { getModelConfig, modelConfigRef } from '@/services/firebase/model-config.service'

export async function getWhatIfConfig(workspaceId, { includeStrategy = true } = {}) {
  if (!includeStrategy) {
    return normalizeWhatIfConfig(await getModelConfig(workspaceId, 'whatIf'))
  }

  const [simulation, strategy] = await Promise.all([
    getModelConfig(workspaceId, 'whatIf'),
    getModelConfig(workspaceId, 'whatIfStrategies'),
  ])
  return normalizeWhatIfConfig({ ...strategy, ...simulation })
}

export async function saveWhatIfSimulation(workspaceId, config) {
  const normalized = normalizeWhatIfConfig(config)
  await setDoc(modelConfigRef(workspaceId, 'whatIf'), {
    schemaVersion: 2,
    discretionaryReductionPercent: normalized.discretionaryReductionPercent,
    extraMonthlySavings: normalized.extraMonthlySavings,
    updatedAt: serverTimestamp(),
    updatedBy: authenticatedUserId(),
  })
  return normalized
}

export async function saveWhatIfStrategy(workspaceId, config) {
  const normalized = normalizeWhatIfConfig(config)
  await setDoc(modelConfigRef(workspaceId, 'whatIfStrategies'), {
    schemaVersion: 2,
    activeScenarioId: normalized.activeScenarioId,
    scenarios: normalized.scenarios,
    updatedAt: serverTimestamp(),
    updatedBy: authenticatedUserId(),
  })
  return normalized
}

function authenticatedUserId() {
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('Authentication is required')
  return userId
}
