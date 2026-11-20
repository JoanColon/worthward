<template>
  <AppFormDialog
    ref="form"
    :title="liability ? t('liabilities.form.editTitle') : t(category.addLabelKey)"
    :cancel-label="t('common.cancel')"
    width="38rem"
    :disabled="saving || submitting"
    @submit="submit"
    @cancel="$emit('cancel')"
  >
    <div class="liability-form">
      <div class="dialog-field">
        <label>{{ t('liabilities.form.subcategory') }}</label>
        <q-select
          v-model="subcategoryId"
          outlined
          :dense="$q.screen.lt.sm"
          hide-bottom-space
          emit-value
          map-options
          :options="subcategoryOptions"
          :disable="Boolean(liability)"
        >
          <template #prepend><q-icon :name="category.icon" /></template>
        </q-select>
      </div>
      <div class="dialog-field">
        <label>{{ t('liabilities.form.name') }}</label>
        <q-input
          v-model.trim="name"
          outlined
          :dense="$q.screen.lt.sm"
          hide-bottom-space
          autofocus
          maxlength="80"
          lazy-rules
          :rules="[(value) => Boolean(value) || t('liabilities.form.nameRequired')]"
        />
      </div>
      <div class="dialog-field">
        <label>{{ t('liabilities.form.notes') }}</label>
        <q-input
          v-model="notes"
          outlined
          :dense="$q.screen.lt.sm"
          hide-bottom-space
          autogrow
          type="textarea"
          :placeholder="t('liabilities.form.notesPlaceholder')"
        />
      </div>
      <div class="dialog-field">
        <label>{{ t('liabilities.form.balance') }}</label>
        <q-input
          v-model="balance"
          outlined
          :dense="$q.screen.lt.sm"
          hide-bottom-space
          type="number"
          min="0"
          step="0.01"
          :prefix="currencySymbol"
          :readonly="modelManaged"
          lazy-rules
          :rules="[
            (value) =>
              normalizeNonNegativeMoneyOrNull(value) !== null ||
              t('liabilities.form.balanceInvalid'),
          ]"
        />
      </div>

      <OwnershipEditor v-model="ownership" :members="members" @validity="ownershipValid = $event" />
    </div>
    <template #actions>
      <q-btn
        v-if="liability"
        flat
        no-caps
        color="negative"
        icon="delete_outline"
        :label="t('common.delete')"
        :disable="saving || submitting"
        @click="$emit('delete')"
      />
      <div class="primary-actions">
        <q-btn
          outline
          no-caps
          :label="t('common.cancel')"
          :disable="saving || submitting"
          @click="$emit('cancel')"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          type="submit"
          :label="liability ? t('common.save') : t('common.add')"
          :loading="saving || submitting"
          :disable="!ownershipValid || saving || submitting"
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
import {
  cloneOwnershipAllocation,
  createEqualMemberOwnership,
  isValidOwnershipAllocation,
} from '../../../functions/shared/core/ownership.js'
import { normalizeNonNegativeMoneyOrNull } from '../../../functions/shared/core/money.js'
import { currencySymbol } from '@/utils/formatters'

const props = defineProps({
  category: { type: Object, required: true },
  liability: { type: Object, default: null },
  defaults: { type: Object, default: null },
  members: { type: Array, required: true },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['save', 'cancel', 'delete'])
const { t } = useI18n()
const form = ref(null)
const subcategoryId = ref('')
const name = ref('')
const notes = ref('')
const balance = ref('')
const ownership = ref(createEqualMemberOwnership(props.members.map((member) => member.id)))
const ownershipValid = ref(true)
const submitting = ref(false)

const subcategoryOptions = computed(() =>
  props.category.subcategories.map((value) => ({
    value,
    label: t(props.category.nameKey),
  })),
)
const modelManaged = computed(() => Boolean(props.liability?.detail?.mortgage?.schemaVersion === 2))

watch(() => [props.liability, props.defaults, props.category.id], reset, { immediate: true })
watch(
  () => props.saving,
  (saving) => {
    if (!saving) submitting.value = false
  },
)

function reset() {
  const initial = props.liability || props.defaults
  subcategoryId.value = initial?.subcategoryId || props.category.subcategories[0]
  name.value = initial?.itemName || ''
  notes.value = initial?.notes || ''
  balance.value = initial?.balance ?? ''
  ownership.value = initial?.ownership
    ? cloneOwnershipAllocation(initial.ownership)
    : createEqualMemberOwnership(props.members.map((member) => member.id))
  ownershipValid.value = isValidOwnershipAllocation(
    ownership.value,
    props.members.map((member) => member.id),
  )
}

async function submit() {
  if (props.saving || submitting.value) return
  const formIsValid = await form.value?.validate()
  const normalizedBalance = normalizeNonNegativeMoneyOrNull(balance.value)
  if (!formIsValid || !name.value || normalizedBalance === null || !ownershipValid.value) return

  submitting.value = true
  emit('save', {
    categoryId: props.category.id,
    subcategoryId: subcategoryId.value,
    itemName: name.value.trim(),
    notes: notes.value.trim(),
    balance: normalizedBalance,
    ownership: cloneOwnershipAllocation(ownership.value),
  })
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.liability-form {
  display: grid;
  gap: 1rem;
}

.dialog-field {
  @include financial-dialog-field;
  margin-bottom: 0;
}
</style>
