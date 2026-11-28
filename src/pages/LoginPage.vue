<template>
  <q-layout view="lHh Lpr lFf" class="auth-layout">
    <q-page-container>
      <q-page class="auth-page">
        <section class="auth-intro">
          <img class="brand-logo" :src="BRAND.logo" :alt="BRAND.name" />
          <p class="brand-copy">{{ t('auth.brandMessage') }}</p>
        </section>

        <q-card flat class="auth-card">
          <q-card-section class="q-pa-none">
            <h1>{{ isRegistering ? t('auth.registerTitle') : t('auth.signInTitle') }}</h1>
            <p class="auth-subtitle">
              {{ isRegistering ? t('auth.registerSubtitle') : t('auth.signInSubtitle') }}
            </p>
          </q-card-section>

          <q-card-section class="q-pa-none q-mt-lg">
            <q-form class="q-gutter-md" @submit="submitEmail">
              <q-input
                v-model.trim="email"
                outlined
                type="email"
                :label="t('common.email')"
                autocomplete="email"
                lazy-rules
                :rules="emailRules"
              >
                <template #prepend><q-icon name="mail_outline" /></template>
              </q-input>

              <q-input
                v-model="password"
                outlined
                :type="showPassword ? 'text' : 'password'"
                :label="t('auth.password')"
                :autocomplete="isRegistering ? 'new-password' : 'current-password'"
                lazy-rules
                :rules="passwordRules"
              >
                <template #prepend><q-icon name="lock_outline" /></template>
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    :icon="showPassword ? 'visibility_off' : 'visibility'"
                    :aria-label="showPassword ? t('auth.hidePassword') : t('auth.showPassword')"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <div v-if="!isRegistering" class="text-right forgot-row">
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  :label="t('auth.forgotPassword')"
                  :disable="Boolean(loading)"
                  @click="recoverPassword"
                />
              </div>

              <q-banner v-if="errorMessage" rounded class="error-banner">
                <template #avatar><q-icon name="error_outline" color="negative" /></template>
                {{ errorMessage }}
              </q-banner>

              <q-btn
                unelevated
                no-caps
                size="md"
                color="primary"
                class="full-width app-btn--large"
                type="submit"
                :label="isRegistering ? t('auth.register') : t('auth.signIn')"
                :loading="loading === 'email'"
                :disable="Boolean(loading)"
              />
            </q-form>

            <div class="separator">
              <span>{{ t('auth.orContinueWith') }}</span>
            </div>

            <q-btn
              outline
              no-caps
              class="full-width app-btn--large google-button"
              :loading="loading === 'google'"
              :disable="Boolean(loading)"
              @click="submitGoogle"
            >
              <span class="google-g" aria-hidden="true">G</span>
              {{ t('auth.continueWithGoogle') }}
            </q-btn>

            <p class="switch-mode">
              {{ isRegistering ? t('auth.hasAccount') : t('auth.needsAccount') }}
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                :label="isRegistering ? t('auth.switchToSignIn') : t('auth.switchToRegister')"
                :disable="Boolean(loading)"
                @click="toggleMode"
              />
            </p>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { BRAND } from '@/config/brand'
import {
  createAccount,
  finishGoogleRedirect,
  sendPasswordReset,
  signIn,
  signInWithGoogle,
} from '@/services/auth'
import { hideNativeSplashWhenReady } from '@/services/splash-screen'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isRegistering = ref(route.query.register === '1')
const loading = ref(false)
const errorMessage = ref('')

const emailRules = [
  (value) => Boolean(value) || t('auth.validation.emailRequired'),
  (value) => /.+@.+\..+/.test(value) || t('auth.validation.emailInvalid'),
]
const passwordRules = [
  (value) => Boolean(value) || t('auth.validation.passwordRequired'),
  (value) => value.length >= 6 || t('auth.validation.passwordLength'),
]

onMounted(async () => {
  let redirected = false
  try {
    const result = await finishGoogleRedirect()
    if (result) {
      redirected = true
      await goToDestination()
    }
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    if (!redirected) await finishNativeStartup()
  }
})

