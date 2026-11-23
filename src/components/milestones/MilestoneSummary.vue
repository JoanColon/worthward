<template>
  <section class="milestone-summary" :aria-label="t('achievements.summaryLabel')">
    <div class="summary-icon"><q-icon name="workspace_premium" /></div>
    <div class="summary-copy">
      <small>{{ t('achievements.yourProgress') }}</small>
      <strong>{{ achievedCount }} / {{ totalCount }}</strong>
    </div>
    <div class="summary-progress">
      <span class="summary-progress-track">
        <span :style="{ width: `${percentage}%` }" />
      </span>
      <b>{{ percentage }}%</b>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  totalCount: { type: Number, required: true },
  achievedCount: { type: Number, required: true },
  inProgressCount: { type: Number, required: true },
})

const { t } = useI18n()
const percentage = computed(() =>
  props.totalCount ? Math.round((props.achievedCount / props.totalCount) * 100) : 0,
)
</script>

<style scoped lang="scss">
.milestone-summary {
  position: relative;
  display: grid;
  grid-template-columns: auto auto minmax(9rem, 1fr);
  align-items: center;
  gap: 0.9rem;
  min-width: min(33rem, 47vw);
  margin: 0;
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-line);
  border-radius: 1.15rem;
  background: rgb(255 255 255 / 92%);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(10px);
}

.summary-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 0.85rem;
  background: var(--color-green-soft);
  color: var(--color-success);
  font-size: 1.55rem;
}

.summary-copy {
  display: grid;
  gap: 0.2rem;
  min-width: 6.5rem;
}

.summary-copy strong {
  color: var(--color-ink);
  font-size: 1.35rem;
  line-height: 1;
}

.summary-copy small {
  color: var(--color-copy);
  font-size: 0.72rem;
  font-weight: 650;
  white-space: nowrap;
}

.summary-progress {
  display: grid;
  grid-template-columns: minmax(5rem, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
}

.summary-progress-track {
  display: block;
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}

.summary-progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-success), #49bd8c);
}

.summary-progress b {
  min-width: 2.6rem;
  color: var(--color-ink);
  font-size: 0.9rem;
  text-align: right;
}

@media (max-width: 1050px) {
  .milestone-summary {
    min-width: 0;
  }
}

@media (max-width: 760px) {
  .milestone-summary {
    grid-template-columns: auto minmax(0, 1fr) auto;
    width: 100%;
    padding: 0.85rem 0.9rem 1.25rem;
    border-radius: 1.15rem;
  }

  .summary-icon {
    width: 2.75rem;
    height: 2.75rem;
    font-size: 1.4rem;
  }

  .summary-copy {
    min-width: 0;
  }

  .summary-copy strong {
    font-size: 1.2rem;
  }

  .summary-progress {
    display: flex;
    gap: 0;
  }

  .summary-progress-track {
    position: absolute;
    right: 0.9rem;
    bottom: 0.6rem;
    left: 0.9rem;
    height: 0.35rem;
  }

  .summary-progress b {
    font-size: 0.88rem;
  }
}
</style>
