<template>
  <div class="horizon-options" role="group" :aria-label="t('whatIf.strategy.horizonSelector')">
    <button
      v-for="years in options"
      :key="years"
      type="button"
      :class="{ selected: modelValue === years }"
      :aria-pressed="modelValue === years"
      @click="emit('update:modelValue', years)"
    >
      {{ compact ? `${years}y` : `${years} years` }}
    </button>
    <button
      type="button"
      :class="{ selected: !options.includes(modelValue) }"
      :aria-pressed="!options.includes(modelValue)"
      @click="emit('custom')"
    >
      {{ t('whatIf.reduction.custom') }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: Number, required: true },
  options: { type: Array, default: () => [10, 20, 30] },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'custom'])
const { t } = useI18n()
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.horizon-options {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem;
  border: 1px solid var(--color-line);
  border-radius: 0.55rem;
  background: var(--color-surface-soft);
}

button {
  min-width: var(--strategy-horizon-option-min-width, 3rem);
  height: 1.75rem;
  padding: 0.2rem 0.45rem;
  border: 0;
  background: transparent;
  color: var(--color-copy);
  font-size: 0.61rem;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

button.selected {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: 0 1px 4px rgb(15 23 42 / 10%);
}

button:focus-visible {
  @include focus-ring;
}

.detail-horizon-options {
  width: 100%;
}

.detail-horizon-options button {
  flex: 1;
}
</style>
