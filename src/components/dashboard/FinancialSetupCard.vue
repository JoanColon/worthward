<template>
  <section class="setup-card">
    <header>
      <div>
        <span class="app-section-label">{{ t('dashboard.setup.eyebrow') }}</span>
        <h2 class="app-card-title">{{ t('dashboard.setup.title') }}</h2>
        <p class="app-card-subtitle">{{ t('dashboard.setup.description') }}</p>
      </div>
    </header>

    <div class="setup-progress">
      <q-linear-progress
        rounded
        size="0.45rem"
        color="primary"
        track-color="grey-3"
        :value="progress"
      />
      <strong>{{ t('dashboard.setup.progress', { completed, total: items.length }) }}</strong>
    </div>

    <div class="setup-list">
      <router-link v-for="item in items" :key="item.key" :to="item.to" class="setup-row">
        <span class="setup-icon" :class="item.key"><q-icon :name="item.icon" /></span>
        <span class="setup-copy">
          <strong>{{ item.title }}</strong>
          <small>{{ item.description }}</small>
        </span>
        <span v-if="item.status === 'ready'" class="setup-value">
          <q-icon name="check_circle" />
          <strong>{{ formatCurrency(item.total) }}</strong>
        </span>
        <span v-else-if="item.status === 'not-applicable'" class="setup-value">
          <q-icon name="check_circle" />
          <strong>{{ t('dashboard.setup.noneSelected') }}</strong>
        </span>
        <span v-else class="setup-action">
          {{ item.status === 'empty' ? t('dashboard.setup.addDetails') : t('dashboard.setup.add') }}
          <q-icon name="arrow_forward" />
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({ items: { type: Array, required: true } })
const { t } = useI18n()
const completed = computed(() => props.items.filter(({ completed: value }) => value).length)
const progress = computed(() => (props.items.length ? completed.value / props.items.length : 0))
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.setup-card {
  @include dashboard-card;
  padding: var(--card-padding);
}
.setup-card header {
  display: block;
}
.setup-card header span {
  color: var(--color-primary);
}
.setup-card h2 {
  margin-top: var(--space-1);
}
.setup-card header p {
  margin-top: var(--space-1);
}
.setup-progress {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.setup-progress strong {
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  white-space: nowrap;
}
.setup-list {
  margin-top: var(--space-2);
  border-top: 1px solid var(--color-line);
}
.setup-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  min-height: 3.75rem;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-ink);
  text-decoration: none;
}
.setup-row:last-child {
  border-bottom: 0;
}
.setup-row:hover .setup-copy > strong {
  color: var(--color-primary);
}
.setup-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--color-green-soft);
  color: var(--color-success-dark);
  font-size: 1.2rem;
}
.setup-icon.liabilities {
  background: var(--color-red-soft);
  color: var(--color-danger);
}
.setup-icon.income {
  background: var(--color-blue-soft);
  color: var(--color-primary);
}
.setup-icon.expenses {
  background: var(--color-warning-soft);
  color: var(--color-warning-dark);
}
.setup-copy {
  display: grid;
  min-width: 0;
}
.setup-copy > strong {
  font-size: var(--font-size-row-title);
}
.setup-copy small {
  margin-top: 0.1rem;
  color: var(--color-copy);
  font-size: var(--font-size-caption);
}
.setup-value,
.setup-action {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  justify-self: end;
  min-width: 0;
  text-align: right;
}
.setup-value > .q-icon {
  color: var(--color-success-dark);
}
.setup-value strong {
  overflow-wrap: anywhere;
}
.setup-action {
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 650;
  white-space: nowrap;
}
@media (max-width: bp.$xs-max) {
  .setup-row {
    grid-template-columns: auto minmax(0, 1fr) minmax(4.75rem, auto);
    gap: var(--space-2);
  }

  .setup-icon {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1.05rem;
  }

  .setup-value {
    gap: var(--space-1);
    font-size: var(--font-size-caption);
  }
}
</style>
