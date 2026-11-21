<template>
  <q-dialog v-model="dialogModel" :position="$q.screen.lt.sm ? 'bottom' : undefined">
    <q-card
      class="review-dialog-card"
      :class="`tracking-category--${group?.id || subcategory?.categoryId || ''}`"
    >
      <span class="sheet-handle" aria-hidden="true" />
      <q-card-section class="review-dialog-heading">
        <q-btn
          v-if="subcategory"
          flat
          round
          dense
          icon="arrow_back"
          class="review-back"
          :aria-label="t('expenseTracker.review.backToGroup')"
          @click="emit('back')"
        />
        <span v-else class="items-category-icon" :class="`tracking-category--${group?.id || ''}`">
          <q-icon :name="group?.icon" />
        </span>
        <div class="items-title">
          <span>{{ periodLabel }}</span>
          <h2>{{ title }}</h2>
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          class="dialog-close"
          :aria-label="t('common.cancel')"
          :disable="saving"
          v-close-popup
        />
      </q-card-section>

      <q-card-section v-if="!subcategory && group" class="review-group-detail">
        <section class="review-progress-card">
          <div class="review-progress-heading">
            <div>
              <span>{{ t('expenseTracker.review.spentThisMonth') }}</span>
              <p>
                <strong>{{ formatCurrency(groupTrackedTotal) }}</strong>
                <span>/ {{ formatCurrency(groupModelTotal) }}</span>
              </p>
            </div>
            <span class="review-progress-badge" :class="groupPlanTone">
              <q-icon :name="groupPlanPercentage > 100 ? 'arrow_upward' : 'arrow_downward'" />
              <strong>{{ formatPercentage(groupPlanPercentage) }}</strong>
              {{ t('expenseTracker.review.ofPlan') }}
            </span>
          </div>
          <div class="review-progress-track" aria-hidden="true">
            <span :class="groupPlanTone" :style="{ width: `${groupPlanProgress}%` }" />
          </div>
        </section>

        <div class="review-subcategories-heading">
          <h3>{{ t('expenseTracker.review.subcategories') }}</h3>
          <span><q-icon name="info_outline" />{{ t('expenseTracker.review.chooseAmount') }}</span>
        </div>

        <article v-for="item in group.subcategories" :key="item.id" class="review-category-row">
          <button type="button" class="review-category-identity" @click="openSubcategory(item)">
            <span class="review-category-icon" :class="`tracking-category--${item.categoryId}`">
              <q-icon :name="item.icon" />
            </span>
            <span class="review-category-copy">
              <strong>{{ t(item.nameKey) }}</strong>
              <small>{{ t('expenseTracker.review.itemCount', { count: item.itemCount }) }}</small>
            </span>
          </button>
          <div class="review-category-values">
            <span
              ><small>{{ t('expenseTracker.review.actual') }}</small
              ><strong>{{ formatCurrency(item.trackedTotal) }}</strong></span
            >
            <span
              ><small>{{ t('expenseTracker.review.planned') }}</small
              ><strong>{{ formatCurrency(item.modelValue) }}</strong></span
            >
            <span
              ><small>{{ t('expenseTracker.review.addBoth') }}</small
              ><strong>{{ formatCurrency(item.modelValue + item.trackedTotal) }}</strong></span
            >
          </div>
          <div class="review-category-decisions" role="group" :aria-label="t(item.nameKey)">
            <button
              v-for="option in decisionOptions"
              :key="option.value"
              type="button"
              class="review-category-decision"
              :class="{ selected: decisionFor(item) === option.value }"
              :disabled="saving"
              @click="emit('set-decision', item, option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <q-btn
            flat
            round
            dense
            icon="chevron_right"
            color="primary"
            class="review-category-open"
            :aria-label="t('expenseTracker.review.view')"
            @click="openSubcategory(item)"
          />
        </article>

        <div class="review-plan-note">
          <q-icon name="info_outline" />
          <span>{{ t('expenseTracker.review.updateNote') }}</span>
        </div>
      </q-card-section>

      <q-card-section v-else-if="subcategory" class="items-list">
        <div class="subcategory-total">
          <strong>{{ formatCurrency(trackedTotal) }}</strong>
          <span>{{ t('expenseTracker.review.itemCount', { count: trackedItems.length }) }}</span>
        </div>
        <div class="items-summary">
          <div>
            <span class="items-summary-icon" aria-hidden="true"><q-icon name="show_chart" /></span>
            <span
              ><strong>{{ formatCurrency(averageTrackedAmount) }}</strong
              ><small>{{ t('expenseTracker.detail.average') }}</small></span
            >
          </div>
          <div>
            <span class="items-summary-icon" aria-hidden="true"
              ><q-icon name="receipt_long"
            /></span>
            <span
              ><strong>{{ trackedItems.length }}</strong
              ><small>{{ t('expenseTracker.detail.transactions') }}</small></span
            >
          </div>
        </div>
        <div v-if="expenseBreakdown.length" class="item-breakdown">
          <div v-for="expenseItem in expenseBreakdown" :key="expenseItem.id">
            <span>{{ expenseItem.itemName }}</span>
            <strong>{{ formatCurrency(expenseItem.trackedTotal) }}</strong>
          </div>
        </div>
        <article v-for="item in trackedItems" :key="item.id" class="item-row">
          <time class="item-date" :datetime="itemDateIso(item.date)">
            <strong>{{ itemDateDay(item.date) }}</strong>
            <span>{{ itemDateMonth(item.date) }}</span>
          </time>
          <div class="item-copy">
            <strong>{{ formatCurrency(item.amount) }}</strong>
            <span v-if="trackedItemName(item)">{{ trackedItemName(item) }}</span>
            <small v-if="item.notes">{{ item.notes }}</small>
          </div>
          <div v-if="canMutate" class="item-actions">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              :aria-label="t('common.edit')"
              @click="emit('edit-item', item)"
            />
            <q-btn
              flat
              round
              dense
              icon="delete_outline"
              color="negative"
              :aria-label="t('common.delete')"
              @click="emit('delete-item', item)"
            />
          </div>
        </article>
        <div v-if="!trackedItems.length" class="items-empty">
          {{ t('expenseTracker.review.noItems') }}
        </div>
      </q-card-section>

      <q-card-actions v-if="!subcategory && group" class="review-plan-actions">
        <q-btn flat no-caps :label="t('common.cancel')" :disable="saving" v-close-popup />
        <q-btn
          unelevated
          no-caps
          color="positive"
          class="app-btn--wide"
          icon="check"
          :label="t('expenseTracker.review.updatePlan')"
          :loading="saving"
          :disable="!hasChanges"
          @click="emit('save')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@/utils/formatters'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  group: { type: Object, default: null },
  subcategory: { type: Object, default: null },
  periodLabel: { type: String, default: '' },
  decisionOptions: { type: Array, default: () => [] },
  draftDecisions: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false },
  hasChanges: { type: Boolean, default: false },
  trackedItems: { type: Array, default: () => [] },
  expenseBreakdown: { type: Array, default: () => [] },
  trackedTotal: { type: Number, default: 0 },
  canMutate: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'back',
  'open-subcategory',
  'set-decision',
  'save',
  'edit-item',
  'delete-item',
])
const { t, locale } = useI18n()
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const title = computed(() =>
  props.subcategory ? t(props.subcategory.nameKey) : props.group ? t(props.group.nameKey) : '',
)
const groupTrackedTotal = computed(
  () =>
    props.group?.subcategories.reduce((total, item) => total + Number(item.trackedTotal || 0), 0) ||
    0,
)
const groupModelTotal = computed(
  () =>
    props.group?.subcategories.reduce((total, item) => total + Number(item.modelValue || 0), 0) ||
    0,
)
const groupPlanPercentage = computed(() =>
  groupModelTotal.value > 0
    ? (groupTrackedTotal.value / groupModelTotal.value) * 100
    : groupTrackedTotal.value > 0
      ? 100
      : 0,
)
const groupPlanProgress = computed(() => Math.min(100, Math.max(0, groupPlanPercentage.value)))
const groupPlanTone = computed(() => (groupPlanPercentage.value > 100 ? 'over' : 'under'))
const averageTrackedAmount = computed(() =>
  props.trackedItems.length ? props.trackedTotal / props.trackedItems.length : 0,
)

