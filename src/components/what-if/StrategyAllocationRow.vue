<template>
  <article :class="['allocation-card', tone, { 'has-actions': $slots.actions }]">
    <span :class="['allocation-icon', tone]"><q-icon :name="icon" /></span>
    <div class="allocation-identity">
      <span class="allocation-title-line">
        <strong class="app-row-title">{{ title }}</strong>
        <button
          v-if="expandable"
          type="button"
          class="allocation-expand"
          :aria-expanded="expanded"
          :aria-label="title"
          @click="emit('toggle')"
        >
          <q-icon :name="expanded ? 'expand_less' : 'expand_more'" />
        </button>
      </span>
      <small class="app-caption">{{ description }}</small>
      <span class="allocation-track" aria-hidden="true">
        <i :class="tone" :style="{ width: `${percent}%` }" />
      </span>
    </div>
    <button type="button" class="allocation-values" :aria-label="`Edit ${title} allocation`">
      <strong class="app-row-value">{{ percent }}%</strong>
      <small class="app-caption">{{ formatCurrency(amount) }} / month</small>
      <q-popup-edit
        :model-value="percent"
        buttons
        :title="`Edit ${title} allocation`"
        :label-set="t('common.save')"
        :label-cancel="t('common.cancel')"
        anchor="bottom right"
        self="top right"
        @save="save"
      >
        <template #default="scope">
          <q-input
            v-model.number="scope.value"
            autofocus
            dense
            outlined
            type="number"
            inputmode="numeric"
            min="0"
            max="100"
            step="5"
            suffix="%"
            :label="title"
            @keyup.enter="scope.set"
          />
        </template>
      </q-popup-edit>
    </button>
    <div v-if="$slots.actions" class="allocation-actions">
      <slot name="actions" />
    </div>
    <div v-if="$slots.default && (!expandable || expanded)" class="allocation-details">
      <slot />
    </div>
  </article>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@/utils/formatters'

defineProps({
  icon: { type: String, required: true },
  tone: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  percent: { type: Number, required: true },
  amount: { type: Number, required: true },
  expandable: Boolean,
  expanded: Boolean,
})

const emit = defineEmits(['change', 'toggle'])
const { t } = useI18n()

function save(value) {
  emit('change', Math.min(100, Math.max(0, Number(value) || 0)))
}
</script>

<style scoped lang="scss">
.allocation-card {
  --allocation-color: var(--color-primary);
  --allocation-soft: var(--color-blue-soft);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--color-line);
  border-radius: 0.8rem;
  background: white;
}

.allocation-card.has-actions {
  grid-template-columns: auto minmax(0, 1fr) auto auto;
}

.allocation-card.cash,
.allocation-card.fixed-income {
  --allocation-color: var(--color-success-dark);
  --allocation-soft: var(--color-green-soft);
}

.allocation-card.debt,
.allocation-card.real-estate {
  --allocation-color: var(--color-warning);
  --allocation-soft: var(--color-warning-soft);
}

.allocation-card.crypto {
  --allocation-color: var(--color-purple);
  --allocation-soft: var(--color-purple-soft);
}

.allocation-card.business {
  --allocation-color: var(--color-success);
  --allocation-soft: var(--color-green-soft);
}

.allocation-card.other {
  --allocation-color: var(--color-copy);
  --allocation-soft: var(--color-surface-muted);
}

.allocation-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--allocation-soft);
  color: var(--allocation-color);
  font-size: 1.3rem;
}

.allocation-identity,
.allocation-values {
  display: grid;
}

.allocation-identity {
  gap: 0.1rem;
}

.allocation-title-line {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.allocation-expand {
  display: inline-grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-copy);
  cursor: pointer;
}

.allocation-expand:hover,
.allocation-expand:focus-visible {
  background: var(--color-surface-soft);
  color: var(--color-primary);
  outline: 2px solid var(--color-primary-focus);
}

.allocation-values {
  padding: 0.2rem 0;
  border: 0;
  border-bottom: 1px dashed transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  min-width: 7rem;
  justify-items: end;
  cursor: pointer;
}

.allocation-values:hover,
.allocation-values:focus-visible {
  border-bottom-color: var(--color-primary);
  outline: 0;
}

.allocation-track {
  width: 100%;
  height: 0.42rem;
  margin-top: 0.35rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e9eef3;
}

.allocation-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--allocation-color);
}

.allocation-actions {
  display: flex;
  align-items: center;
}

.allocation-details {
  grid-column: 1 / -1;
  min-width: 0;
  margin-top: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-line);
}

@media (max-width: 520px) {
  .allocation-card {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.65rem;
  }

  .allocation-icon {
    width: 2.6rem;
    height: 2.6rem;
  }

  .allocation-values {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    justify-items: start;
  }

  .allocation-card.has-actions {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .allocation-actions {
    grid-column: 3;
    grid-row: 1 / span 2;
  }
}
</style>
