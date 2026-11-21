<template>
  <div class="scenario-actions">
    <q-select
      :model-value="activeScenarioId"
      :options="scenarioOptions"
      emit-value
      map-options
      outlined
      dense
      options-dense
      class="scenario-select"
      :label="t('whatIf.strategy.scenario')"
      @update:model-value="emit('select', $event)"
    />
    <q-btn
      outline
      no-caps
      icon="add"
      class="scenario-secondary-action"
      :label="t('whatIf.strategy.newScenario')"
      :disable="scenarioCount >= 10"
      @click="emit('add')"
    />
    <q-btn
      flat
      round
      icon="more_horiz"
      class="scenario-secondary-action"
      :aria-label="t('whatIf.strategy.scenarioActions')"
    >
      <q-menu auto-close>
        <q-list dense style="min-width: 11rem">
          <q-item clickable @click="emit('reset')">
            <q-item-section avatar><q-icon name="restart_alt" /></q-item-section>
            <q-item-section>{{ t('whatIf.strategy.reset') }}</q-item-section>
          </q-item>
          <q-item :disable="scenarioCount === 1" clickable @click="emit('delete')">
            <q-item-section avatar
              ><q-icon name="delete_outline" color="negative"
            /></q-item-section>
            <q-item-section>{{ t('whatIf.strategy.delete') }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  activeScenarioId: { type: String, required: true },
  scenarioOptions: { type: Array, required: true },
  scenarioCount: { type: Number, required: true },
})

const emit = defineEmits(['select', 'add', 'reset', 'delete'])
const { t } = useI18n()
</script>

<style scoped lang="scss">
.scenario-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scenario-select {
  width: 13rem;
}

@media (max-width: 760px) {
  .scenario-actions {
    display: block;
  }

  .scenario-select {
    width: auto;
  }

  .scenario-secondary-action {
    display: none;
  }
}
</style>
