import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { Platform } from 'quasar'

const firebaseConfig = {
  apiKey: 'AIzaSyBo43_5VY5_W76APFbIxopO9iPnDWMnR4Q',
  authDomain: 'cost-of-life-f23b2.web.app',
  projectId: 'cost-of-life-f23b2',
  storageBucket: 'cost-of-life-f23b2.firebasestorage.app',
  messagingSenderId: '472858873731',
  appId: '1:472858873731:web:a3878bbbd364f72c62b0b6',
}

const firebaseApp = initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export const db = initializeFirestore(
  firebaseApp,
  Platform.is?.capacitor
    ? { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }
    : {},
)
export const functions = getFunctions(firebaseApp, 'europe-west1')
export default firebaseApp
