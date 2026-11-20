<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    @update:model-value="emit('update:modelValue', $event)"
    @hide="emit('hide')"
  >
    <q-card class="app-confirm-dialog" :style="{ '--app-confirm-dialog-width': width }">
      <q-btn
        v-if="showClose"
        v-close-popup
        flat
        round
        dense
        icon="close"
        class="dialog-close"
        :aria-label="cancelLabel"
        :disable="loading || disabled"
        @click="emit('cancel')"
      />

      <q-card-section>
        <h2>{{ title }}</h2>
        <slot>
          <p>{{ message }}</p>
        </slot>
      </q-card-section>

      <q-card-actions :align="actionsAlign">
        <q-btn
          v-if="confirmFirst"
          :flat="confirmFlat"
          :unelevated="!confirmFlat"
          no-caps
          :color="confirmColor"
          :icon="confirmIcon || undefined"
          :label="confirmLabel"
          :loading="loading"
          :disable="disabled"
          @click="emit('confirm')"
        />
        <q-btn
          v-close-popup
          flat
          no-caps
          :label="cancelLabel"
          :disable="loading || disabled"
          @click="emit('cancel')"
        />
        <q-btn
          v-if="!confirmFirst"
          :flat="confirmFlat"
          :unelevated="!confirmFlat"
          no-caps
          :color="confirmColor"
          :icon="confirmIcon || undefined"
          :label="confirmLabel"
          :loading="loading"
          :disable="disabled"
          @click="emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, required: true },
  confirmColor: { type: String, default: 'primary' },
  confirmIcon: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  persistent: { type: Boolean, default: false },
  showClose: { type: Boolean, default: true },
  confirmFirst: { type: Boolean, default: false },
  confirmFlat: { type: Boolean, default: false },
  actionsAlign: {
    type: String,
    default: 'right',
    validator: (value) =>
      ['left', 'center', 'right', 'between', 'around', 'evenly', 'stretch'].includes(value),
  },
  width: { type: String, default: '28rem' },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'hide'])
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.app-confirm-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(var(--app-confirm-dialog-width), calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 1rem;
  background: var(--color-surface);
  box-shadow: var(--shadow-dialog);
}

.q-card__section {
  flex: 1 1 auto;
  min-height: 0;
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
}

h2 {
  margin: 0;
  padding-right: 2.75rem;
  color: var(--color-ink);
  font-size: 1.5rem;
  line-height: 1.15;
  letter-spacing: -0.035em;
}

p {
  margin: 0.65rem 0 0;
  color: var(--color-copy);
  line-height: 1.55;
}

.q-card__actions {
  flex: 0 0 auto;
  min-height: 4.25rem;
  gap: 0.6rem;
  padding: 0.75rem 1.75rem;
  border-top: 1px solid var(--color-line);
  background: var(--color-surface);
}

.q-card__actions :deep(.q-btn) {
  min-height: var(--button-height-md);
}

.q-card__actions :deep(.q-btn--flat:not(.text-negative)) {
  border: 1px solid var(--color-line);
  background: var(--color-surface);
}

@media (max-width: bp.$xs-max) {
  .app-confirm-dialog {
    width: calc(100vw - 1rem);
    max-height: calc(100dvh - 1rem);
    border-radius: 0.85rem;
  }

  .q-card__section {
    padding: 1.15rem 1rem;
  }

  h2 {
    font-size: 1.3rem;
  }

  .q-card__actions {
    padding: 0.65rem 1rem;
  }
}
</style>
