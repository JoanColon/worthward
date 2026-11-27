<template>
  <q-page class="achievements-page" :class="{ 'achievements-page--embedded': embedded }">
    <main class="achievements-shell">
      <AppPageHeader
        v-if="!embedded"
        :title="t('achievements.title')"
        :subtitle="t('achievements.subtitle')"
        :back-label="t('navigation.progress')"
        :back-to="{ name: 'progress', params: { workspaceId } }"
      >
        <template #actions>
          <MilestoneSummary
            :total-count="visibleMilestones.length"
            :achieved-count="achievedCount"
            :in-progress-count="inProgressCount"
          />
        </template>
      </AppPageHeader>

      <MilestoneSummary
        v-else
        :total-count="visibleMilestones.length"
        :achieved-count="achievedCount"
        :in-progress-count="inProgressCount"
      />

      <q-banner v-if="!readOnly && !trackingActive && !loading" rounded class="setup-banner">
        <template #avatar>
          <q-icon name="flag" />
        </template>
        <div class="setup-banner-copy">
          <strong>{{ t('milestones.setup.title') }}</strong>
          <p>{{ t('milestones.setup.description') }}</p>
        </div>
        <template #action>
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="task_alt"
            :label="t('milestones.setup.action')"
            @click="activationDialogOpen = true"
          />
        </template>
      </q-banner>

      <div v-if="loading && !progress.length" class="state">
        <q-spinner color="primary" size="2rem" />
        <span>{{ t('milestones.loading') }}</span>
      </div>
      <section v-else-if="error && !progress.length" class="state">
        <q-icon name="cloud_off" size="2rem" />
        <p>{{ t('milestones.error') }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          :label="t('common.retry')"
          @click="retry"
        />
      </section>
      <template v-else>
        <nav class="milestone-filters" :aria-label="t('achievements.filterLabel')">
          <button
            v-for="filter in filters"
            :key="filter.id"
            type="button"
            :class="[`milestone-filter--${filter.id}`, { active: activeFilter === filter.id }]"
            :aria-pressed="activeFilter === filter.id"
            @click="activeFilter = filter.id"
          >
            <q-icon :name="filter.icon" />
            <span>{{ filter.label }}</span>
            <small>{{ filter.count }}</small>
          </button>
        </nav>

        <div class="family-grid">
          <section
            v-for="family in filteredFamilies"
            :key="family.id"
            class="family-card"
            :class="`family--${family.id}`"
          >
            <header class="family-header">
              <span class="family-icon"><q-icon :name="family.icon" /></span>
              <div class="family-copy">
                <div class="family-title">
                  <h2>{{ t(`milestones.families.${family.id}.title`) }}</h2>
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="info_outline"
                    class="family-info-button"
                    :aria-label="
                      t('milestones.familyInfoAction', {
                        family: t(`milestones.families.${family.id}.title`),
                      })
                    "
                    @click.stop="showFamilyInfo(family.id)"
                    @keydown.stop
                  >
                    <q-tooltip v-if="$q.screen.gt.xs" max-width="24rem">
                      {{ t(`milestones.families.${family.id}.info`) }}
                    </q-tooltip>
                  </q-btn>
                </div>
                <p>{{ t(`milestones.families.${family.id}.shortDescription`) }}</p>
                <strong class="family-count">
                  {{
                    t('achievements.familyCount', {
                      achieved: family.achieved,
                      total: family.total,
                    })
                  }}
                  {{ t('achievements.achieved').toLowerCase() }}
                </strong>
                <span class="family-progress-track">
                  <span :style="{ width: `${family.percentage}%` }" />
                </span>
              </div>
            </header>

            <div class="achievement-list">
              <article
                v-for="milestone in family.filteredMilestones"
                :key="milestone.id"
                role="button"
                tabindex="0"
                :aria-label="
                  t('achievements.openDetails', { achievement: milestoneTitle(milestone) })
                "
                :class="{
                  unlocked: milestoneIsUnlocked(milestone),
                  pending: milestone.pending,
                  current: family.currentIds.has(milestone.id),
                  locked: !milestoneIsUnlocked(milestone) && !family.currentIds.has(milestone.id),
                }"
                @click="openAchievement(milestone)"
                @keydown.enter.prevent="openAchievement(milestone)"
                @keydown.space.prevent="openAchievement(milestone)"
              >
                <MilestoneBadge
                  :family="milestone.family"
                  :milestone-id="milestone.id"
                  :level="milestoneLevel(family, milestone)"
                  :final="family.milestones.at(-1)?.id === milestone.id"
                  :locked="!milestoneIsUnlocked(milestone) && !family.currentIds.has(milestone.id)"
                />
                <strong class="milestone-title">{{ milestoneTitle(milestone) }}</strong>
                <div v-if="milestoneIsUnlocked(milestone)" class="milestone-state achieved">
                  <q-icon name="check_circle" />
                  <span>{{ achievedDateLabel(milestone.id) }}</span>
                </div>
                <template v-else-if="family.currentIds.has(milestone.id)">
                  <div class="milestone-current-row">
                    <q-linear-progress
                      rounded
                      size="0.42rem"
                      :value="milestone.progress"
                      :color="family.color"
                      track-color="grey-3"
                    />
                    <b>{{ Math.round(milestone.progress * 100) }}%</b>
                  </div>
                  <small>{{ currentTargetLabel(milestone) }}</small>
                </template>
                <div v-else class="milestone-state locked-label">
                  <q-icon name="lock_outline" />
                  <span>{{ t('achievements.locked') }}</span>
                </div>
              </article>
            </div>
          </section>
          <p v-if="!filteredFamilies.length" class="filter-empty">
            {{ t('achievements.filterEmpty') }}
          </p>
        </div>
      </template>

      <q-dialog v-model="infoDialogOpen" :position="$q.screen.lt.sm ? 'bottom' : undefined">
        <q-card v-if="selectedInfoFamily" class="family-info-dialog responsive-info-card">
          <span class="info-sheet-handle" aria-hidden="true" />
          <q-card-section class="family-info-heading">
            <span class="family-icon" :class="`family-info-icon--${selectedInfoFamily.id}`">
              <q-icon :name="selectedInfoFamily.icon" />
            </span>
            <h2>{{ t(`milestones.families.${selectedInfoFamily.id}.infoTitle`) }}</h2>
            <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.close')" />
          </q-card-section>
          <q-card-section class="family-info-copy">
            <p>{{ t(`milestones.families.${selectedInfoFamily.id}.info`) }}</p>
          </q-card-section>
        </q-card>
      </q-dialog>

      <q-dialog v-model="achievementDialogOpen" class="achievement-detail-dialog-shell">
        <q-card
          v-if="selectedMilestone && selectedMilestoneFamily"
          class="achievement-detail-dialog"
        >
          <q-btn
            v-close-popup
            flat
            round
            dense
            icon="close"
            class="achievement-detail-close"
            :aria-label="t('common.close')"
          />
          <q-card-section class="achievement-detail-body">
            <MilestoneBadge
              :family="selectedMilestone.family"
              :milestone-id="selectedMilestone.id"
              :level="milestoneLevel(selectedMilestoneFamily, selectedMilestone)"
              :final="selectedMilestoneFamily.milestones.at(-1)?.id === selectedMilestone.id"
              :locked="!milestoneIsUnlocked(selectedMilestone)"
              class="achievement-detail-badge"
            />
            <span class="achievement-detail-family">
              {{ t(`milestones.families.${selectedMilestone.family}.title`) }}
            </span>
            <h2>{{ milestoneTitle(selectedMilestone) }}</h2>
            <p>{{ milestoneDescription(selectedMilestone) }}</p>
            <div
              class="achievement-detail-status"
              :class="{ achieved: milestoneIsUnlocked(selectedMilestone) }"
            >
              <q-icon
                :name="milestoneIsUnlocked(selectedMilestone) ? 'check_circle' : 'lock_outline'"
              />
              <span>
                {{
                  milestoneIsUnlocked(selectedMilestone)
                    ? achievedDateLabel(selectedMilestone.id)
                    : t('achievements.locked')
                }}
              </span>
            </div>
          </q-card-section>
          <q-card-actions v-if="milestoneIsUnlocked(selectedMilestone)" align="center">
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="share"
              class="achievement-share-button"
              :label="t('achievements.share.action')"
              :loading="sharingAchievement"
              @click="shareAchievement"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="activationDialogOpen" persistent>
        <q-card class="activation-dialog">
          <q-card-section>
            <div class="activation-icon"><q-icon name="task_alt" /></div>
            <h2>{{ t('milestones.setup.confirmTitle') }}</h2>
            <p>{{ t('milestones.setup.confirmDescription') }}</p>
            <p class="activation-note">{{ t('milestones.setup.confirmNote') }}</p>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              v-close-popup
              flat
              no-caps
              :label="t('common.cancel')"
              :disable="activationLoading"
            />
            <q-btn
              unelevated
              no-caps
              color="primary"
              :label="t('milestones.setup.confirmAction')"
              :loading="activationLoading"
              @click="activateTracking"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </main>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import MilestoneBadge from '@/components/milestones/MilestoneBadge.vue'
