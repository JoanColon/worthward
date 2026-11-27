<template>
  <q-card
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
