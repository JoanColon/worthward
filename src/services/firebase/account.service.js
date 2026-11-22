import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/firebase'

export async function deleteAccount() {
  const result = await httpsCallable(functions, 'deleteAccount')()
  return result.data
}
