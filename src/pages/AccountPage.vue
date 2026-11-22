<template>
  <q-page class="account-page">
    <main class="account-content">
      <AppPageHeader :title="t('account.title')" :subtitle="t('account.subtitle')" size="hero" />

      <q-card flat bordered class="account-card">
        <q-card-section>
          <h2>{{ t('account.privacyTitle') }}</h2>
          <p>{{ t('account.privacyDescription') }}</p>
          <q-btn
            outline
            no-caps
            color="primary"
            icon="open_in_new"
            :label="t('account.privacyPolicy')"
            :href="privacyUrl"
            target="_blank"
          />
        </q-card-section>
      </q-card>

      <q-card flat bordered class="account-card danger-card">
        <q-card-section>
          <h2>{{ t('account.deleteTitle') }}</h2>
          <p>{{ t('account.deleteDescription') }}</p>
          <q-btn
            unelevated
            no-caps
            color="negative"
            icon="delete_forever"
            :label="t('account.deleteAction')"
            @click="confirmingDelete = true"
          />
        </q-card-section>
      </q-card>
    </main>

    <AppConfirmDialog
      v-model="confirmingDelete"
      :title="t('account.confirmTitle')"
      :message="t('account.confirmDescription')"
      :cancel-label="t('common.cancel')"
      :confirm-label="t('account.deleteAction')"
      confirm-color="negative"
      persistent
      :loading="deleting"
      @confirm="removeAccount"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { BRAND } from '@/config/brand'
import { deleteAccount } from '@/services/firebase/account.service'

const $q = useQuasar()
const { t } = useI18n()
const router = useRouter()
const confirmingDelete = ref(false)
const deleting = ref(false)
const privacyUrl = new URL('/privacy/', BRAND.websiteUrl).href

async function removeAccount() {
  deleting.value = true
  try {
    await deleteAccount()
    confirmingDelete.value = false
    await router.replace({ name: 'login' })
    $q.notify({ type: 'positive', message: t('account.deleted'), position: 'top' })
  } catch (error) {
    const sharedWorkspace = error?.code === 'functions/failed-precondition'
    $q.notify({
      type: 'negative',
      message: t(sharedWorkspace ? 'account.errors.sharedWorkspace' : 'account.errors.generic'),
      position: 'top',
    })
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped lang="scss">
.account-page {
  padding: clamp(1.25rem, 3vw, 3rem);
}
.account-content {
  width: min(52rem, 100%);
  margin: 0 auto;
}
.account-card {
  margin-top: 1.25rem;
  border-radius: 1rem;
}
.account-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}
.account-card p {
  color: var(--color-copy);
  line-height: 1.55;
}
.danger-card {
  border-color: rgba(193, 38, 38, 0.35);
}
</style>
