<template>
  <AppFormDialog
    :title="expense ? t('expenses.form.editTitle') : t('expenses.form.addTitle')"
    :cancel-label="t('common.cancel')"
    width="34rem"
    :disabled="saving"
    @submit="submit"
    @cancel="$emit('cancel')"
  >
    <div class="dialog-field">
      <label>{{ t('expenses.form.subcategory') }}</label>
      <q-select
        v-model="subcategoryId"
        outlined
        :dense="$q.screen.lt.sm"
        hide-bottom-space
        emit-value
        map-options
        :options="subcategoryOptions"
        :disable="Boolean(expense)"
        :rules="[(value) => Boolean(value) || t('expenses.validation.typeRequired')]"
        @update:model-value="applySuggestion"
      >
        <template #prepend>
          <q-icon :name="suggestionIcon" />
        </template>
      </q-select>
    </div>

    <div class="dialog-field">
      <label>{{ t('expenses.form.expenseName') }}</label>
      <q-input
        v-model="itemName"
        outlined
        :dense="$q.screen.lt.sm"
        hide-bottom-space
        :placeholder="t('expenses.form.expenseNamePlaceholder')"
        :rules="[(value) => Boolean(value?.trim()) || t('expenses.validation.itemNameRequired')]"
      />
    </div>

    <div class="form-grid">
      <div class="dialog-field">
        <label>{{
          isIrregular ? t('expenses.form.totalAnnualAmount') : t('expenses.form.amount')
        }}</label>
        <q-input
          v-model.number="amount"
          type="number"
          min="0"
          step="0.01"
          outlined
          :dense="$q.screen.lt.sm"
          hide-bottom-space
          :prefix="currencySymbol"
          :disable="managedByMortgage"
          :rules="[(value) => value >= 0 || t('expenses.validation.amount')]"
        />
      </div>
      <div class="dialog-field">
        <label>{{ t('expenses.form.frequency') }}</label>
        <q-select
          v-model="frequency"
          outlined
          :dense="$q.screen.lt.sm"
          hide-bottom-space
          emit-value
          map-options
          :options="frequencyOptions"
          :disable="managedByMortgage"
        />
      </div>
      <div v-if="showsMonthSelector" class="dialog-field full-row">
        <label>{{ monthSelectorLabel }}</label>
        <q-select
          v-model="startMonth"
          outlined
          :dense="$q.screen.lt.sm"
          hide-bottom-space
          emit-value
          map-options
          :options="monthOptions"
          :disable="managedByMortgage"
        />
      </div>
    </div>

    <div class="annual-summary" aria-live="polite">
      <span><q-icon name="calendar_month" /> {{ t('expenses.form.annualExpectedCost') }}</span>
      <strong>{{ formatCurrency(annualExpectedCost) }} / {{ t('dashboard.year') }}</strong>
    </div>

    <div v-if="isIrregular" class="irregular-schedule-notice" aria-live="polite">
      <q-icon :name="irregularScheduleValid ? 'check_circle' : 'info'" />
      <div>
        <strong>{{ t('expenses.form.fillMonthlySchedule') }}</strong>
        <span>
          {{
            t('expenses.form.irregularAllocation', {
              allocated: formatCurrency(scheduleTotal),
              total: formatCurrency(normalizedEstimate?.amount || 0),
            })
          }}
        </span>
      </div>
    </div>

    <div v-if="managedByMortgage" class="linked-mortgage-notice">
      <q-icon name="account_balance" color="primary" size="1.4rem" />
      <div>
        <strong>{{ t('expenses.form.managedByMortgage') }}</strong>
        <span>{{ linkedMortgage?.itemName || t('expenses.form.linkedMortgageUnavailable') }}</span>
      </div>
    </div>

    <div v-if="members.length > 1" class="ownership-section">
      <h3>{{ t('expenses.ownership.label') }}</h3>
      <OwnershipEditor
        v-model="ownership"
        :members="members"
        hide-label
        @validity="ownershipValid = $event"
      />
    </div>

    <q-expansion-item
      v-if="monthlyAmounts && !managedByMortgage"
      v-model="scheduleOpen"
      icon="calendar_month"
      :label="t('expenses.form.monthlySchedule')"
      :caption="monthlyScheduleSummary"
      class="form-expansion monthly-schedule-section"
    >
      <q-markup-table flat bordered dense class="monthly-schedule">
        <thead>
          <tr>
            <th class="text-left">{{ t('income.form.month') }}</th>
            <th class="text-right">{{ t('expenses.form.modelAmount') }}</th>
            <th class="text-right">{{ t('expenses.form.actualAmount') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="month in CALENDAR_MONTH_IDS" :key="month">
            <td>{{ t(`income.months.${month}`) }}</td>
            <td class="model-amount-cell">
              <q-btn
                flat
                dense
                no-caps
                class="model-amount-value"
                :label="formatCurrency(monthAmount(month))"
                :aria-label="t('expenses.form.editMonth', { month: t(`income.months.${month}`) })"
              >
                <q-popup-edit
                  :model-value="monthlyAmounts[month]"
                  buttons
                  :label-set="t('common.save')"
                  :label-cancel="t('common.cancel')"
                  @save="setMonthAmount(month, $event)"
                >
                  <template #default="scope">
                    <q-input
                      v-model="scope.value"
                      autofocus
                      dense
                      type="number"
                      min="0"
                      step="0.01"
                      :prefix="currencySymbol"
                      :label="
                        t('expenses.form.amountForMonth', {
                          month: t(`income.months.${month}`),
                        })
                      "
                      @keyup.enter="scope.set"
                    />
                  </template>
                </q-popup-edit>
              </q-btn>
            </td>
            <td class="text-right actual-amount">
              {{ actualAmount(month) == null ? '—' : formatCurrency(actualAmount(month)) }}
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </q-expansion-item>

    <q-expansion-item
      v-model="moreOptionsOpen"
      icon="tune"
      :label="t('expenses.form.moreOptions')"
      :caption="moreOptionsSummary"
      class="form-expansion more-options"
    >
      <div class="more-options-fields">
        <div class="dialog-field">
          <label>{{ t('expenses.form.variability') }}</label>
          <q-select
            v-model="variability"
            outlined
            :dense="$q.screen.lt.sm"
            hide-bottom-space
            emit-value
            map-options
            :options="variabilityOptions"
            :disable="managedByMortgage"
          />
        </div>
        <div class="dialog-field">
          <label>{{ t('expenses.form.recurrence') }}</label>
          <q-select
            v-model="recurrence"
            outlined
            :dense="$q.screen.lt.sm"
            hide-bottom-space
            emit-value
            map-options
            :options="recurrenceOptions"
            :disable="managedByMortgage"
          />
        </div>
        <div class="dialog-field">
          <label>{{ t('expenses.form.necessity') }}</label>
          <q-select
            v-model="necessity"
            outlined
            :dense="$q.screen.lt.sm"
            hide-bottom-space
            clearable
            emit-value
            map-options
            :options="necessityOptions"
          />
          <p class="field-hint">{{ t('expenses.form.necessityHint') }}</p>
        </div>
        <div class="dialog-field">
          <label>{{ t('expenses.form.notes') }}</label>
          <q-input
            v-model="notes"
            outlined
            :dense="$q.screen.lt.sm"
            hide-bottom-space
            autogrow
            type="textarea"
            :placeholder="t('expenses.form.notesPlaceholder')"
          />
        </div>
      </div>
    </q-expansion-item>
    <template #actions>
      <q-btn
        v-if="expense"
        flat
        no-caps
        color="negative"
        icon="delete_outline"
        :label="t('common.delete')"
        @click="$emit('delete')"
      />
      <div class="primary-actions">
        <q-btn outline no-caps :label="t('common.cancel')" @click="$emit('cancel')" />
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="primary"
          :label="expense ? t('expenses.form.saveChanges') : t('expenses.form.addExpenseAction')"
          :loading="saving"
          :disable="!formValid"
        />
      </div>
    </template>
  </AppFormDialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import OwnershipEditor from '@/components/financial/OwnershipEditor.vue'
import AppFormDialog from '@/components/ui/AppFormDialog.vue'
import { expenseTrackingCategories } from '@/config/expense-tracking-categories'
import {
  EXPENSE_NECESSITIES,
  EXPENSE_RECURRENCES,
  EXPENSE_VARIABILITIES,
  buildMonthlyExpenseSchedule,
  calculateAnnualExpenseScheduleAmount,
  normalizeExpenseClassification,
  normalizeExpenseEstimateModel,
  normalizeMonthlyExpenseSchedule,
  EXPENSE_FREQUENCIES,
  updateMonthlyExpenseSchedule,
} from '../../../functions/shared/expenses/calculations.js'
import { CALENDAR_MONTH_IDS } from '../../../functions/shared/core/calendar-months.js'
import { normalizeNonNegativeMoneyOrNull } from '../../../functions/shared/core/money.js'
import {
  cloneOwnershipAllocation,
  createEqualMemberOwnership,
  isValidOwnershipAllocation,
} from '../../../functions/shared/core/ownership.js'
import { currencySymbol, formatCurrency } from '@/utils/formatters'

const props = defineProps({
  category: { type: Object, required: true },
  expense: { type: Object, default: null },
  defaults: { type: Object, default: null },
  members: { type: Array, required: true },
  financialYear: { type: Object, default: null },
  saving: Boolean,
  mortgages: { type: Array, default: () => [] },
})
const emit = defineEmits(['save', 'cancel', 'delete'])
const { t } = useI18n()
const subcategoryId = ref(null)
const itemName = ref('')
const notes = ref('')
const amount = ref(0)
const frequency = ref('monthly')
const startMonth = ref('january')
const variability = ref('fixed')
const recurrence = ref('recurring')
const necessity = ref(null)
const ownership = ref(createEqualMemberOwnership(props.members.map((member) => member.id)))
const ownershipValid = ref(true)
const monthlyAmounts = ref(null)
const scheduleOpen = ref(false)
const moreOptionsOpen = ref(false)
let seeding = false

const option = (namespace) => (value) => ({ value, label: t(`expenses.${namespace}.${value}`) })
const frequencyOptions = computed(() =>
  EXPENSE_FREQUENCIES.map((value) => ({
    value,
    label: t(`expenses.form.frequencyOptions.${value}`),
  })),
)
const monthOptions = computed(() =>
  CALENDAR_MONTH_IDS.map((value) => ({ value, label: t(`income.months.${value}`) })),
)
const variabilityOptions = computed(() => EXPENSE_VARIABILITIES.map(option('variabilities')))
const recurrenceOptions = computed(() => EXPENSE_RECURRENCES.map(option('recurrences')))
const necessityOptions = computed(() => EXPENSE_NECESSITIES.map(option('necessities')))
const subcategoryOptions = computed(() =>
  props.category.suggestions.map((item) => ({ value: item.id, label: t(item.nameKey) })),
)
const linkedMortgage = computed(
  () => props.mortgages.find((mortgage) => mortgage.id === props.expense?.liabilityId) || null,
)
const managedByMortgage = computed(() => Boolean(props.expense?.liabilityId))
const suggestionIcon = computed(
  () =>
    expenseTrackingCategories.find(({ id }) => id === subcategoryId.value)?.icon ||
    props.category.icon ||
    'category',
)
const isIrregular = computed(() => frequency.value === 'irregular')
const showsMonthSelector = computed(() =>
  ['every_two_months', 'quarterly', 'yearly'].includes(frequency.value),
)
const monthSelectorLabel = computed(() =>
  frequency.value === 'yearly' ? t('expenses.form.paymentMonth') : t('expenses.form.startingMonth'),
)
const normalizedEstimate = computed(() =>
  normalizeExpenseEstimateModel({
    amount: amount.value,
    frequency: frequency.value,
    startMonth: showsMonthSelector.value ? startMonth.value : undefined,
  }),
)
const normalizedAttributes = computed(() =>
  normalizeExpenseClassification({
    variability: variability.value,
    recurrence: recurrence.value,
    necessity: necessity.value,
  }),
)
const scheduleTotal = computed(
  () => calculateAnnualExpenseScheduleAmount(monthlyAmounts.value) || 0,
)
const annualExpectedCost = computed(() =>
  isIrregular.value ? normalizedEstimate.value?.amount || 0 : scheduleTotal.value,
)
const irregularScheduleValid = computed(
  () =>
    !isIrregular.value ||
    Math.round(scheduleTotal.value * 100) ===
      Math.round((normalizedEstimate.value?.amount || 0) * 100),
)
const baselineSchedule = computed(() => buildMonthlyExpenseSchedule(normalizedEstimate.value))
const hasCustomMonthlySchedule = computed(() => {
  const schedule = normalizeMonthlyExpenseSchedule(monthlyAmounts.value)
  if (!schedule || !baselineSchedule.value) return false
  return CALENDAR_MONTH_IDS.some((month) => schedule[month] !== baselineSchedule.value[month])
})
const monthlyScheduleSummary = computed(() => {
  if (isIrregular.value) {
    return irregularScheduleValid.value
      ? t('expenses.form.scheduleSummaries.irregularComplete')
      : t('expenses.form.scheduleSummaries.irregular')
  }
  return hasCustomMonthlySchedule.value
    ? t('expenses.form.scheduleSummaries.custom')
    : t(`expenses.form.scheduleSummaries.${frequency.value}`)
})
const moreOptionsSummary = computed(() =>
  [
    necessity.value
      ? t(`expenses.necessities.${necessity.value}`)
      : t('expenses.necessities.unclassified'),
    t(`expenses.variabilities.${variability.value}`),
    t(`expenses.recurrences.${recurrence.value}`),
  ].join(' · '),
)
const formValid = computed(
  () =>
    Boolean(subcategoryId.value) &&
    Boolean(itemName.value.trim()) &&
    Boolean(normalizedEstimate.value) &&
    Boolean(normalizedAttributes.value) &&
    irregularScheduleValid.value &&
    ownershipValid.value,
)

watch(
  [amount, frequency, startMonth],
  (
    [nextAmount, nextFrequency, nextStartMonth],
    [previousAmount, previousFrequency, previousStartMonth],
  ) => {
    if (seeding) return
    monthlyAmounts.value = updateMonthlyExpenseSchedule(
      monthlyAmounts.value,
      { amount: previousAmount, frequency: previousFrequency, startMonth: previousStartMonth },
      { amount: nextAmount, frequency: nextFrequency, startMonth: nextStartMonth },
    )
    if (nextFrequency === 'irregular') scheduleOpen.value = true
  },
  { flush: 'sync' },
)
watch(() => [props.expense, props.defaults], seed, { immediate: true, deep: true })

function seed() {
  seeding = true
  scheduleOpen.value = false
  moreOptionsOpen.value = false
  const initial = props.expense || props.defaults || {}
  subcategoryId.value = initial.subcategoryId || subcategoryOptions.value[0]?.value || null
  const suggestion = props.category.suggestions.find(({ id }) => id === subcategoryId.value)
  itemName.value = initial.itemName || ''
  notes.value = initial.notes || ''
  amount.value = initial.estimate?.amount ?? 0
  frequency.value = initial.estimate?.frequency || suggestion?.defaults.frequency || 'monthly'
  startMonth.value = initial.estimate?.startMonth || 'january'
  monthlyAmounts.value =
    normalizeMonthlyExpenseSchedule(initial.monthlyAmounts) ||
    buildMonthlyExpenseSchedule(initial.estimate || { amount: 0, frequency: frequency.value })
  variability.value = initial.variability || suggestion?.defaults.variability || 'fixed'
  recurrence.value = initial.recurrence || suggestion?.defaults.recurrence || 'recurring'
  necessity.value = initial.necessity ?? suggestion?.defaults.necessity ?? null
  ownership.value = initial.ownership
    ? cloneOwnershipAllocation(initial.ownership)
    : createEqualMemberOwnership(props.members.map((member) => member.id))
  ownershipValid.value = isValidOwnershipAllocation(
    ownership.value,
    props.members.map((member) => member.id),
  )
  scheduleOpen.value = frequency.value === 'irregular'
  seeding = false
}

function monthAmount(month) {
  return normalizeNonNegativeMoneyOrNull(monthlyAmounts.value?.[month]) || 0
}

function actualAmount(month) {
  return financialYearMonthExpense(month)?.actual ?? null
}

function financialYearMonthExpense(month) {
  const monthNumber = CALENDAR_MONTH_IDS.indexOf(month) + 1
  if (monthNumber < 1 || !props.expense?.id) return null
  const monthKey = String(monthNumber).padStart(2, '0')
  return (
    props.financialYear?.months?.[monthKey]?.expenses?.categories?.[props.category.id]
      ?.subcategories?.[subcategoryId.value]?.items?.[props.expense.id] || null
  )
}

function setMonthAmount(month, value) {
  const normalized = normalizeNonNegativeMoneyOrNull(value)
  if (normalized === null) return
  monthlyAmounts.value = { ...monthlyAmounts.value, [month]: normalized }
}

function applySuggestion(value) {
  const suggestion = props.category.suggestions.find((item) => item.id === value)
  if (suggestion) {
    frequency.value = suggestion.defaults.frequency
    variability.value = suggestion.defaults.variability
    recurrence.value = suggestion.defaults.recurrence
    necessity.value = suggestion.defaults.necessity
    return
  }

  if (value === 'other') {
    frequency.value = 'monthly'
    variability.value = 'fixed'
    recurrence.value = 'recurring'
    necessity.value = null
  }
}

function submit() {
  if (!normalizedAttributes.value) moreOptionsOpen.value = true
  if (!irregularScheduleValid.value) scheduleOpen.value = true
  if (!formValid.value) return
  emit('save', {
    categoryId: props.category.id,
    subcategoryId: subcategoryId.value,
    itemName: itemName.value.trim(),
    notes: notes.value.trim(),
    estimate: normalizedEstimate.value,
    monthlyAmounts: normalizeMonthlyExpenseSchedule(monthlyAmounts.value),
    ...normalizedAttributes.value,
    ownership: cloneOwnershipAllocation(ownership.value),
    liabilityId: props.expense?.liabilityId || null,
  })
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.dialog-field {
  @include financial-dialog-field;
}

.field-hint {
  @include financial-dialog-hint;
}

.linked-mortgage-notice {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-soft);
}

.linked-mortgage-notice div {
  display: grid;
  gap: 0.2rem;
}

.linked-mortgage-notice span {
  color: var(--color-copy);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.form-grid .dialog-field {
  margin-bottom: 0;
}

.form-grid .full-row {
  grid-column: 1 / -1;
}

.annual-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin: 0.85rem 0 0;
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, var(--color-blue-soft), var(--color-green-soft));
  color: var(--color-ink);
  font-size: 0.78rem;
}

.annual-summary span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.annual-summary .q-icon {
  color: var(--color-success-dark);
  font-size: 1rem;
}

.annual-summary strong {
  flex: 0 0 auto;
  color: var(--color-ink);
  font-size: 0.86rem;
  white-space: nowrap;
}

.irregular-schedule-notice {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  margin-top: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-md);
  background: var(--color-blue-soft);
  color: var(--color-ink);
}

