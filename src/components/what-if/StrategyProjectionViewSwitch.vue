<template>
  <div
    class="projection-view-switch"
    role="group"
    :aria-label="t('whatIf.strategy.projectionViewSelector')"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="{ selected: modelValue === option.value }"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const options = computed(() => [
  { value: 'total', label: t('whatIf.strategy.chartView.total') },
  { value: 'breakdown', label: t('whatIf.strategy.chartView.breakdown') },
])
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.projection-view-switch {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: var(--color-surface-soft);
}

button {
  min-width: 5.5rem;
  padding: 0.42rem 0.72rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-copy);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

button.selected {
  background: var(--color-ink);
  color: var(--color-inverse);
  box-shadow: 0 2px 8px rgb(24 43 68 / 12%);
}

button:focus-visible {
  @include focus-ring;
}

.detail-view-switch {
  align-self: start;
  justify-self: start;
}

.detail-view-switch button {
  min-width: 4.6rem;
  padding: 0.4rem 0.6rem;
  font-size: 0.7rem;
}
</style>
