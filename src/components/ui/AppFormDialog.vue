<template>
  <q-card class="app-form-dialog" :style="{ '--app-form-dialog-width': width }">
    <q-form ref="form" class="app-form-dialog__layout" @submit.prevent="emit('submit')">
      <q-card-section class="app-form-dialog__header">
        <slot name="title">
          <h2>{{ title }}</h2>
        </slot>
        <q-btn
          flat
          round
          dense
          icon="close"
          class="dialog-close"
          :aria-label="cancelLabel"
          :disable="disabled"
          @click="emit('cancel')"
        />
      </q-card-section>

      <q-card-section class="app-form-dialog__body">
        <slot />
      </q-card-section>

      <q-card-actions class="app-form-dialog__actions">
        <slot name="actions" />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, required: true },
  cancelLabel: { type: String, required: true },
  width: { type: String, default: '42rem' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'cancel'])
const form = ref(null)

defineExpose({
  validate: () => form.value?.validate(),
  resetValidation: () => form.value?.resetValidation(),
})
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.app-form-dialog {
  width: min(var(--app-form-dialog-width), calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 1rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-dialog);
}

.app-form-dialog__layout {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100dvh - 2rem);
}

.app-form-dialog__header {
  position: relative;
  flex: 0 0 auto;
  padding: 1.5rem 1.75rem 0.85rem;
}

.app-form-dialog__header h2,
.app-form-dialog__header :deep(h2) {
  margin: 0;
  padding-right: 2.75rem;
  color: var(--color-ink);
  font-size: 2rem;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.app-form-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.75rem 1.75rem 1.5rem;
  overflow-y: auto;
}

.app-form-dialog__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 4.75rem;
  padding: 0.85rem 1.75rem;
  border-top: 1px solid var(--color-line);
  background: var(--color-surface);
}

.app-form-dialog__actions :deep(.primary-actions) {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
}

.app-form-dialog__actions :deep(.primary-actions .q-btn) {
  min-width: 6rem;
  min-height: var(--button-height-md);
}

@media (max-width: bp.$xs-max) {
  .app-form-dialog {
    width: calc(100vw - 1rem);
    max-height: calc(100dvh - 1rem);
    border-radius: 0.85rem;
  }

  .app-form-dialog__layout {
    max-height: calc(100dvh - 1rem);
  }

  .app-form-dialog__header {
    padding: 1.15rem 1rem 0.65rem;
  }

  .app-form-dialog__header h2,
  .app-form-dialog__header :deep(h2) {
    font-size: 1.55rem;
  }

  .app-form-dialog__body {
    padding: 0.6rem 1rem 1rem;
  }

  .app-form-dialog__actions {
    min-height: 4rem;
    padding: 0.65rem 1rem;
  }

  .app-form-dialog__actions :deep(.primary-actions) {
    gap: 0.5rem;
  }

  .app-form-dialog__actions :deep(.primary-actions .q-btn) {
    min-width: 4.75rem;
  }
}
</style>