function decisionFor(item) {
  return props.draftDecisions[item.id] || item.decision
}
function openSubcategory(item) {
  emit('open-subcategory', item)
}
function itemDate(value) {
  return value?.toDate ? value.toDate() : new Date(value)
}
function itemDateDay(value) {
  return new Intl.DateTimeFormat(locale.value, { day: '2-digit' }).format(itemDate(value))
}
function itemDateMonth(value) {
  return new Intl.DateTimeFormat(locale.value, { month: 'short' })
    .format(itemDate(value))
    .replace('.', '')
    .toUpperCase()
}
function itemDateIso(value) {
  const date = itemDate(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}
function trackedItemName(entry) {
  return props.expenseBreakdown.find(({ id }) => id === entry.itemId)?.itemName || ''
}
function formatPercentage(value) {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value) + '%'
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;
@use '@/css/themes/expense-categories' as tracking;

@include tracking.category-colors;

.review-dialog-card {
  @include financial-dialog-card(78rem);
  display: flex;
  flex-direction: column;
  --tracking-color: var(--color-primary);
  --tracking-soft: var(--color-blue-soft);
  --review-positive-soft: #dff4e5;
  --review-positive: #12623b;
  --review-negative-soft: #ffe6e3;
  --review-negative: #a72a2a;
  --review-progress: #31a565;
  --review-progress-over: #d44848;
  --review-progress-track: rgb(79 97 126 / 14%);
  --review-row-shadow: 0 5px 18px rgb(34 55 78 / 5%);
  --review-actions-shadow: 0 -8px 24px rgb(11 22 51 / 6%);
}

.sheet-handle {
  display: none;
}
.review-dialog-heading {
  @include financial-dialog-header;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
}
.items-title {
  display: grid;
  min-width: 0;
}
.items-title > span {
  color: var(--color-copy);
  text-transform: capitalize;
}
.items-title h2 {
  margin: 0.2rem 0 0;
}
.review-back {
  color: var(--tracking-color);
}
.items-category-icon {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  place-items: center;
  border-radius: 50%;
  background: var(--tracking-soft);
  color: var(--tracking-color);
  font-size: 2rem;
}
.review-group-detail {
  @include financial-dialog-body;
  display: grid;
  gap: 0;
  padding-top: 0.5rem;
  overflow-x: hidden;
}
.review-progress-card {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.25rem 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--color-surface-soft), var(--tracking-soft));
}
.review-progress-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.review-progress-heading > div > span {
  color: var(--color-copy);
  font-size: 0.9rem;
}
.review-progress-heading p {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  margin: 0.2rem 0 0;
}
.review-progress-heading p strong {
  color: var(--color-ink);
  font-size: 2.25rem;
  line-height: 1;
  letter-spacing: -0.04em;
}
.review-progress-heading p span {
  color: var(--color-copy);
  font-size: 1.35rem;
  font-weight: 700;
}
.review-progress-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: var(--review-positive-soft);
  color: var(--review-positive);
  white-space: nowrap;
}
.review-progress-badge.over {
  background: var(--review-negative-soft);
  color: var(--review-negative);
}
.review-progress-badge .q-icon {
  font-size: 1.2rem;
}
.review-progress-track {
  height: 0.7rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--review-progress-track);
}
.review-progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--review-progress);
  transition: width 180ms ease;
}
.review-progress-track > span.over {
  background: var(--review-progress-over);
}
.review-subcategories-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.25rem;
}
.review-subcategories-heading h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: 1.2rem;
}
.review-subcategories-heading > span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-copy);
  font-size: 0.82rem;
}
.review-category-row {
  display: grid;
  grid-template-columns: minmax(12rem, 1.3fr) minmax(14rem, 0.8fr) minmax(15rem, 1fr) auto;
  align-items: center;
  gap: 1rem;
  min-height: 5.4rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-line);
}
.review-category-row:last-child {
  border-bottom: 0;
}
.review-category-identity {
  @include button-reset;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  width: 100%;
  color: var(--color-ink);
}
.review-category-identity:focus-visible,
.review-category-decision:focus-visible {
  @include focus-ring;
}
.review-category-icon {
  display: grid;
  flex: 0 0 2.8rem;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  border-radius: 0.8rem;
  background: color-mix(in srgb, var(--tracking-soft) 80%, var(--color-surface));
  color: var(--tracking-color);
  font-size: 1.35rem;
}
.review-category-copy,
.review-category-values > span {
  display: grid;
  min-width: 0;
}
.review-category-copy small,
.review-category-values small {
  color: var(--color-copy);
  font-size: 0.72rem;
}
.review-category-values {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.review-category-values > span {
  gap: 0.1rem;
  padding: 0 0.85rem;
}
.review-category-values > span + span {
  border-left: 1px solid var(--color-line);
}
.review-category-values strong {
  color: var(--color-ink);
  font-size: 1rem;
}
.review-category-decisions {
  display: flex;
  width: 100%;
  min-width: 0;
  padding: 0.2rem;
  border: 1px solid var(--color-line-strong);
  border-radius: 999px;
  background: var(--color-surface-soft);
}
.review-category-decision {
  @include segmented-button;
  flex: 1 1 33.333%;
  gap: 0.3rem;
  min-height: 2.45rem;
  padding: 0.35rem 0.8rem;
  color: var(--color-copy);
  font-size: 0.75rem;
}
.review-category-decision.selected {
  background: var(--review-positive-soft);
  color: var(--review-positive);
  box-shadow: var(--shadow-control);
}
.review-category-decision:disabled {
  cursor: default;
  opacity: 0.5;
}
.review-category-open {
  color: var(--tracking-color);
}
.review-plan-note {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1.25rem;
  padding: 0.9rem 1rem;
  border-radius: 0.8rem;
  background: var(--color-surface-soft);
  color: var(--color-copy);
  font-size: 0.82rem;
}
.review-plan-note .q-icon {
  flex: 0 0 auto;
  font-size: 1.3rem;
}
.review-plan-actions {
  @include financial-dialog-actions;
}
.subcategory-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.subcategory-total strong {
  color: var(--color-ink);
  font-size: 2rem;
}
.subcategory-total span,
.items-empty,
.item-row small {
  color: var(--color-copy);
}
.items-list {
  @include financial-dialog-body;
  display: grid;
  gap: 0.7rem;
}
.items-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--tracking-soft) 55%, var(--color-surface));
}
.items-summary > div {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  padding: 1rem;
}
.items-summary > div + div {
  border-left: 1px solid color-mix(in srgb, var(--tracking-color) 18%, transparent);
}
.items-summary-icon {
  display: grid !important;
  flex: 0 0 2rem;
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  place-items: center;
  overflow: hidden;
}
.items-summary-icon .q-icon {
  position: static;
  width: 1em;
  height: 1em;
  margin: 0;
  transform: none;
  flex: 0 0 auto;
  color: var(--tracking-color);
  font-size: 1.65rem;
}
.items-summary span,
.item-copy {
  display: grid;
  min-width: 0;
}
.items-summary strong {
  color: var(--color-ink);
  font-size: 1.15rem;
}
.items-summary small {
  overflow: hidden;
  color: var(--color-copy);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.item-breakdown {
  display: grid;
  gap: 0.45rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-line);
  border-radius: 0.8rem;
  background: var(--color-surface-soft);
}
.item-breakdown > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.item-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-line);
  border-radius: 0.8rem;
  background: var(--color-surface);
}
.item-copy > strong {
  color: var(--color-ink);
  font-size: 1rem;
}
.item-copy > span {
  margin-top: 0.08rem;
  color: var(--color-ink);
  font-size: 0.82rem;
  font-weight: 600;
}
.item-copy > small {
  overflow: hidden;
  margin-top: 0.08rem;
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-date {
  display: grid;
  width: 3.25rem;
  min-height: 3.5rem;
  place-content: center;
  justify-items: center;
  border-radius: 0.7rem;
  background: var(--color-surface-muted);
  color: var(--color-ink);
  font-style: normal;
}
.item-date strong {
  font-size: 1.05rem;
  line-height: 1;
}
.item-date span {
  margin-top: 0.2rem;
  color: var(--color-copy);
  font-size: 0.62rem;
  font-weight: 700;
}
.item-actions {
  display: flex;
  align-items: center;
}

@media (min-width: (bp.$xs-max + 1px)) {
  .review-dialog-card {
    width: min(78rem, calc(100vw - 3rem));
    max-width: none;
    max-height: none;
  }
  .review-group-detail {
    flex: 0 1 auto;
    min-height: auto;
    overflow-y: visible;
  }
}

@media (max-width: bp.$md-max) {
  .review-category-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.65rem 1rem;
  }
  .review-category-identity {
    grid-column: 1;
    grid-row: 1;
  }
  .review-category-open {
    grid-column: 2;
    grid-row: 1;
  }
  .review-category-values {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .review-category-decisions {
    grid-column: 1 / -1;
    grid-row: 3;
  }
}

@media (max-width: bp.$xs-max) {
  .review-dialog-card {
    width: 100vw;
    max-width: none;
    max-height: 94dvh;
    border-width: 1px 0 0;
    border-radius: 1.8rem 1.8rem 0 0;
  }
  .sheet-handle {
    display: block;
    flex: 0 0 auto;
    width: 3.25rem;
    height: 0.32rem;
    margin: 0.75rem auto 0;
    border-radius: 999px;
    background: var(--color-line-strong);
  }
  .review-dialog-heading {
    gap: 0.8rem;
    padding: 0.8rem 1rem 0.7rem;
  }
  .review-group-detail {
    display: block;
    padding: 0.45rem 0.85rem 1rem;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .review-progress-card {
    gap: 0.65rem;
    margin-bottom: 1rem;
    padding: 0.85rem;
    border-radius: 0.9rem;
  }
  .review-progress-heading {
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .review-progress-heading p strong {
    font-size: 1.65rem;
  }
  .review-progress-heading p span {
    font-size: 1rem;
  }
  .review-progress-badge {
    padding: 0.4rem 0.6rem;
    font-size: 0.7rem;
  }
  .review-subcategories-heading {
    display: grid;
    gap: 0.25rem;
    margin-bottom: 0.7rem;
  }
  .review-subcategories-heading > span {
    font-size: 0.7rem;
    text-align: left;
  }
  .review-category-row {
    gap: 0.75rem;
    min-height: 0;
    margin-bottom: 0.7rem;
    padding: 0.85rem;
    border: 1px solid var(--color-line);
    border-radius: 1rem;
    background: var(--color-surface);
    box-shadow: var(--review-row-shadow);
  }
  .review-category-row:last-child {
    margin-bottom: 0;
    border-bottom: 1px solid var(--color-line);
  }
  .review-category-values {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: hidden;
    padding: 0;
    border-radius: 0.75rem;
    background: var(--color-surface-soft);
  }
  .review-category-values > span {
    gap: 0.15rem;
    padding: 0.5rem 0.4rem;
  }
  .review-category-values small {
    overflow: hidden;
    font-size: 0.65rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .review-category-values strong {
    font-size: 0.9rem;
    white-space: nowrap;
  }
  .review-category-decision {
    min-width: 0;
    min-height: 2.5rem;
    padding-inline: 0.5rem;
    font-size: 0.72rem;
    white-space: nowrap;
  }
  .review-plan-note {
    margin-top: 0.75rem;
    padding: 0.75rem;
    font-size: 0.74rem;
  }
  .review-plan-actions {
    position: relative;
    z-index: 1;
    min-height: 4.5rem;
    padding: 0.7rem max(1rem, env(safe-area-inset-right)) max(0.7rem, env(safe-area-inset-bottom))
      max(1rem, env(safe-area-inset-left));
    box-shadow: var(--review-actions-shadow);
  }
  .review-plan-actions .app-btn--wide {
    flex: 1 1 auto;
    min-width: 0;
    min-height: var(--button-height-lg);
  }
  .items-category-icon {
    width: 3.75rem;
    height: 3.75rem;
    font-size: 1.65rem;
  }
  .items-title h2 {
    font-size: 1.65rem;
  }
  .items-list {
    gap: 0.6rem;
    padding: 0.6rem 1rem 1rem;
  }
  .items-summary > div {
    gap: 0.6rem;
    padding: 0.85rem;
  }
  .items-summary-icon .q-icon {
    font-size: 1.4rem;
  }
  .item-row {
    gap: 0.5rem;
    padding: 0.55rem 0.6rem;
  }
}
</style>
