<template>
  <div class="learn-content">
    <header class="learn-content__header">
      <div class="learn-content__brand">
        <span class="learn-content__icon"><q-icon name="menu_book" /></span>
        <span>{{ t('learn.title') }}</span>
      </div>
      <q-btn
        flat
        round
        dense
        icon="close"
        :aria-label="t('common.close')"
        @click="$emit('close')"
      />
    </header>

    <div v-if="selectedTopic" class="learn-content__body">
      <q-btn
        flat
        dense
        no-caps
        icon="arrow_back"
        :label="t('learn.backToTopics')"
        class="learn-content__back"
        @click="$emit('back')"
      />
      <article class="learn-topic-detail">
        <span class="learn-topic-detail__eyebrow">{{ t('learn.topicEyebrow') }}</span>
        <h2>{{ t(selectedTopic.titleKey) }}</h2>
        <p class="learn-topic-detail__lead">{{ t(selectedTopic.descriptionKey) }}</p>
        <q-separator />
        <p>{{ t(selectedTopic.bodyKey) }}</p>
      </article>
    </div>

    <div v-else class="learn-content__body">
      <section class="learn-context-intro">
        <h2>{{ t(context.titleKey) }}</h2>
        <p>{{ t(context.descriptionKey) }}</p>
      </section>

      <nav class="learn-topic-list" :aria-label="t('learn.availableTopics')">
        <button
          v-for="topic in context.topics"
          :key="topic.id"
          type="button"
          class="learn-topic-row"
          @click="$emit('select', topic.id)"
        >
          <span>
            <strong>{{ t(topic.titleKey) }}</strong>
            <small>{{ t(topic.descriptionKey) }}</small>
          </span>
          <q-icon name="chevron_right" aria-hidden="true" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  context: { type: Object, required: true },
  selectedTopic: { type: Object, default: null },
})

defineEmits(['back', 'close', 'select'])

const { t } = useI18n()
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.learn-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--color-ink);
}

.learn-content__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  min-height: 4.5rem;
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-line);
}

.learn-content__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-family-display);
  font-size: 1.2rem;
}

.learn-content__icon {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: var(--radius-button);
  background: var(--color-blue-soft);
  color: var(--color-primary-dark);
  font-family: var(--font-family-app);
  font-size: 1.15rem;
}

.learn-content__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-6) var(--space-5) max(var(--space-6), env(safe-area-inset-bottom));
  overscroll-behavior: contain;
}

.learn-context-intro h2,
.learn-topic-detail h2 {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.75rem;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.learn-context-intro p,
.learn-topic-detail__lead,
.learn-topic-detail > p {
  color: var(--color-copy);
  line-height: var(--line-height-body);
}

.learn-context-intro p {
  margin: var(--space-2) 0 0;
}

.learn-topic-list {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.learn-topic-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease;
}

.learn-topic-row:hover {
  border-color: var(--color-primary-border);
  background: var(--color-surface-soft);
}

.learn-topic-row:focus-visible {
  @include focus-ring;
}

.learn-topic-row span {
  display: grid;
  gap: var(--space-1);
}

.learn-topic-row strong {
  font-weight: var(--font-weight-semibold);
}

.learn-topic-row small {
  color: var(--color-copy);
  font-size: 0.85rem;
  line-height: 1.4;
}

.learn-topic-row > .q-icon {
  flex: 0 0 auto;
  color: var(--color-muted);
}

.learn-content__back {
  min-height: 2rem;
  margin: 0 0 var(--space-5) -0.5rem;
  color: var(--color-copy);
}

.learn-topic-detail__eyebrow {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--color-primary-dark);
  font-size: 0.72rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.learn-topic-detail__lead {
  margin: var(--space-3) 0 var(--space-5);
  font-size: 1rem;
}

.learn-topic-detail .q-separator {
  margin-bottom: var(--space-5);
  background: var(--color-line);
}

.learn-topic-detail > p {
  margin: 0;
}

@media (max-width: 599px) {
  .learn-content__header {
    min-height: 4rem;
  }

  .learn-content__body {
    padding-top: var(--space-5);
  }

  .learn-context-intro h2,
  .learn-topic-detail h2 {
    font-size: 1.55rem;
  }
}
</style>
