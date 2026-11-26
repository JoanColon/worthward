<template>
  <section class="app-empty-state" :class="[`app-empty-state--${tone}`, { compact }]">
    <span v-if="icon" class="app-empty-state__icon"><q-icon :name="icon" /></span>
    <h2 class="app-card-title">{{ title }}</h2>
    <p class="app-body">{{ description }}</p>
    <div v-if="actionLabel || $slots.actions" class="app-empty-state__actions">
      <slot name="actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          :icon="actionIcon || undefined"
          :label="actionLabel"
          @click="emit('action')"
        />
      </slot>
    </div>
  </section>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  actionLabel: { type: String, default: '' },
  actionIcon: { type: String, default: 'add' },
  tone: {
    type: String,
    default: 'neutral',
    validator: (value) => ['neutral', 'positive', 'negative', 'primary'].includes(value),
  },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['action'])
</script>

<style scoped lang="scss">
.app-empty-state {
  display: grid;
  justify-items: center;
  margin-top: 1.25rem;
  padding: 3rem 1.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  text-align: center;
  box-shadow: var(--shadow-card);
}

.app-empty-state.compact {
  padding: 2rem 1rem;
}

.app-empty-state__icon {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  margin-bottom: 0.75rem;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-ink-soft);
  font-size: 1.8rem;
}

.app-empty-state--positive .app-empty-state__icon {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}

.app-empty-state--negative .app-empty-state__icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
}

.app-empty-state--primary .app-empty-state__icon {
  background: var(--color-blue-soft);
  color: var(--color-primary);
}

p {
  max-width: 34rem;
  margin: 0.45rem 0 1.25rem;
}

.app-empty-state__actions {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}
</style>
