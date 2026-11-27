import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { assertMutableWorkspaceId } from '@/domain/access/demo-workspace'

export const MILESTONE_CONFIRMATION_DELAY_MS = 24 * 60 * 60 * 1000

export async function getAchievements(workspaceId) {
  const snapshot = await getDocs(collection(db, 'workspaces', workspaceId, 'achievements'))
  return snapshot.docs.map((achievement) => ({ id: achievement.id, ...achievement.data() }))
}

export async function activateMilestoneTracking(
  workspaceId,
  milestoneProgress,
  existingAchievements = [],
) {
  assertMutableWorkspaceId(workspaceId)
  const batch = writeBatch(db)
  const workspaceReference = doc(db, 'workspaces', workspaceId)
  const reached = milestoneProgress.filter((milestone) => milestone.reached)
  const reachedIds = new Set(reached.map((milestone) => milestone.id))
  const activatedAt = new Date()

  for (const achievement of existingAchievements) {
    const milestoneId = achievement.milestoneId || achievement.id
    if (milestoneId && !reachedIds.has(milestoneId)) {
      batch.delete(achievementReference(workspaceId, milestoneId))
    }
  }
  for (const milestone of reached) {
    batch.set(achievementReference(workspaceId, milestone.id), {
      milestoneId: milestone.id,
      family: milestone.family,
      status: 'achieved',
      achievedAt: serverTimestamp(),
      achievedValue: milestone.currentValue,
    })
  }
  batch.update(workspaceReference, {
    milestoneTracking: { status: 'active', activatedAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  return {
    achievements: reached.map((milestone) => ({
      id: milestone.id,
      milestoneId: milestone.id,
      family: milestone.family,
      status: 'achieved',
      achievedAt: activatedAt,
      achievedValue: milestone.currentValue,
    })),
    milestoneTracking: { status: 'active', activatedAt },
  }
}

export async function syncMilestoneAchievements(
  workspaceId,
  milestoneProgress,
  existingAchievements = [],
  now = Date.now(),
) {
  assertMutableWorkspaceId(workspaceId)
  const batch = writeBatch(db)
  const existingById = new Map(
    existingAchievements.map((achievement) => [
      achievement.milestoneId || achievement.id,
      achievement,
    ]),
  )
  const nextById = new Map(existingById)
  let writeCount = 0

  for (const milestone of milestoneProgress) {
    const existing = existingById.get(milestone.id)
    const reference = achievementReference(workspaceId, milestone.id)
    if (!existing) {
      if (!milestone.reached) continue
      const qualifiedAt = new Date(now)
      batch.set(reference, {
        milestoneId: milestone.id,
        family: milestone.family,
        status: 'pending',
        qualifiedAt: serverTimestamp(),
        qualifiedValue: milestone.currentValue,
      })
      nextById.set(milestone.id, {
        id: milestone.id,
        milestoneId: milestone.id,
        family: milestone.family,
        status: 'pending',
        qualifiedAt,
        qualifiedValue: milestone.currentValue,
      })
      writeCount += 1
      continue
    }

    if (!milestone.reached) {
      batch.delete(reference)
      nextById.delete(milestone.id)
      writeCount += 1
      continue
    }

    if (existing.status === 'pending' && confirmationIsDue(existing.qualifiedAt, now)) {
      const achievedAt = new Date(now)
      batch.update(reference, {
        status: 'achieved',
        achievedAt: serverTimestamp(),
        achievedValue: milestone.currentValue,
      })
      nextById.set(milestone.id, {
        ...existing,
        id: existing.id || milestone.id,
        milestoneId: milestone.id,
        status: 'achieved',
        achievedAt,
        achievedValue: milestone.currentValue,
      })
      writeCount += 1
    }
  }

  if (writeCount) await batch.commit()
  return [...nextById.values()]
}

function achievementReference(workspaceId, milestoneId) {
  return doc(db, 'workspaces', workspaceId, 'achievements', milestoneId)
}

export function confirmationIsDue(qualifiedAt, now = Date.now()) {
  const dueAt = milestoneConfirmationDueAt(qualifiedAt)
  return dueAt !== null && now >= dueAt
}

export function milestoneConfirmationDueAt(qualifiedAt) {
  const qualifiedAtMs = timestampMilliseconds(qualifiedAt)
  return qualifiedAtMs === null ? null : qualifiedAtMs + MILESTONE_CONFIRMATION_DELAY_MS
}

function timestampMilliseconds(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (typeof value?.toDate === 'function') return value.toDate().getTime()
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}
