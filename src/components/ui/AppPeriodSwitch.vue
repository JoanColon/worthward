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
      :class="{ selected: option.value === modelValue }"
      :aria-pressed="option.value === modelValue"
      :disabled="disabled || option.disabled"
      @click="select(option.value)"
    >
      {{ option.label }}
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
    default: 'financial',
    validator: (value) => ['financial', 'compact', 'light'].includes(value),
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'small'].includes(value),
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
  border-radius: 999px;
}

button {
  appearance: none;
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font: inherit;
  font-weight: var(--button-font-weight);
  text-align: center;
  cursor: pointer;
}

button:focus-visible {
  outline: 3px solid var(--color-primary-focus);
  outline-offset: 3px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-period-switch--financial {
  padding: 0.22rem;
  border: 1px solid var(--color-inverse-line);
  background: var(--color-inverse-soft);
}

.app-period-switch--financial button {
  min-width: var(--app-period-option-min-width, 5.4rem);
  padding: var(--app-period-option-padding, 0.45rem 0.8rem);
  color: var(--color-inverse-muted);
  font-size: var(--app-period-option-font-size, 0.8rem);
}

.app-period-switch--financial button.selected,
.app-period-switch--compact button.selected {
  background: var(--color-surface);
  color: var(--color-ink);
  box-shadow: var(--shadow-control);
}

.app-period-switch--compact {
  padding: 0.16rem;
  border: 1px solid var(--color-ink);
  background: var(--color-ink);
}

.app-period-switch--compact button {
  min-height: 1.75rem;
  padding: 0.32rem 0.65rem;
  color: var(--color-inverse-muted);
  font-size: 0.73rem;
}

.app-period-switch--light {
  padding: 0.25rem;
  border: 1px solid var(--color-line-strong);
  background: var(--color-surface);
  box-shadow: var(--shadow-control);
}

.app-period-switch--light button {
  min-width: var(--app-period-option-min-width, 3.2rem);
  min-height: var(--button-height-sm);
  padding: var(--app-period-option-padding, 0.4rem 0.75rem);
  color: var(--color-copy);
  font-size: var(--app-period-option-font-size, inherit);
  transition: 160ms ease;
}

.app-period-switch--light button.selected {
  background: var(--color-ink);
  color: var(--color-inverse);
  box-shadow: 0 6px 14px rgb(11 22 51 / 16%);
}

.app-period-switch--small {
  padding: 0.1rem;
}

.app-period-switch--small button {
  min-height: 1.45rem;
  padding: 0.12rem 0.2rem;
  font-size: 0.58rem;
}

@media (max-width: bp.$content-compact-max) {
  .app-period-switch--financial {
    padding: 0.15rem;
  }

  .app-period-switch--financial button {
    min-width: var(--app-period-option-min-width-mobile, 3.9rem);
    min-height: 1.75rem;
    padding: var(--app-period-option-padding-mobile, 0.2rem 0.5rem);
    font-size: var(--app-period-option-font-size-mobile, 0.67rem);
  }
}

@media (max-width: bp.$xs-max) {
  .app-period-switch--compact {
    padding: 0.1rem;
  }

  .app-period-switch--compact button {
    min-height: 1.45rem;
    padding: 0.12rem 0.2rem;
    font-size: 0.58rem;
  }
}
</style>