.irregular-schedule-notice .q-icon {
  margin-top: 0.1rem;
  color: var(--q-primary);
  font-size: 1.1rem;
}

.irregular-schedule-notice div {
  display: grid;
  gap: 0.15rem;
}

.irregular-schedule-notice strong {
  font-size: 0.78rem;
}

.irregular-schedule-notice span {
  color: var(--color-copy);
  font-size: 0.7rem;
}

.form-expansion {
  margin-top: 0.75rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.form-expansion :deep(.q-expansion-item__content) {
  padding: 0 1rem 1rem;
}

.form-expansion :deep(.q-item) {
  min-height: 3.75rem;
  padding: 0.65rem 0.9rem;
  color: var(--color-ink);
}

.form-expansion :deep(.q-item__label) {
  font-size: 0.84rem;
  font-weight: var(--font-weight-bold);
}

.form-expansion :deep(.q-item__label--caption) {
  margin-top: 0.1rem;
  color: var(--color-copy);
  font-size: 0.68rem;
  font-weight: 400;
}

.monthly-schedule {
  margin-top: 0.25rem;
  overflow: visible;
}

.monthly-schedule th {
  color: var(--color-copy);
  font-size: 0.72rem;
  font-weight: var(--font-weight-semibold);
}

.monthly-schedule td {
  color: var(--color-ink);
  font-size: 0.78rem;
}

.model-amount-cell {
  width: 8rem;
  text-align: right;
}

.model-amount-value {
  min-width: 6.5rem;
  color: var(--color-ink);
  font-weight: var(--font-weight-semibold);
}

.model-amount-value :deep(.q-btn__content) {
  justify-content: flex-end;
}

.actual-amount {
  width: 7rem;
  color: var(--color-copy) !important;
  font-weight: var(--font-weight-semibold);
}

.more-options-fields {
  display: grid;
  gap: 0.85rem;
}

.more-options-fields .dialog-field {
  margin-bottom: 0;
}

.ownership-section {
  margin-top: 1.15rem;
}

.ownership-section h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  line-height: 1.2;
  white-space: nowrap;
}

@media (max-width: 599px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .annual-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }

  .form-expansion :deep(.q-expansion-item__content) {
    padding-right: 0.5rem;
    padding-left: 0.5rem;
  }

  .model-amount-cell,
  .actual-amount {
    width: auto;
  }

  .model-amount-value {
    min-width: 4.75rem;
  }
}
</style>