import MilestoneSummary from '@/components/milestones/MilestoneSummary.vue'
import { milestoneBadgeAssets } from '@/config/milestone-badges'
import { milestoneFamilies } from '@/config/milestone-families'
import { calculateMilestoneProgress } from '@/domain/milestones/calculations'
import { isDemoWorkspaceId } from '@/domain/access/demo-workspace'
import { authUser } from '@/services/auth'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useMilestonesStore } from '@/stores/milestones-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'

const props = defineProps({
  embedded: { type: Boolean, default: false },
})

const achievementFamilies = ['netWorth', 'freedom', 'safety', 'debt']
  .map((familyId) => milestoneFamilies.find(({ id }) => id === familyId))
  .filter(Boolean)

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const milestonesStore = useMilestonesStore()
const scopeStore = useFinancialScopeStore()
const workspaceStore = useWorkspaceStore()
const workspaceId = computed(() => String(route.params.workspaceId))
const readOnly = computed(() => isDemoWorkspaceId(workspaceId.value))
const {
  achievements,
  activationLoading,
  currentMonth,
  error,
  excludedLiabilityIds,
  financialYear,
  historyDocuments,
  liabilities,
  loading,
  trackingActive,
} = storeToRefs(milestonesStore)
const workspace = computed(
  () => workspaceStore.workspaces.find(({ id }) => id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map(({ id }) => id))
const selectedMemberId = computed(() =>
  scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
)
const progress = computed(() =>
  calculateMilestoneProgress({
    financialYear: financialYear.value,
    financialHistory: historyDocuments.value,
    liabilities: liabilities.value,
    excludedLiabilityIds: excludedLiabilityIds.value,
    achievements: trackingActive.value ? achievements.value : [],
    month: currentMonth.value,
    memberId: selectedMemberId.value,
  }),
)
const activeFilter = ref('all')
const infoDialogOpen = ref(false)
const activationDialogOpen = ref(false)
const achievementDialogOpen = ref(false)
const sharingAchievement = ref(false)
const selectedInfoFamilyId = ref(null)
const selectedMilestone = ref(null)

watch(
  workspaceId,
  (id) => {
    activeFilter.value = 'all'
    if (!props.embedded) milestonesStore.load(id)
  },
  { immediate: true },
)

const visibleMilestones = computed(() =>
  progress.value.filter(
    (milestone) => milestone.family !== 'debt' || milestone.relevant || milestone.achieved,
  ),
)
const achievedCount = computed(
  () => visibleMilestones.value.filter((milestone) => milestoneIsUnlocked(milestone)).length,
)
const inProgressCount = computed(() => visibleMilestones.value.length - achievedCount.value)
const filters = computed(() => [
  {
    id: 'all',
    label: t('achievements.filters.all'),
    count: visibleMilestones.value.length,
    icon: 'grid_view',
  },
  ...achievementFamilies.map((family) => ({
    ...family,
    label: t(`milestones.families.${family.id}.title`),
    count: visibleMilestones.value.filter(({ family: familyId }) => familyId === family.id).length,
  })),
])
const families = computed(() =>
  achievementFamilies.map((family) => {
    const milestones = visibleMilestones.value.filter(
      ({ family: familyId }) => familyId === family.id,
    )
    const achieved = milestones.filter((milestone) => milestoneIsUnlocked(milestone)).length
    const remaining = milestones.filter((milestone) => !milestoneIsUnlocked(milestone))
    const currentIds = new Set(
      (family.id === 'debt'
        ? remaining.filter(({ relevant }) => relevant)
        : remaining.slice(0, 1)
      ).map(({ id }) => id),
    )
    return {
      ...family,
      milestones,
      achieved,
      total: milestones.length,
      percentage: milestones.length ? (achieved / milestones.length) * 100 : 0,
      currentIds,
    }
  }),
)
const filteredFamilies = computed(() =>
  families.value
    .map((family) => ({
      ...family,
      filteredMilestones: family.milestones,
    }))
    .filter(
      ({ id, filteredMilestones }) =>
        filteredMilestones.length && (activeFilter.value === 'all' || activeFilter.value === id),
    ),
)
const achievementById = computed(
  () => new Map(achievements.value.map((achievement) => [achievement.milestoneId, achievement])),
)
const selectedInfoFamily = computed(() =>
  achievementFamilies.find(({ id }) => id === selectedInfoFamilyId.value),
)
const selectedMilestoneFamily = computed(() =>
  families.value.find(({ id }) => id === selectedMilestone.value?.family),
)

function retry() {
  milestonesStore.load(workspaceId.value, true)
}

function showFamilyInfo(familyId) {
  if (!$q.screen.lt.sm) return
  selectedInfoFamilyId.value = familyId
  infoDialogOpen.value = true
}

function openAchievement(milestone) {
  selectedMilestone.value = milestone
  achievementDialogOpen.value = true
}

function milestoneIsUnlocked(milestone) {
  return trackingActive.value ? milestone.achieved : milestone.reached
}

async function activateTracking() {
  if (readOnly.value) return
  try {
    await milestonesStore.activateTracking()
    activationDialogOpen.value = false
    $q.notify({ type: 'positive', message: t('milestones.setup.activated') })
  } catch {
    $q.notify({ type: 'negative', message: t('milestones.setup.activationError') })
  }
}

function milestoneTitle(milestone) {
  return t(`milestones.items.${milestone.id}`, {
    amount: formatCurrency(milestone.target),
  })
}

function milestoneDescription(milestone) {
  if (milestone.family === 'safety') {
    return t('milestones.descriptions.safety', { target: milestone.target })
  }
  if (milestone.family === 'freedom') {
    return t('milestones.descriptions.freedom', { target: milestone.target })
  }
  if (milestone.family === 'netWorth') {
    if (milestone.id === 'net_worth_positive') {
      return t('milestones.descriptions.netWorthPositive')
    }
    return t('milestones.descriptions.netWorth', { target: formatCurrency(milestone.target) })
  }
  return t(`milestones.descriptions.${milestone.id}`)
}

function milestoneLevel(family, milestone) {
  const index = family.milestones.findIndex(({ id }) => id === milestone.id)
  if (index < 0 || family.milestones.length < 2) return 0
  return Math.round((index / (family.milestones.length - 1)) * 3)
}

function currentTargetLabel(milestone) {
  const current = milestone.currentValue
  if (milestone.family === 'safety') {
    return t('milestones.values.monthsCurrentTarget', {
      current: formatDecimal(current),
      target: milestone.target,
    })
  }
  if (milestone.family === 'freedom') {
    return t('milestones.values.yearsCurrentTarget', {
      current: formatDecimal(current),
      target: milestone.target,
    })
  }
  if (milestone.family === 'debt') {
    return t('milestones.values.remaining', { value: formatCurrency(current) })
  }
  return `${formatCurrency(current)} / ${formatCurrency(milestone.target)}`
}

function formatDecimal(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(Number(value || 0))
}

function achievedDateLabel(milestoneId) {
  const date = achievementDate(milestoneId)
  if (!date) return t('achievements.achieved')
  return t('milestones.achievedOn', {
    date: new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date),
  })
}

