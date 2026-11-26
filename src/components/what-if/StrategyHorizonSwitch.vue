<template>
  <AppPeriodSwitch
    class="horizon-options"
    variant="compact"
    :size="compact ? 'small' : 'default'"
    :model-value="switchValue"
    :options="switchOptions"
    :aria-label="t('whatIf.strategy.horizonSelector')"
    @update:model-value="select"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPeriodSwitch from '@/components/ui/AppPeriodSwitch.vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  options: { type: Array, default: () => [10, 20, 30] },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'custom'])
const { t } = useI18n()
const customValue = '__custom__'
const switchValue = computed(() =>
  props.options.includes(props.modelValue) ? props.modelValue : customValue,
)
const switchOptions = computed(() => [
  ...props.options.map((years) => ({
    value: years,
    label: props.compact ? `${years}y` : `${years} years`,
  })),
  { value: customValue, label: t('whatIf.reduction.custom') },
])

function select(value) {
  if (value === customValue) emit('custom')
  else emit('update:modelValue', value)
}
</script>

<style scoped>
.detail-horizon-options {
  width: 100%;
}

.detail-horizon-options :deep(button) {
  flex: 1;
}
</style>
