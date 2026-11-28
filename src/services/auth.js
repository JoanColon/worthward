import { ref } from 'vue'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '@/firebase/firebase'

export const authUser = ref(null)

let resolveAuthReady
const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve
})

onAuthStateChanged(
  auth,
  (user) => {
    authUser.value = user
    resolveAuthReady()
  },
  () => resolveAuthReady(),
)

export function waitForAuth() {
  return authReady
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function createAccount(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await sendEmailVerification(credential.user)
  return credential
}

export function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error('Authentication is required')
  return sendEmailVerification(auth.currentUser)
}

export async function refreshVerificationStatus() {
  if (!auth.currentUser) throw new Error('Authentication is required')
  await reload(auth.currentUser)
  await auth.currentUser.getIdToken(true)
  authUser.value = auth.currentUser
  return auth.currentUser.emailVerified
}

export async function signInWithGoogle({ native = false, redirect = false } = {}) {
  if (native) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    const result = await FirebaseAuthentication.signInWithGoogle({
      skipNativeAuth: true,
      useCredentialManager: true,
    })
    const idToken = result.credential?.idToken
    if (!idToken) throw new Error('Google Sign-In did not return an ID token')

    const credential = GoogleAuthProvider.credential(
      idToken,
      result.credential?.accessToken || null,
    )
    return signInWithCredential(auth, credential)
  }

  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  return redirect ? signInWithRedirect(auth, provider) : signInWithPopup(auth, provider)
}

export function finishGoogleRedirect() {
  return getRedirectResult(auth)
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email)
}

export function signOut() {
  return firebaseSignOut(auth)
}
