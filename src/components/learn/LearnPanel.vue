<template>
  <q-dialog
    v-if="context"
    v-model="openModel"
    class="learn-dialog"
    :full-height="!isMobile"
    :position="isMobile ? 'bottom' : 'right'"
    @hide="showLearnIndex"
  >
    <q-card class="learn-panel" :class="{ 'learn-panel--mobile': isMobile }">
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
  width: min(44rem, 100vw);
  max-width: none;
  height: 100dvh;
  max-height: 100dvh;
  border-radius: 0;
  background: var(--color-surface);
}

.learn-panel :deep(.learn-content__header) {
  padding-inline: var(--space-8);
}

.learn-panel :deep(.learn-content__body) {
  padding-inline: var(--space-8);
}

.learn-panel--mobile {
  position: relative;
  width: 100vw;
  max-width: none;
  height: 80vh;
  height: 80dvh;
  max-height: 80vh;
  max-height: 80dvh;
  border: 0;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.learn-panel--mobile :deep(.learn-content__header) {
  padding-top: max(var(--space-5), env(safe-area-inset-top));
  padding-inline: var(--space-5);
}

.learn-panel--mobile :deep(.learn-content__body) {
  padding-inline: var(--space-5);
}

:global(.q-dialog__inner--right.learn-dialog),
:global(.learn-dialog .q-dialog__inner--right) {
  padding: 0;
}

@media (min-width: 1440px) {
  .learn-panel {
    width: min(48rem, 100vw);
  }
}
</style>