function achievementDate(milestoneId) {
  const value = achievementById.value.get(milestoneId)?.achievedAt
  return typeof value?.toDate === 'function' ? value.toDate() : value ? new Date(value) : null
}

async function shareAchievement() {
  const milestone = selectedMilestone.value
  if (!milestone || !milestoneIsUnlocked(milestone) || sharingAchievement.value) return

  sharingAchievement.value = true
  try {
    const blob = await createAchievementShareImage(milestone)
    const fileName = `worthward-${slugify(milestoneTitle(milestone))}.png`
    const file = new File([blob], fileName, { type: 'image/png' })
    const shareData = {
      title: t('achievements.share.title', { achievement: milestoneTitle(milestone) }),
      text: [
        milestoneTitle(milestone),
        milestoneDescription(milestone),
        achievedDateLabel(milestone.id),
      ]
        .filter(Boolean)
        .join('\n'),
      files: [file],
    }

    if (
      typeof navigator.share === 'function' &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    ) {
      await navigator.share(shareData)
      return
    }

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      $q.notify({ type: 'positive', message: t('achievements.share.copied') })
      return
    }

    downloadBlob(blob, fileName)
    $q.notify({ type: 'positive', message: t('achievements.share.downloaded') })
  } catch (error) {
    if (error?.name !== 'AbortError') {
      try {
        const blob = await createAchievementShareImage(milestone)
        downloadBlob(blob, `worthward-${slugify(milestoneTitle(milestone))}.png`)
        $q.notify({ type: 'positive', message: t('achievements.share.downloaded') })
      } catch {
        $q.notify({ type: 'negative', message: t('achievements.share.error') })
      }
    }
  } finally {
    sharingAchievement.value = false
  }
}