async function submitEmail() {
  errorMessage.value = ''
  loading.value = 'email'

  try {
    if (isRegistering.value) {
      await createAccount(email.value, password.value)
      $q.notify({ type: 'positive', message: t('auth.verificationSent'), position: 'top' })
    } else {
      await signIn(email.value, password.value)
    }

    await goToDestination()
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function submitGoogle() {
  errorMessage.value = ''
  loading.value = 'google'

  try {
    const native = $q.platform.is.capacitor
    const redirect = $q.platform.is.mobile && !native
    await signInWithGoogle({ native, redirect })
    if (!redirect) await goToDestination()
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function recoverPassword() {
  errorMessage.value = ''

  if (!/.+@.+\..+/.test(email.value)) {
    errorMessage.value = t('auth.validation.resetEmail')
    return
  }

  loading.value = 'reset'

  try {
    await sendPasswordReset(email.value)
    $q.notify({
      type: 'positive',
      message: t('auth.resetSent'),
      position: 'top',
    })
  } catch (error) {
    errorMessage.value = getAuthErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  isRegistering.value = !isRegistering.value
  errorMessage.value = ''
}

async function goToDestination() {
  const redirect = route.query.redirect
  const destination =
    typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : { name: 'home' }
  await router.replace(destination)
}

function getAuthErrorMessage(error) {
  const messages = {
    'auth/email-already-in-use': t('auth.errors.emailInUse'),
    'auth/invalid-credential': t('auth.errors.invalidCredential'),
    'auth/invalid-email': t('auth.errors.invalidEmail'),
    'auth/popup-closed-by-user': t('auth.errors.popupClosed'),
    'auth/popup-blocked': t('auth.errors.popupBlocked'),
    'auth/operation-not-allowed': t('auth.errors.providerDisabled'),
    'auth/too-many-requests': t('auth.errors.tooManyRequests'),
    'auth/unauthorized-domain': t('auth.errors.unauthorizedDomain'),
    'auth/weak-password': t('auth.errors.weakPassword'),
  }

  return messages[error?.code] || t('auth.errors.generic')
}

async function finishNativeStartup() {
  try {
    await hideNativeSplashWhenReady()
  } catch {
    // The splash watchdog will retry without blocking sign-in.
  }
}
</script>

<style scoped lang="scss">
.auth-layout {
  background: var(--color-page);
}

.auth-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(18rem, 1fr) minmax(22rem, 32rem);
  align-items: center;
  gap: clamp(3rem, 10vw, 10rem);
  max-width: 74rem;
  margin: 0 auto;
  padding: 3rem;
}

.auth-intro {
  color: var(--color-ink);
}

.brand-logo {
  display: block;
  width: min(100%, 27rem);
  height: auto;
}

.brand-copy {
  max-width: 31rem;
  margin: 1.5rem 0 0;
  color: var(--color-copy);
  font-size: 1.15rem;
  line-height: 1.7;
}

.auth-card {
  padding: clamp(1.75rem, 5vw, 3rem);
  border: 1px solid var(--color-line);
  border-radius: 1.5rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-dialog);
}

h1 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-family-display);
  font-size: 2.15rem;
  font-weight: 500;
  letter-spacing: -0.025em;
}

.auth-subtitle {
  margin: 0.55rem 0 0;
  color: var(--color-copy);
}

.forgot-row {
  margin-top: -0.75rem;
}

.error-banner {
  background: var(--color-red-soft);
  color: var(--color-danger-dark);
  font-size: 0.9rem;
}

.separator {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.6rem 0;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-line);
}

.google-button {
  color: var(--color-ink);
}

.google-g {
  margin-right: 0.8rem;
  color: #4285f4;
  font-size: 1.25rem;
  font-weight: 800;
}

.switch-mode {
  margin: 1.5rem 0 0;
  color: var(--color-copy);
  text-align: center;
}

@media (max-width: 800px) {
  .auth-page {
    grid-template-columns: 1fr;
    gap: 2.5rem;
    padding-top: max(2rem, env(safe-area-inset-top));
    padding-right: max(1rem, env(safe-area-inset-right));
    padding-bottom: max(2rem, env(safe-area-inset-bottom));
    padding-left: max(1rem, env(safe-area-inset-left));
  }

  .auth-intro {
    max-width: 32rem;
    margin: 0 auto;
  }

  .brand-logo {
    width: min(100%, 18rem);
  }

  .brand-copy {
    display: none;
  }

  .auth-card {
    width: 100%;
    max-width: 32rem;
    margin: 0 auto;
  }
}

@media (max-width: 420px) {
  .auth-page {
    gap: 1.5rem;
  }

  .auth-intro {
    width: 100%;
  }

  .brand-logo {
    width: min(100%, 15rem);
    margin: 0 auto;
  }

  .auth-card {
    padding: 1.35rem;
    border-radius: 1.15rem;
  }

  h1 {
    font-size: 1.9rem;
  }
}
</style>
