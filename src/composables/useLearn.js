import { ref } from 'vue'

const isLearnOpen = ref(false)
const selectedLearnTopicId = ref(null)

export function useLearn() {
  function openLearn() {
    selectedLearnTopicId.value = null
    isLearnOpen.value = true
  }

  function closeLearn() {
    isLearnOpen.value = false
    selectedLearnTopicId.value = null
  }

  function selectLearnTopic(topicId) {
    selectedLearnTopicId.value = topicId
  }

  function showLearnIndex() {
    selectedLearnTopicId.value = null
  }

  return {
    isLearnOpen,
    selectedLearnTopicId,
    openLearn,
    closeLearn,
    selectLearnTopic,
    showLearnIndex,
  }
}
