<template>
  <AppCard
    class="dashboard-card"
    :title="title"
    :subtitle="subtitle"
    :icon="icon"
    :tone="toneByIcon[iconTone] || 'neutral'"
  >
    <template v-if="$slots.action" #actions><slot name="action" /></template>
    <slot />
  </AppCard>
</template>

<script setup>
import AppCard from '@/components/ui/AppCard.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: String, default: '' },
  iconTone: { type: String, default: 'green' },
})

const toneByIcon = { green: 'positive', blue: 'primary', purple: 'purple' }
</script>

<style scoped lang="scss">
.dashboard-card {
  container-type: inline-size;
}
</style>