async function createAchievementShareImage(milestone) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext('2d')
  const familyColor = {
    safety: '#16815f',
    freedom: '#8754ed',
    debt: '#ea6f22',
    netWorth: '#0870d8',
  }[milestone.family]

  const background = context.createLinearGradient(0, 0, 1080, 1350)
  background.addColorStop(0, '#f5f7f9')
  background.addColorStop(0.55, '#ffffff')
  background.addColorStop(1, `${familyColor}16`)
  context.fillStyle = background
  context.fillRect(0, 0, 1080, 1350)

  context.strokeStyle = `${familyColor}55`
  context.lineWidth = 4
  context.strokeRect(42, 42, 996, 1266)

  context.fillStyle = '#0b1633'
  context.font = '700 40px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  context.fillText('Worthward', 78, 108)

  const image = await loadImage(milestoneBadgeAssets[milestone.id])
  context.drawImage(image, 230, 135, 620, 620)

  context.textAlign = 'center'
  context.fillStyle = familyColor
  context.font = '700 27px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  context.fillText(t(`milestones.families.${milestone.family}.title`).toUpperCase(), 540, 805)

  context.fillStyle = '#0b1633'
  context.font = '750 64px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  let nextY = drawWrappedText(context, milestoneTitle(milestone), 540, 880, 850, 72)

  context.fillStyle = '#526987'
  context.font = '400 32px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  nextY = drawWrappedText(context, milestoneDescription(milestone), 540, nextY + 30, 820, 45)

  context.fillStyle = familyColor
  context.font = '700 27px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  context.fillText(achievedDateLabel(milestone.id).toUpperCase(), 540, Math.max(nextY + 58, 1235))

  return canvasToBlob(canvas)
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  })
  if (line) lines.push(line)

  lines.forEach((value, index) => context.fillText(value, x, y + index * lineHeight))
  return y + lines.length * lineHeight
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image), { once: true })
    image.addEventListener('error', () => reject(new Error('Unable to load badge image.')), {
      once: true,
    })
    image.src = src
  })
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Unable to create badge image.'))),
      'image/png',
      1,
    )
  })
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function slugify(value) {
  return String(value || 'achievement')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;

.achievements-page {
  @include financial-page;
}
.achievements-page--embedded {
  min-height: 0;
  padding: 0;
  background: transparent;
}
.achievements-page--embedded .achievements-shell {
  max-width: none;
}
.family-header p,
.achievement-list small,
.state {
  color: var(--color-copy);
}

.setup-banner {
  margin-top: 1.5rem;
  padding: 1rem 1.2rem;
  border: 1px solid var(--color-line);
  background: var(--color-blue-soft);
  color: var(--color-ink);
}
.setup-banner :deep(.q-banner__avatar) {
  color: var(--color-primary);
  font-size: 1.7rem;
}
.setup-banner-copy strong,
.setup-banner-copy p {
  display: block;
}
.setup-banner-copy p {
  max-width: 42rem;
  margin: 0.2rem 0 0;
  color: var(--color-copy);
  font-size: 0.84rem;
}

.family-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  align-items: start;
}
.family-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.family-header {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  min-height: 6.5rem;
  padding: 1rem 1.2rem;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.family-header:hover {
  background: var(--color-surface);
}
.family-copy {
  flex: 1;
  min-width: 0;
}
.family-title {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.family-info-button {
  color: var(--color-copy);
}
.family-header h2,
.family-header p {
  margin: 0;
}
.family-header h2 {
  font-size: 1.2rem;
}
.family-header p {
  margin-top: 0.2rem;
  font-size: 0.8rem;
}
.family-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
}
.family-icon {
  width: 3rem;
  height: 3rem;
  background: var(--color-blue-soft);
  color: var(--color-primary);
  font-size: 1.35rem;
}
.family--safety .family-icon {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.family--debt .family-icon {
  background: var(--color-red-soft);
  color: var(--color-danger);
}
.family--freedom .family-icon {
  background: var(--color-purple-soft);
  color: var(--color-purple);
}

.family-info-dialog {
  width: min(28rem, calc(100vw - 2rem));
  border-radius: var(--radius-card);
  color: var(--color-ink);
}
.family-info-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-bottom: 0.75rem;
}
.family-info-heading h2 {
  flex: 1;
  margin: 0;
  font-size: 1.15rem;
}
.family-info-icon--safety {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.family-info-icon--debt {
  background: var(--color-red-soft);
  color: var(--color-danger);
}
.family-info-icon--freedom {
  background: var(--color-purple-soft);
  color: var(--color-purple);
}
.family-info-copy {
  padding-top: 0;
}
.family-info-copy p {
  margin: 0;
  color: var(--color-copy);
  font-size: 0.9rem;
  line-height: 1.55;
}

.activation-dialog {
  width: min(31rem, calc(100vw - 2rem));
  border-radius: var(--radius-card);
  color: var(--color-ink);
}
.activation-dialog h2 {
  margin: 0.8rem 0 0;
  font-size: 1.3rem;
}
.activation-dialog p {
  margin: 0.55rem 0 0;
  color: var(--color-copy);
  font-size: 0.9rem;
  line-height: 1.5;
}
.activation-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 50%;
  background: var(--color-green-soft);
  color: var(--color-success-dark);
  font-size: 1.45rem;
}
.activation-dialog .activation-note {
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-soft);
  font-size: 0.8rem;
}

