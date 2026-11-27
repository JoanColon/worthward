import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'
import { Platform } from 'quasar'

const productionFirebaseConfig = {
  apiKey: 'AIzaSyBo43_5VY5_W76APFbIxopO9iPnDWMnR4Q',
  authDomain: 'cost-of-life-f23b2.web.app',
  projectId: 'cost-of-life-f23b2',
  storageBucket: 'cost-of-life-f23b2.firebasestorage.app',
  messagingSenderId: '472858873731',
  appId: '1:472858873731:web:a3878bbbd364f72c62b0b6',
}

const firebaseEmulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1'
const firebaseEmulatorProjectId =
  import.meta.env.VITE_FIREBASE_EMULATOR_PROJECT_ID || 'worthward-local'

export const firebaseEmulatorsEnabled =
  import.meta.env.DEV &&
  !Platform.is?.capacitor &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'

const firebaseConfig = firebaseEmulatorsEnabled
  ? {
      ...productionFirebaseConfig,
      authDomain: 'localhost',
      projectId: firebaseEmulatorProjectId,
    }
  : productionFirebaseConfig

const firebaseApp = initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export const db = initializeFirestore(
  firebaseApp,
  Platform.is?.capacitor
    ? { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }
    : {},
)
export const functions = getFunctions(firebaseApp, 'europe-west1')

if (firebaseEmulatorsEnabled) {
  connectAuthEmulator(auth, `http://${firebaseEmulatorHost}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, firebaseEmulatorHost, 8080)
  connectFunctionsEmulator(functions, firebaseEmulatorHost, 5001)
}

export default firebaseApp
