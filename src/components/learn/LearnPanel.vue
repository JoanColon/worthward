<template>
  <q-dialog
    v-if="context"
    v-model="openModel"
    :position="isMobile ? 'bottom' : 'right'"
    @hide="showLearnIndex"
  >
    <q-card class="learn-panel" :class="{ 'learn-panel--mobile': isMobile }">
      <span v-if="isMobile" class="learn-panel__handle" aria-hidden="true" />
      <LearnContent
        :context="context"
        :selected-topic="selectedTopic"
        @back="showLearnIndex"
        @close="closeLearn"
        @select="selectLearnTopic"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import LearnContent from '@/components/learn/LearnContent.vue'
import { useLearn } from '@/composables/useLearn'
import { resolveLearnContext } from '@/learn/registry'

const $q = useQuasar()
const route = useRoute()
const { isLearnOpen, selectedLearnTopicId, closeLearn, selectLearnTopic, showLearnIndex } =
  useLearn()

const isMobile = computed(() => $q.screen.lt.md)
const context = computed(() => resolveLearnContext(route))
const selectedTopic = computed(
  () => context.value?.topics.find(({ id }) => id === selectedLearnTopicId.value) || null,
)
const openModel = computed({
  get: () => isLearnOpen.value,
  set: (open) => {
    if (!open) closeLearn()
  },
})

watch(
  () => context.value?.id,
  (contextId, previousContextId) => {
    if (contextId === previousContextId) return
    showLearnIndex()
    if (!contextId && isLearnOpen.value) closeLearn()
  },
)
</script>

<style scoped lang="scss">
.learn-panel {
  width: min(27rem, 100vw);
  height: 100dvh;
  max-height: 100dvh;
  border-radius: var(--radius-card) 0 0 var(--radius-card);
  background: var(--color-surface);
}

.learn-panel--mobile {
  position: relative;
  width: 100vw;
  max-width: none;
  height: 72dvh;
  max-height: calc(100dvh - env(safe-area-inset-top) - 1rem);
  border-width: 1px 0 0;
  border-radius: 1.8rem 1.8rem 0 0;
}

.learn-panel__handle {
  position: absolute;
  z-index: 1;
  top: 0.5rem;
  left: 50%;
  width: 3.25rem;
  height: 0.32rem;
  border-radius: 999px;
  background: var(--color-line-strong);
  transform: translateX(-50%);
}

.learn-panel--mobile :deep(.learn-content__header) {
  padding-top: var(--space-5);
}
</style>
