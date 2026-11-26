<template>
  <q-card
    flat
    class="app-card"
    :class="[
      `app-card--${tone}`,
      {
        'app-card--padded': padded,
        'app-card--compact': compact,
        'app-card--has-header': hasHeader,
      },
    ]"
  >
    <header v-if="hasHeader" class="app-card__header">
      <div class="app-card__heading">
        <slot name="icon">
          <span v-if="icon" class="app-card__icon"><q-icon :name="icon" /></span>
        </slot>
        <div class="app-card__copy">
          <slot name="title"
            ><h2 class="app-card-title">{{ title }}</h2></slot
          >
          <slot name="subtitle">
            <p v-if="subtitle" class="app-card-subtitle">{{ subtitle }}</p>
          </slot>
        </div>
      </div>
      <div v-if="$slots.actions" class="app-card__actions"><slot name="actions" /></div>
    </header>
    <slot />
  </q-card>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  tone: {
    type: String,
    default: 'neutral',
    validator: (value) => ['neutral', 'primary', 'positive', 'negative', 'purple'].includes(value),
  },
  padded: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
})

const slots = useSlots()
const hasHeader = computed(
  () =>
    props.title || props.subtitle || props.icon || slots.title || slots.subtitle || slots.actions,
)
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.app-card {
  @include dashboard-card;
  min-width: 0;
  color: var(--color-ink);
}

.app-card--padded {
  padding: var(--card-padding);
}

.app-card--compact {
  --card-padding: var(--space-4);
}

.app-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--card-header-gap);
}

.app-card--has-header.app-card--padded .app-card__header {
  margin-bottom: var(--card-gap);
}

.app-card__heading {
  display: flex;
  align-items: center;
  gap: var(--card-header-gap);
  min-width: 0;
}

.app-card__copy {
  display: grid;
  min-width: 0;
  gap: var(--card-title-subtitle-gap);
}

.app-card__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--space-2);
}

.app-card__icon {
  display: grid;
  place-items: center;
  flex: 0 0 var(--icon-size-card);
  width: var(--icon-size-card);
  height: var(--icon-size-card);
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-ink-soft);
  font-size: clamp(1.2rem, calc(1rem + 0.7vw), 1.65rem);
}

.app-card--primary .app-card__icon {
  background: var(--color-blue-soft);
  color: var(--color-primary);
}

.app-card--positive .app-card__icon {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}

.app-card--negative .app-card__icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
}

.app-card--purple .app-card__icon {
  background: var(--color-purple-soft);
  color: var(--color-purple);
}

@container (max-width: 38rem) {
  .app-card__header {
    flex-wrap: wrap;
  }

  .app-card__heading {
    flex: 1 1 15rem;
  }
}
</style>
