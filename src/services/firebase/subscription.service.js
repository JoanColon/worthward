import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firebase'

function subscriptionRef(userId) {
  if (!userId) throw new Error('A user ID is required')
  return doc(db, 'users', userId, 'private', 'subscription')
}

export function subscribeUserSubscription(userId, onValue, onError) {
  return onSnapshot(
    subscriptionRef(userId),
    (snapshot) => onValue(snapshot.exists() ? snapshot.data() : null),
    onError,
  )
}
