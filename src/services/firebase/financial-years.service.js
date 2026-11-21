import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase/firebase'

function financialYearRef(workspaceId, year) {
  return doc(db, 'workspaces', workspaceId, 'financialYears', String(year))
}

export async function getFinancialYear(workspaceId, year) {
  assertYear(year)
  const reference = financialYearRef(workspaceId, year)
  const snapshot = await getDoc(reference)
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function ensureFinancialYear(workspaceId, year) {
  assertYear(year)
  return httpsCallable(functions, 'ensureFinancialYear')({ workspaceId, year })
}

export function subscribeFinancialYear(workspaceId, year, onValue, onError) {
  assertYear(year)
  return onSnapshot(
    financialYearRef(workspaceId, year),
    (snapshot) => onValue(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError,
  )
}

function assertYear(year) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error('A valid financial year is required')
  }
}