.achievement-list article {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-height: 5.6rem;
  margin: 0 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-line);
  opacity: 0.65;
}
.achievement-list article.unlocked {
  opacity: 1;
}
.achievement-list article > div {
  min-width: 0;
}
.achievement-list strong,
.achievement-list small {
  display: block;
}
.achievement-list small {
  margin-top: 0.2rem;
  font-size: 0.76rem;
}
.achievement-list article.pending {
  opacity: 1;
}

.state {
  display: grid;
  min-height: 18rem;
  place-content: center;
  justify-items: center;
  gap: 0.75rem;
  text-align: center;
}
.state p {
  margin: 0;
}

/* Narrative milestone board */
.achievements-shell {
  @include financial-shell(analytical);
}

.milestone-filters {
  display: flex;
  gap: 0.55rem;
  margin-top: 1.4rem;
}

.milestone-filters button {
  @include button-reset;
  min-width: 6.6rem;
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: var(--shadow-control);
  color: var(--color-copy);
  font-size: 0.75rem;
  font-weight: 750;
  text-align: center;
}

.milestone-filters button.active {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-inverse);
}

.milestone-filters button:focus-visible {
  @include focus-ring;
}

.family-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-top: 0.9rem;
}

.family-card {
  display: grid;
  grid-template-columns: minmax(13rem, 0.25fr) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.family-header {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  width: auto;
  min-height: 10.5rem;
  padding: 1.1rem 1rem;
  border-right: 1px solid var(--color-line);
  cursor: default;
}

.family-header:hover {
  background: transparent;
}

.family-icon {
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 0.8rem;
  font-size: 1.35rem;
}

.family-copy {
  display: grid;
  align-content: start;
  gap: 0.15rem;
}

.family-title {
  gap: 0.15rem;
}

.family-header h2 {
  font-size: 1.12rem;
  letter-spacing: -0.025em;
}

.family-header p {
  margin-top: 0;
  font-size: 0.72rem;
}

.family-info-button {
  min-width: 1.8rem;
  min-height: 1.8rem;
  color: var(--color-muted);
}

.family-count {
  margin-top: 0.9rem;
  color: var(--color-ink);
  font-size: 0.72rem;
}

.family-progress-track {
  display: block;
  width: 100%;
  height: 0.42rem;
  margin-top: 0.35rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}

.family-progress-track > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

.family--safety .family-progress-track > span {
  background: var(--color-success);
}

.family--freedom .family-progress-track > span {
  background: var(--color-purple);
}

.family--debt .family-progress-track > span {
  background: var(--color-danger);
}

.achievement-list {
  display: grid;
  grid-auto-columns: minmax(9rem, 1fr);
  grid-auto-flow: column;
  gap: 0.55rem;
  min-width: 0;
  overflow-x: auto;
  padding: 0.75rem;
  scrollbar-width: thin;
}

.achievement-list article {
  display: grid;
  grid-template-rows: 5rem minmax(2.8rem, auto) 1.9rem;
  align-content: center;
  justify-items: center;
  gap: 0.25rem;
  min-width: 9rem;
  min-height: 10.2rem;
  margin: 0;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-line);
  border-radius: 0.9rem;
  background: var(--color-surface);
  opacity: 1;
  text-align: center;
}

.family--safety .achievement-list article.unlocked {
  background: var(--color-surface);
}

.family--freedom .achievement-list article.unlocked {
  background: var(--color-surface);
}

.family--debt .achievement-list article.unlocked {
  background: var(--color-surface);
}

.family--netWorth .achievement-list article.unlocked {
  background: var(--color-surface);
}

.achievement-list article.current {
  border-color: var(--color-line-strong);
  background: var(--color-surface);
  box-shadow: 0 0.35rem 1rem rgb(23 74 135 / 9%);
}

.family--freedom .achievement-list article.current {
  border-color: var(--color-line-strong);
}

.family--debt .achievement-list article.current {
  border-color: var(--color-line-strong);
}

.achievement-list article.locked {
  background: var(--color-surface);
}

.achievement-list article > strong {
  display: block;
  max-width: 8.4rem;
  color: var(--color-ink);
  font-size: 1rem;
  line-height: 1.14;
  letter-spacing: -0.015em;
}

.milestone-title--mobile {
  display: none;
}

.milestone-state {
  display: flex;
  align-items: center;
  align-self: end;
  gap: 0.25rem;
  color: var(--color-copy);
  font-size: 0.82rem;
}

.milestone-state.achieved {
  color: var(--color-success-dark);
}

.milestone-state .q-icon {
  font-size: 1rem;
}

.locked-label {
  color: var(--color-muted);
}

.milestone-current-row {
  display: grid;
  grid-template-columns: minmax(4.2rem, 1fr) auto;
  align-self: end;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  color: var(--color-ink);
  font-size: 0.74rem;
}

