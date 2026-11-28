import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/firebase'

const startTrial = httpsCallable(functions, 'startProTrial')
const claimEndNotice = httpsCallable(functions, 'claimProTrialEndNotice')

export async function startProTrial() {
  const result = await startTrial()
  return result.data
}

export async function claimProTrialEndNotice() {
  const result = await claimEndNotice()
  return result.data
}
