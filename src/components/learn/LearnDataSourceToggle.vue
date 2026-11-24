<template>
  <section v-if="enabled" class="data-source">
    <div>
      <strong>Simulation data</strong>
      <small>Choose a teaching example or start from the model currently open.</small>
    </div>
    <q-option-group
      :model-value="modelValue"
      :options="options"
      type="radio"
      color="primary"
      inline
      dense
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <p v-if="modelValue === 'model'">
      <q-icon name="lock_outline" /> Model values are copied into this local simulation. Changes
      here are not saved.
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  enabled: { type: Boolean, default: false },
  modelValue: { type: String, default: 'example' },
  modelAvailable: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const options = computed(() => [
  { label: 'Use example data', value: 'example' },
  { label: 'Use model data', value: 'model', disable: !props.modelAvailable },
])
</script>

<style scoped lang="scss">
.data-source {
  margin: var(--space-5) 0 var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-sm);
  background: var(--color-blue-soft);
}

.data-source > div:first-child {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.data-source small {
  color: var(--color-copy);
  line-height: 1.4;
}

.data-source :deep(.q-option-group) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.data-source p {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: var(--space-3) 0 0;
  color: var(--color-primary-dark);
  font-size: 0.78rem;
  line-height: 1.4;
}
</style>