.achievement-list article > small {
  overflow: hidden;
  max-width: 8.4rem;
  color: var(--color-copy);
  font-size: 0.68rem;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-empty {
  margin: 0;
  padding: 2.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-copy);
  text-align: center;
}

@media (max-width: 760px) {
  .milestone-filters {
    overflow-x: auto;
    padding-bottom: 0.25rem;
    scrollbar-width: none;
  }

  .milestone-filters button {
    min-width: max-content;
    padding: 0.48rem 0.85rem;
  }

  .family-card {
    grid-template-columns: minmax(7.5rem, 36%) minmax(0, 1fr);
    min-height: 7.2rem;
    border-radius: var(--radius-md);
  }

  .family-header {
    display: grid;
    grid-template-columns: 2.15rem minmax(0, 1fr);
    grid-template-rows: 2.15rem auto auto auto;
    align-content: center;
    align-items: center;
    min-height: 100%;
    gap: 0.18rem 0.5rem;
    padding: 0.75rem 0.65rem;
    border-right: 1px solid var(--color-line);
    border-bottom: 0;
  }

  .family-copy {
    display: contents;
  }

  .family-icon {
    grid-column: 1;
    grid-row: 1;
  }

  .family-title {
    grid-column: 2;
    grid-row: 1;
    align-self: center;
  }

  .family-header p {
    display: block;
    grid-column: 1 / -1;
    grid-row: 2;
    margin-top: 0.15rem;
    font-size: 0.64rem;
    line-height: 1.25;
  }

  .family-icon {
    width: 2.15rem;
    height: 2.15rem;
    border-radius: 0.7rem;
    font-size: 1rem;
  }

  .family-title {
    align-items: flex-start;
  }

  .family-header h2 {
    font-size: 0.88rem;
  }

  .family-info-button {
    display: none;
  }

  .family-count {
    grid-column: 1 / -1;
    grid-row: 3;
    margin-top: 0.55rem;
    font-size: 0.65rem;
  }

  .family-progress-track {
    grid-column: 1 / -1;
    grid-row: 4;
    height: 0.34rem;
    margin-top: 0.3rem;
  }

  .achievement-list {
    display: flex;
    gap: 0.1rem;
    align-items: center;
    overflow-x: hidden;
    padding: 0.65rem 0.2rem;
  }

  .achievement-list article {
    grid-template-rows: 2.85rem minmax(1.2rem, auto) 1.2rem;
    gap: 0.12rem;
    flex: 1 1 0;
    min-width: 0;
    min-height: 5.8rem;
    margin: 0;
    padding: 0.25rem 0.1rem;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .achievement-list article.current,
  .family--freedom .achievement-list article.current,
  .family--debt .achievement-list article.current {
    border: 0;
    box-shadow: none;
  }

  .achievement-list :deep(.milestone-badge),
  .achievement-list :deep(.milestone-badge--final) {
    width: 2.3rem;
    height: 2.3rem;
  }

  .achievement-list :deep(.badge-asset) {
    width: 2.45rem;
    height: 2.45rem;
  }

  .achievement-list :deep(.milestone-badge > svg:not(.badge-laurel)) {
    width: 2.2rem;
    height: 2.2rem;
  }

  .achievement-list :deep(.badge-laurel) {
    top: 0;
    width: 0.75rem;
    height: 2.2rem;
  }

  .achievement-list :deep(.badge-lock) {
    width: 1.45rem;
    height: 1.45rem;
    font-size: 0.85rem;
  }

  .achievement-list article > .milestone-title--desktop {
    display: none;
  }

  .achievement-list article > .milestone-title--mobile {
    display: block;
    max-width: 100%;
    font-size: 0.6rem;
    line-height: 1.05;
  }

  .milestone-state {
    gap: 0;
    font-size: 0.65rem;
  }

  .milestone-state span {
    display: none;
  }

  .milestone-state .q-icon {
    font-size: 0.9rem;
  }

  .milestone-current-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.2rem;
    width: 3.2rem;
    font-size: 0.62rem;
    text-align: center;
  }

  .milestone-current-row b {
    grid-row: 2;
  }

  .achievement-list article > small {
    display: none;
  }
}

@media (max-width: 360px) {
  .family-card {
    grid-template-columns: 6.8rem minmax(0, 1fr);
  }

  .achievement-list :deep(.milestone-badge),
  .achievement-list :deep(.milestone-badge--final) {
    width: 2rem;
    height: 2rem;
  }

  .achievement-list :deep(.badge-asset) {
    width: 2.1rem;
    height: 2.1rem;
  }
}

/* Achievements gallery */
.achievements-page {
  background:
    radial-gradient(circle at 70% 0%, rgb(228 248 240 / 55%), transparent 24rem), var(--color-page);
}

.achievements-shell {
  max-width: 96rem;
}

.milestone-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1.65rem;
}

.milestone-filters button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-width: 0;
  min-height: 3.1rem;
  padding: 0.65rem 1rem;
  border: 1px solid var(--color-line);
  background: rgb(255 255 255 / 82%);
  color: var(--filter-color, var(--color-copy));
  font-size: 0.88rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.milestone-filters button:hover {
  border-color: color-mix(in srgb, var(--filter-color, var(--color-ink)) 38%, white);
  box-shadow: 0 0.45rem 1.2rem rgb(26 45 70 / 9%);
  transform: translateY(-1px);
}

.milestone-filters button .q-icon {
  font-size: 1.35rem;
}

.milestone-filters button small {
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 700;
}

.milestone-filters button.active {
  border-color: #0b2239;
  background: #0b2239;
  box-shadow: 0 0.55rem 1.35rem rgb(11 34 57 / 18%);
  color: #fff;
}

.milestone-filters button.active small {
  color: rgb(255 255 255 / 70%);
}

