<template>
  <section class="milestone-summary" :aria-label="t('achievements.summaryLabel')">
    <div class="summary-item summary-item--total">
      <q-icon name="emoji_events" />
      <span>
        <strong>{{ achievedCount }} / {{ totalCount }}</strong>
        <small>{{ t('achievements.milestonesAchieved') }}</small>
      </span>
    </div>
    <div class="summary-item summary-item--achieved">
      <q-icon name="check" />
      <span>
        <strong>{{ achievedCount }}</strong>
        <small>{{ t('achievements.achieved') }}</small>
      </span>
    </div>
    <div class="summary-item summary-item--progress">
      <span class="summary-progress-ring" />
      <span>
        <strong>{{ inProgressCount }}</strong>
        <small>{{ t('achievements.inProgress') }}</small>
      </span>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  totalCount: { type: Number, required: true },
  achievedCount: { type: Number, required: true },
  inProgressCount: { type: Number, required: true },
})

const { t } = useI18n()
</script>

<style scoped lang="scss">
.milestone-summary {
  display: grid;
  grid-template-columns: repeat(3, auto);
  min-width: min(32rem, 46vw);
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: rgb(255 255 255 / 90%);
  box-shadow: var(--shadow-card);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  padding: 0 1rem;
  border-left: 1px solid var(--color-line);
}

.summary-item:first-child {
  padding-left: 0.2rem;
  border-left: 0;
}

.summary-item:last-child {
  padding-right: 0.2rem;
}

.summary-item > .q-icon {
  display: grid;
  width: 2.15rem;
  height: 2.15rem;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  font-size: 1.25rem;
}

.summary-item--total > .q-icon {
  background: var(--color-purple-soft);
  color: var(--color-purple);
}

.summary-item--achieved > .q-icon {
  background: var(--color-green-soft);
  color: var(--color-success);
}

.summary-item > span:not(.summary-progress-ring) {
  display: grid;
  gap: 0.08rem;
}

.summary-item strong {
  color: var(--color-ink);
  font-size: 0.95rem;
  line-height: 1;
}

.summary-item small {
  color: var(--color-copy);
  font-size: 0.67rem;
  white-space: nowrap;
}

.summary-progress-ring {
  width: 2.15rem;
  height: 2.15rem;
  flex: 0 0 auto;
  border: 0.36rem solid var(--color-blue-soft);
  border-top-color: var(--color-primary);
  border-right-color: var(--color-primary);
  border-radius: 50%;
  transform: rotate(25deg);
}

@media (max-width: 1050px) {
  .milestone-summary {
    min-width: 0;
  }

  .summary-item {
    padding: 0 0.65rem;
  }

  .summary-item--total small {
    white-space: normal;
  }
}

@media (max-width: 760px) {
  .milestone-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    padding: 0.7rem 0.45rem;
    border-radius: var(--radius-md);
  }

  .summary-item,
  .summary-item:first-child,
  .summary-item:last-child {
    gap: 0.4rem;
    padding: 0 0.55rem;
    border-top: 0;
    border-left: 1px solid var(--color-line);
  }

  .summary-item:first-child {
    padding-left: 0.2rem;
    border-left: 0;
  }

  .summary-item:last-child {
    padding-right: 0.2rem;
  }

  .summary-item > .q-icon,
  .summary-progress-ring {
    width: 1.9rem;
    height: 1.9rem;
  }

  .summary-item > .q-icon {
    font-size: 1.05rem;
  }

  .summary-progress-ring {
    border-width: 0.3rem;
  }

  .summary-item strong {
    font-size: 0.82rem;
  }

  .summary-item small {
    overflow: hidden;
    font-size: 0.58rem;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: normal;
  }
}
</style>
