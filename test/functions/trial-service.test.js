import { describe, expect, it } from 'vitest'
import {
  claimProTrialEndNotice,
  startProTrial,
} from '../../functions/features/trials/service.js'

const USER_ID = 'user-a'

function timestamp(value) {
  const date = new Date(value)
  return { toMillis: () => date.getTime(), toDate: () => date }
}

function createFirestore(initialRecords = {}) {
  const records = new Map(Object.entries(initialRecords))

  function reference(path) {
    return {
      id: path.split('/').at(-1),
      path,
      collection(name) {
        return { doc: (id) => reference(`${path}/${name}/${id}`) }
      },
    }
  }

  function snapshot(target) {
    const data = records.get(target.path)
    return { exists: data != null, data: () => data, ref: target, id: target.id }
  }

  return {
    records,
    firestore: {
      collection(name) {
        return {
          doc: (id) => reference(`${name}/${id}`),
          where(field, operator, value) {
            return { kind: 'query', collection: name, field, operator, value }
          },
        }
      },
      async runTransaction(callback) {
        return callback({
          get(target) {
            if (target.kind === 'query') {
              const docs = [...records.entries()]
                .filter(([path, data]) => {
                  const parts = path.split('/')
                  return (
                    parts.length === 2 &&
                    parts[0] === target.collection &&
                    target.operator === '==' &&
                    data?.[target.field] === target.value
                  )
                })
                .map(([path]) => snapshot(reference(path)))
              return Promise.resolve({ docs })
            }
            return Promise.resolve(snapshot(target))
          },
          create(target, data) {
            if (records.has(target.path)) throw new Error('Document already exists')
            records.set(target.path, data)
          },
          update(target, data) {
            records.set(target.path, { ...records.get(target.path), ...data })
          },
        })
      },
    },
  }
}

describe('Pro trial service', () => {
  it('atomically creates a 30-day trial and projects owned workspaces', async () => {
    const workspacePath = 'workspaces/workspace-a'
    const { firestore, records } = createFirestore({
      [workspacePath]: { createdBy: USER_ID, entitlement: { tier: 'free', expiresAt: null } },
    })

    const result = await startProTrial(firestore, {
      userId: USER_ID,
      emailVerified: true,
      now: new Date('2026-11-01T12:00:00Z'),
    })

    expect(result).toEqual({
      startedAt: '2026-11-01T12:00:00.000Z',
      expiresAt: '2026-12-01T12:00:00.000Z',
    })
    expect(records.get(`users/${USER_ID}/private/trial`)).toMatchObject({
      endedNoticeShownAt: null,
    })
    expect(records.get(workspacePath).entitlement.tier).toBe('pro')
    expect(records.get(workspacePath).entitlement.expiresAt.toMillis()).toBe(
      Date.parse('2026-12-01T12:00:00Z'),
    )
  })

  it('returns the same active trial for an idempotent retry', async () => {
    const trialPath = `users/${USER_ID}/private/trial`
    const trial = {
      startedAt: timestamp('2026-11-01T12:00:00Z'),
      expiresAt: timestamp('2026-12-01T12:00:00Z'),
    }
    const { firestore } = createFirestore({ [trialPath]: trial })

    await expect(
      startProTrial(firestore, {
        userId: USER_ID,
        emailVerified: true,
        now: new Date('2026-11-02T12:00:00Z'),
      }),
    ).resolves.toEqual({
      startedAt: '2026-11-01T12:00:00.000Z',
      expiresAt: '2026-12-01T12:00:00.000Z',
    })
  })

  it('rejects unverified, paid, and previously expired accounts', async () => {
    const empty = createFirestore().firestore
    await expect(
      startProTrial(empty, { userId: USER_ID, emailVerified: false }),
    ).rejects.toMatchObject({ reason: 'EMAIL_NOT_VERIFIED' })

    const paid = createFirestore({
      [`users/${USER_ID}/private/subscription`]: {
        plan: 'pro',
        source: 'google_play',
        entitlementActive: true,
        currentPeriodEndsAt: timestamp('2027-01-01T00:00:00Z'),
      },
    }).firestore
    await expect(
      startProTrial(paid, {
        userId: USER_ID,
        emailVerified: true,
        now: new Date('2026-11-01T00:00:00Z'),
      }),
    ).rejects.toMatchObject({ reason: 'PRO_ALREADY_ACTIVE' })

    const expired = createFirestore({
      [`users/${USER_ID}/private/trial`]: {
        startedAt: timestamp('2026-09-01T00:00:00Z'),
        expiresAt: timestamp('2026-10-01T00:00:00Z'),
      },
    }).firestore
    await expect(
      startProTrial(expired, {
        userId: USER_ID,
        emailVerified: true,
        now: new Date('2026-11-01T00:00:00Z'),
      }),
    ).rejects.toMatchObject({ reason: 'TRIAL_ALREADY_USED' })
  })

  it('claims the end notice once after expiry', async () => {
    const trialPath = `users/${USER_ID}/private/trial`
    const { firestore } = createFirestore({
      [trialPath]: {
        startedAt: timestamp('2026-09-01T00:00:00Z'),
        expiresAt: timestamp('2026-10-01T00:00:00Z'),
      },
    })

    await expect(
      claimProTrialEndNotice(firestore, {
        userId: USER_ID,
        now: new Date('2026-11-01T00:00:00Z'),
      }),
    ).resolves.toEqual({ shouldShow: true })
    await expect(
      claimProTrialEndNotice(firestore, {
        userId: USER_ID,
        now: new Date('2026-11-01T00:00:00Z'),
      }),
    ).resolves.toEqual({ shouldShow: false })
  })
})
