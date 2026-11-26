<template>
  <AppPeriodSwitch
    class="projection-view-switch"
    variant="compact"
    :model-value="modelValue"
    :options="options"
    :aria-label="t('whatIf.strategy.projectionViewSelector')"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPeriodSwitch from '@/components/ui/AppPeriodSwitch.vue'

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

<style scoped>
.detail-view-switch {
  align-self: start;
  justify-self: start;
}
</style>
