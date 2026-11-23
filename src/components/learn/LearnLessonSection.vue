<template>
  <section class="learn-lesson-section" :class="{ 'learn-lesson-section--compact': compact }">
    <h3 class="learn-lesson-section__title">{{ label }}</h3>
    <div class="learn-lesson-section__content">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped lang="scss">
.learn-lesson-section {
  margin-top: var(--learn-lesson-section-gap, var(--space-6));
}

.learn-lesson-section__title {
  margin: 0 0 var(--learn-lesson-title-gap, var(--space-2));
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.learn-lesson-section__content {
  color: var(--color-copy);
}

.learn-lesson-section__content :deep(p) {
  margin: 0;
  line-height: var(--line-height-body);
}
</style>