.milestone-filter--safety {
  --filter-color: var(--color-success);
}

.milestone-filter--freedom {
  --filter-color: var(--color-purple);
}

.milestone-filter--debt {
  --filter-color: #ea6f22;
}

.milestone-filter--netWorth {
  --filter-color: var(--color-primary);
}

.family-grid {
  gap: 1rem;
  margin-top: 1.45rem;
}

.family-card {
  grid-template-columns: minmax(13.5rem, 14.25rem) minmax(0, 1fr);
  border-radius: 1.15rem;
  box-shadow: 0 0.6rem 1.8rem rgb(34 55 78 / 6%);
}

.family-header {
  min-height: 12.7rem;
  padding: 1.35rem 1.2rem;
  border-right: 0;
  background: var(--family-soft, var(--color-blue-soft));
}

.family-header:hover {
  background: var(--family-soft, var(--color-blue-soft));
}

.family--safety {
  --family-color: var(--color-success);
  --family-soft: linear-gradient(135deg, #f5fcf8, #eaf8f1);
}

.family--freedom {
  --family-color: var(--color-purple);
  --family-soft: linear-gradient(135deg, #fbf9ff, #f2edff);
}

.family--debt {
  --family-color: #ea6f22;
  --family-soft: linear-gradient(135deg, #fffaf6, #fff1e8);
}

.family--netWorth {
  --family-color: var(--color-primary);
  --family-soft: linear-gradient(135deg, #f7fbff, #eaf4ff);
}

.family-header .family-icon {
  width: 2.75rem;
  height: 2.75rem;
  background: rgb(255 255 255 / 72%);
  color: var(--family-color);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 70%);
}

.family-header h2 {
  font-size: 1.18rem;
}

.family-header p {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  line-height: 1.35;
}

.family-count {
  margin-top: 1.1rem;
  font-size: 0.8rem;
}

.family-progress-track {
  height: 0.46rem;
  background: rgb(255 255 255 / 76%);
}

.family-progress-track > span,
.family--safety .family-progress-track > span,
.family--freedom .family-progress-track > span,
.family--debt .family-progress-track > span {
  background: var(--family-color);
}

.achievement-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-auto-flow: row;
  grid-auto-columns: auto;
  gap: 0.75rem;
  overflow: visible;
  padding: 0.75rem;
}

.achievement-list article {
  position: relative;
  grid-template-rows: 7rem minmax(2.65rem, auto) 2rem;
  min-width: 0;
  min-height: 12.7rem;
  padding: 0.6rem 0.75rem 0.7rem;
  border-radius: 1rem;
  background: linear-gradient(180deg, #fff, #fbfcfe);
  box-shadow: 0 0.3rem 0.9rem rgb(25 49 77 / 5%);
  cursor: pointer;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.achievement-list article:focus-visible {
  outline: 3px solid var(--color-primary-focus);
  outline-offset: 2px;
}

.achievement-list article:hover {
  border-color: color-mix(in srgb, var(--family-color) 38%, var(--color-line));
  box-shadow: 0 0.65rem 1.5rem rgb(25 49 77 / 10%);
  transform: translateY(-2px);
}

.achievement-list article.unlocked {
  border-color: color-mix(in srgb, var(--family-color) 48%, white);
  background: linear-gradient(180deg, color-mix(in srgb, var(--family-color) 6%, white), #fff 70%);
}

.achievement-list article.current {
  border-color: color-mix(in srgb, var(--family-color) 34%, var(--color-line));
  box-shadow: 0 0.4rem 1.2rem color-mix(in srgb, var(--family-color) 11%, transparent);
}

.achievement-list :deep(.milestone-badge),
.achievement-list :deep(.milestone-badge--final) {
  width: 7rem;
  height: 7rem;
}

.achievement-list :deep(.badge-asset) {
  width: 7.4rem;
  height: 7.4rem;
}

.achievement-list :deep(.milestone-badge > svg:not(.badge-laurel)) {
  width: 6.35rem;
  height: 6.35rem;
}

.achievement-list :deep(.badge-lock) {
  top: 0.3rem;
  right: 0.1rem;
  width: 1.75rem;
  height: 1.75rem;
  font-size: 1rem;
}

.achievement-list article > strong {
  max-width: 10.5rem;
  font-size: 0.9rem;
  line-height: 1.18;
}

.milestone-state {
  font-size: 0.76rem;
  font-weight: 650;
}

.achievement-detail-dialog {
  position: relative;
  width: min(92vw, 34rem);
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 1.5rem;
  background: radial-gradient(circle at 50% 18%, rgb(228 248 240 / 80%), transparent 15rem), #fff;
  color: var(--color-ink);
  box-shadow: var(--shadow-dialog);
}

.achievement-detail-close {
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 2;
  background: rgb(255 255 255 / 72%);
  backdrop-filter: blur(8px);
}

.achievement-detail-body {
  display: grid;
  justify-items: center;
  gap: 0.65rem;
  padding: 1.8rem 2rem 0.8rem;
  text-align: center;
}

.achievement-detail-badge,
.achievement-detail-body :deep(.milestone-badge--final) {
  width: 15rem;
  height: 15rem;
}

.achievement-detail-body :deep(.badge-asset) {
  width: 16rem;
  height: 16rem;
}

.achievement-detail-body :deep(.badge-lock) {
  width: 3rem;
  height: 3rem;
  font-size: 1.55rem;
}

.achievement-detail-family {
  color: var(--color-success-dark);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.achievement-detail-body h2 {
  margin: 0;
  font-size: clamp(1.65rem, 5vw, 2.2rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.achievement-detail-body p {
  max-width: 28rem;
  margin: 0;
  color: var(--color-copy);
  font-size: 0.95rem;
  line-height: 1.5;
}

.achievement-detail-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.35rem;
  color: var(--color-muted);
  font-size: 0.84rem;
  font-weight: 750;
  text-transform: uppercase;
}

.achievement-detail-status.achieved {
  color: var(--color-success-dark);
}

.achievement-detail-status .q-icon {
  font-size: 1.1rem;
}

.achievement-detail-dialog :deep(.q-card__actions) {
  padding: 0.8rem 2rem 1.7rem;
}

.achievement-share-button {
  min-width: 12rem;
  min-height: 2.8rem;
  border-radius: 999px;
  font-weight: 750;
}

@media (max-width: 1300px) and (min-width: 761px) {
  .achievement-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .milestone-filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: visible;
    padding-bottom: 0;
  }

  .milestone-filters button {
    min-width: 0;
  }
}

@media (max-width: 760px) {
  .achievements-page {
    padding-inline: 0.65rem;
    background:
      radial-gradient(circle at 80% 0%, rgb(228 248 240 / 70%), transparent 16rem),
      var(--color-page);
  }

  .milestone-filters {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 0.5rem;
    margin: 1rem 0 0;
    padding: 0;
  }

  .milestone-filters button {
    justify-content: flex-start;
    min-height: 2.75rem;
    padding: 0.5rem 0.85rem;
    font-size: 0.82rem;
  }

  .milestone-filters .milestone-filter--all {
    grid-column: span 4;
    order: 5;
    gap: var(--space-1);
    padding-inline: var(--space-2);
  }

  .milestone-filter--netWorth,
  .milestone-filter--freedom {
    grid-column: span 6;
  }

  .milestone-filter--netWorth {
    order: 1;
  }

  .milestone-filter--freedom {
    order: 2;
  }

  .milestone-filter--safety,
  .milestone-filter--debt {
    grid-column: span 4;
  }

  .milestone-filter--safety {
    order: 3;
  }

  .milestone-filter--debt {
    order: 4;
  }

  .milestone-filter--all .q-icon {
    font-size: 1rem;
  }

  .milestone-filters button .q-icon {
    font-size: 1.2rem;
  }

  .family-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.55rem;
    margin-top: 0.65rem;
  }

  .family-card,
  .achievement-list {
    display: contents;
  }

  .family-card {
    overflow: visible;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .family-header {
    display: none;
  }

  .achievement-list article {
    display: grid;
    grid-template-rows: 5.8rem minmax(2.35rem, auto) 1.55rem;
    gap: 0.25rem;
    min-width: 0;
    min-height: 10.8rem;
    padding: 0.55rem 0.3rem 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: 1.15rem;
    background: linear-gradient(180deg, #fff, #f9fbfd);
    box-shadow: 0 0.45rem 1.1rem rgb(28 51 79 / 7%);
  }

  .achievement-list article.current,
  .family--freedom .achievement-list article.current,
  .family--debt .achievement-list article.current {
    border: 1px solid color-mix(in srgb, var(--family-color) 38%, var(--color-line));
    box-shadow: 0 0.45rem 1.1rem color-mix(in srgb, var(--family-color) 10%, transparent);
  }

  .achievement-list article:hover {
    transform: none;
  }

  .achievement-list :deep(.milestone-badge),
  .achievement-list :deep(.milestone-badge--final) {
    width: 5.7rem;
    height: 5.7rem;
  }

  .achievement-list :deep(.badge-asset) {
    width: 6rem;
    height: 6rem;
  }

  .achievement-list :deep(.milestone-badge > svg:not(.badge-laurel)) {
    width: 5.2rem;
    height: 5.2rem;
  }

  .achievement-list :deep(.badge-lock) {
    top: 0.1rem;
    right: -0.15rem;
    width: 1.65rem;
    height: 1.65rem;
  }

  .achievement-list article > .milestone-title {
    display: block;
    max-width: 6.5rem;
    font-size: 0.78rem;
    line-height: 1.16;
  }

  .milestone-state {
    gap: 0.25rem;
    font-size: 0.62rem;
    text-transform: uppercase;
  }

  .milestone-state span {
    display: inline;
  }

  .milestone-current-row {
    grid-template-columns: minmax(3rem, 1fr) auto;
    gap: 0.35rem;
    width: calc(100% - 0.6rem);
    font-size: 0.67rem;
  }

  .milestone-current-row b {
    grid-row: auto;
  }

  .achievement-list article > small {
    display: none;
  }

  .achievement-detail-dialog {
    width: calc(100vw - 1.25rem);
    border-radius: 1.35rem;
  }

  .achievement-detail-body {
    gap: 0.55rem;
    padding: 1.35rem 1.1rem 0.65rem;
  }

  .achievement-detail-badge,
  .achievement-detail-body :deep(.milestone-badge--final) {
    width: 12rem;
    height: 12rem;
  }

  .achievement-detail-body :deep(.badge-asset) {
    width: 13rem;
    height: 13rem;
  }

  .achievement-detail-body p {
    font-size: 0.9rem;
  }

  .achievement-detail-dialog :deep(.q-card__actions) {
    padding: 0.7rem 1.1rem 1.25rem;
  }
}

@media (max-width: 360px) {
  .family-grid {
    gap: 0.4rem;
  }

  .achievement-list article {
    grid-template-rows: 5.1rem minmax(2.35rem, auto) 1.5rem;
    min-height: 10.1rem;
  }

  .achievement-list :deep(.milestone-badge),
  .achievement-list :deep(.milestone-badge--final) {
    width: 5rem;
    height: 5rem;
  }

  .achievement-list :deep(.badge-asset) {
    width: 5.25rem;
    height: 5.25rem;
  }
}
</style>
