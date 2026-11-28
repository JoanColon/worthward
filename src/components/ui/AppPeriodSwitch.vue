<template>
  <div
    class="app-period-switch"
    :class="[`app-period-switch--${variant}`, `app-period-switch--${size}`]"
    role="group"
    :aria-label="ariaLabel"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      :class="{
        selected: option.value === modelValue,
        'has-compact-label': option.compactLabel,
      }"
      :aria-pressed="option.value === modelValue"
      :disabled="disabled || option.disabled"
      @click="select(option.value)"
    >
      <span class="app-period-switch__label">{{ option.label }}</span>
      <span v-if="option.compactLabel" class="app-period-switch__label--compact">
        {{ option.compactLabel }}
      </span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  options: {
    type: Array,
    required: true,
    validator: (options) =>
      options.length > 0 && options.every((option) => 'value' in option && 'label' in option),
  },
  ariaLabel: { type: String, required: true },
  variant: {
    type: String,
    default: 'light',
    validator: (value) => ['financial', 'compact', 'light'].includes(value),
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'small', 'responsive'].includes(value),
  },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function select(value) {
  const option = props.options.find((candidate) => candidate.value === value)
  if (!props.disabled && !option?.disabled && value !== props.modelValue) {
    emit('update:modelValue', value)
  }
}
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.app-period-switch {
  display: flex;
  flex: 0 0 auto;
  overflow: hidden;
  padding: var(--segmented-control-padding);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--segmented-control-radius);
  background: var(--color-surface-soft);
  box-shadow: var(--shadow-control);
}

button {
  appearance: none;
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: var(--segmented-option-min-width);
  min-height: var(--segmented-option-height);
  padding: var(--segmented-option-padding);
  border: 0;
  border-radius: var(--segmented-control-radius);
  background: transparent;
  color: var(--color-copy);
  font: inherit;
  font-size: var(--segmented-option-font-size);
  font-weight: var(--button-font-weight);
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

button:focus-visible {
  outline: 3px solid var(--color-primary-focus);
  outline-offset: 3px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-period-switch__label--compact {
  display: none;
}

.app-period-switch--financial {
  border: 1px solid var(--color-inverse-line);
  background: var(--color-inverse-soft);
  box-shadow: none;
}

.app-period-switch--financial button {
  color: var(--color-inverse-muted);
}

.app-period-switch--financial button.selected {
  background: var(--color-surface);
  color: var(--color-ink);
  box-shadow: var(--shadow-control);
}

.app-period-switch--compact button.selected,
.app-period-switch--light button.selected {
  background: var(--color-ink);
  color: var(--color-inverse);
  box-shadow: var(--shadow-control);
}

.app-period-switch--small button {
  min-width: var(--segmented-option-min-width-small);
  min-height: var(--segmented-option-height-small);
  padding: var(--segmented-option-padding-small);
  font-size: var(--segmented-option-font-size-small);
}

@media (max-width: bp.$content-compact-max) {
  .app-period-switch--responsive button {
    min-width: var(--segmented-option-min-width-small);
    min-height: var(--segmented-option-height-small);
    padding: var(--segmented-option-padding-small);
    font-size: var(--segmented-option-font-size-small);
  }

  .app-period-switch--responsive .has-compact-label .app-period-switch__label {
    display: none;
  }

  .app-period-switch--responsive .app-period-switch__label--compact {
    display: inline;
  }
}
</style>
