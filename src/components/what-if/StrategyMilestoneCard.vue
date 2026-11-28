<template>
  <section :class="['strategy-milestone-card', `strategy-milestone-card--${milestone.tone}`]">
    <header class="strategy-milestone-card__header">
      <span class="strategy-milestone-card__icon">
        <q-icon :name="milestone.icon" />
      </span>
      <div>
        <span class="strategy-milestone-card__eyebrow">
          <small class="app-section-label">{{ milestoneLabel }}</small>
          <q-btn
            v-if="milestone.showCalculationInfo"
            flat
            round
            dense
            size="xs"
            icon="info_outline"
            :aria-label="calculationInfoLabel"
            @click="emit('calculation-info')"
          />
        </span>
        <strong class="app-card-title">{{ milestone.milestoneTitle }}</strong>
      </div>
    </header>

    <div class="strategy-milestone-card__metrics">
      <div class="strategy-milestone-card__metric strategy-milestone-card__metric--today">
        <small class="app-caption">{{ milestone.currentLabel || todayLabel }}</small>
        <strong class="app-kpi-value-secondary">{{ milestone.todayValue }}</strong>
        <div class="strategy-milestone-card__supporting">
          <div
            class="strategy-milestone-card__progress"
            role="progressbar"
            :aria-label="progressLabel"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="milestone.progressPercent"
          >
            <span><i :style="{ width: `${milestone.progressPercent}%` }" /></span>
          </div>
          <span class="app-caption">{{ milestone.todayQualifier }}</span>
        </div>
      </div>

      <div class="strategy-milestone-card__metric">
        <small class="app-caption">{{ milestone.achievementLabel || goalReachedLabel }}</small>
        <strong :class="['app-kpi-value-secondary', `is-${milestone.status}`]">
          {{ milestone.goalReachedValue }}
        </strong>
        <div class="strategy-milestone-card__supporting">
          <span class="app-caption strategy-milestone-card__qualifier">
            <q-icon v-if="milestone.goalReachedIcon" :name="milestone.goalReachedIcon" />
            {{ milestone.goalReachedQualifier }}
          </span>
        </div>
      </div>

      <div class="strategy-milestone-card__metric">
        <small class="app-caption">{{ milestone.projectedLabel }}</small>
        <strong class="app-kpi-value-secondary">{{ milestone.projectedValue }}</strong>
        <div class="strategy-milestone-card__supporting">
          <span class="app-caption">{{ milestone.projectedQualifier }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  milestone: { type: Object, required: true },
  milestoneLabel: { type: String, required: true },
  todayLabel: { type: String, required: true },
  goalReachedLabel: { type: String, required: true },
  progressLabel: { type: String, required: true },
  calculationInfoLabel: { type: String, required: true },
})

const emit = defineEmits(['calculation-info'])
</script>

<style scoped lang="scss">
@use '@/css/foundation/breakpoints' as bp;

.strategy-milestone-card {
  --milestone-accent: var(--color-primary);
  --milestone-accent-soft: var(--color-blue-soft);
  margin-top: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.strategy-milestone-card--cash {
  --milestone-accent: var(--color-success-dark);
  --milestone-accent-soft: var(--color-green-soft);
}

.strategy-milestone-card--freedom {
  --milestone-accent: var(--color-purple);
  --milestone-accent-soft: var(--color-purple-soft);
}

.strategy-milestone-card--debt {
  --milestone-accent: var(--color-warning);
  --milestone-accent-soft: var(--color-warning-soft);
}

.strategy-milestone-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-line);
}

.strategy-milestone-card__header > div {
  display: grid;
  gap: var(--space-1);
  min-width: 0;
}

.strategy-milestone-card__icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-sm);
  background: var(--milestone-accent-soft);
  color: var(--milestone-accent);
  font-size: 1.2rem;
}

.strategy-milestone-card__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.strategy-milestone-card__eyebrow .q-btn {
  min-width: 1.25rem;
  min-height: 1.25rem;
  color: var(--milestone-accent);
}

.strategy-milestone-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding-top: var(--space-5);
}

.strategy-milestone-card__metric {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  min-width: 0;
  padding: 0 var(--space-6);
}

.strategy-milestone-card__metric:first-child {
  padding-left: 0;
}

.strategy-milestone-card__metric:last-child {
  padding-right: 0;
}

.strategy-milestone-card__metric + .strategy-milestone-card__metric {
  border-left: 1px solid var(--color-line);
}

.strategy-milestone-card__metric > small,
.strategy-milestone-card__metric > span {
  color: var(--color-copy);
}

.strategy-milestone-card__metric > strong {
  max-width: 100%;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.strategy-milestone-card__metric > strong.is-positive,
.strategy-milestone-card__qualifier .q-icon {
  color: var(--milestone-accent);
}

.strategy-milestone-card__progress {
  display: grid;
  align-items: center;
  width: 100%;
  min-height: var(--space-2);
}

.strategy-milestone-card__progress > span {
  height: var(--space-1);
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--milestone-accent) 12%, var(--color-line));
}

.strategy-milestone-card__progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--milestone-accent);
}

.strategy-milestone-card__qualifier {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.strategy-milestone-card__supporting {
  display: grid;
  gap: var(--space-1);
  width: 100%;
  margin-top: var(--space-1);
}

@media (max-width: bp.$content-compact-max) {
  .strategy-milestone-card {
    padding: var(--space-4);
  }

  .strategy-milestone-card__metrics {
    grid-template-columns: 1fr;
    gap: 0;
    padding-top: 0;
  }

  .strategy-milestone-card__metric {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-1) var(--space-4);
    min-height: 0;
    padding: var(--space-4) 0;
    border-bottom: 1px solid var(--color-line);
  }

  .strategy-milestone-card__metric + .strategy-milestone-card__metric {
    border-left: 0;
  }

  .strategy-milestone-card__metric:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  .strategy-milestone-card__metric > strong {
    text-align: right;
  }

  .strategy-milestone-card__supporting {
    grid-column: 1 / -1;
    grid-row: 2;
    margin-top: var(--space-1);
  }
}
</style>
