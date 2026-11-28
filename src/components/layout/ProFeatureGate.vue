<template>
  <div class="pro-feature-gate" :class="{ 'pro-feature-gate--locked': locked }">
    <div class="pro-feature-gate__content" :inert="locked || undefined" :aria-hidden="locked">
      <slot />
    </div>

    <div v-if="locked" class="pro-feature-gate__overlay">
      <q-card class="pro-feature-gate__card">
        <span class="pro-feature-gate__icon"><q-icon name="lock" /></span>
        <h1>{{ t('pro.gate.title') }}</h1>
        <p>{{ t('pro.gate.description') }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="workspace_premium"
          :label="actionLabel || t('pro.gate.action')"
          :to="{ name: 'pro' }"
        />
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  locked: { type: Boolean, default: false },
  actionLabel: { type: String, default: '' },
})

const { t } = useI18n()
</script>

<style scoped lang="scss">
.pro-feature-gate {
  position: relative;
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
}

.pro-feature-gate__content {
  min-height: inherit;
}

.pro-feature-gate--locked {
  overflow: hidden;
  max-height: calc(100vh - 64px);
  max-height: calc(100dvh - 64px);
}

.pro-feature-gate--locked .pro-feature-gate__content {
  pointer-events: none;
  user-select: none;
  opacity: 0.38;
  filter: grayscale(0.35) blur(1.5px);
}

.pro-feature-gate__overlay {
  position: absolute;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgb(245 248 252 / 42%);
  backdrop-filter: blur(2px);
}

.pro-feature-gate__card {
  width: min(100%, 30rem);
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border: 1px solid var(--color-line);
  border-radius: 1.25rem;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 1.25rem 3.5rem rgb(25 42 70 / 20%);
  text-align: center;
}

.pro-feature-gate__icon {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
  font-size: 2rem;
}

.pro-feature-gate__card h1 {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-family-display);
  font-size: clamp(1.5rem, 4vw, 2rem);
}

.pro-feature-gate__card p {
  margin: 0.75rem 0 1.5rem;
  color: var(--color-copy);
  line-height: 1.6;
}

@media (max-width: 699px) {
  .pro-feature-gate,
  .pro-feature-gate--locked {
    min-height: calc(100dvh - 56px - env(safe-area-inset-top));
    max-height: calc(100dvh - 56px - env(safe-area-inset-top));
  }
}
</style>
