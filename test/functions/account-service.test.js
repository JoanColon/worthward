import { describe, expect, it, vi } from 'vitest'
import { deleteAccountData } from '../../functions/features/accounts/service.js'

function createFirestore(initialRecords) {
  const records = new Map(Object.entries(initialRecords))

  function reference(path) {
    return {
      id: path.split('/').at(-1),
      path,
      async update(data) {
        records.set(path, { ...records.get(path), ...data })
      },
    }
  }

  function documentsForQuery(collectionName, field, value) {
    const prefix = `${collectionName}/`
    return [...records.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .filter(([, data]) =>
        Array.isArray(data?.[field]) ? data[field].includes(value) : data?.[field] === value,
      )
      .map(([path, data]) => ({
        id: path.split('/').at(-1),
        ref: reference(path),
        data: () => data,
      }))
  }

  const firestore = {
    collection(name) {
      return {
        doc(id) {
          return reference(`${name}/${id}`)
        },
        where(field, _operator, value) {
          return {
            async get() {
              const docs = documentsForQuery(name, field, value)
              return { docs, size: docs.length }
            },
          }
        },
      }
    },
    async runTransaction(callback) {
      return callback({
        async get(target) {
          const data = records.get(target.path)
          return { exists: data != null, data: () => data }
        },
        update(target, data) {
          records.set(target.path, { ...records.get(target.path), ...data })
        },
      })
    },
    batch() {
      const updates = []
      return {
        update(target, data) {
          updates.push([target, data])
        },
        async commit() {
          for (const [target, data] of updates) {
            records.set(target.path, { ...records.get(target.path), ...data })
          }
        },
      }
    },
    async recursiveDelete(target) {
      for (const path of [...records.keys()]) {
        if (path === target.path || path.startsWith(`${target.path}/`)) records.delete(path)
      }
    },
  }

  return { firestore, records }
}

describe('account deletion', () => {
  it('blocks deletion while the user owns a shared workspace', async () => {
    const { firestore, records } = createFirestore({
      'workspaces/shared': {
        createdBy: 'user-a',
        memberIds: ['user-a', 'user-b'],
        members: { 'user-a': { role: 'owner' }, 'user-b': { role: 'member' } },
      },
    })
    const auth = { deleteUser: vi.fn() }

    await expect(deleteAccountData(firestore, { auth, userId: 'user-a' })).rejects.toMatchObject({
      code: 'failed-precondition',
    })
    expect(records.has('workspaces/shared')).toBe(true)
    expect(auth.deleteUser).not.toHaveBeenCalled()
  })

  it('removes personal data and leaves workspaces owned by other users intact', async () => {
    const { firestore, records } = createFirestore({
      'workspaces/personal': {
        createdBy: 'user-a',
        memberIds: ['user-a'],
        members: { 'user-a': { role: 'owner' } },
      },
      'workspaces/guest': {
        createdBy: 'user-b',
        memberIds: ['user-b', 'user-a'],
        members: { 'user-b': { role: 'owner' }, 'user-a': { role: 'member' } },
      },
      'billingPurchases/purchase': { userId: 'user-a', purchaseToken: 'token' },
      'users/user-a': { activeWorkspaceId: 'personal' },
      'users/user-a/private/subscription': { plan: 'pro' },
    })
    const auth = { deleteUser: vi.fn().mockResolvedValue(undefined) }

    await expect(deleteAccountData(firestore, { auth, userId: 'user-a' })).resolves.toEqual({
      status: 'deleted',
    })
    expect(records.has('workspaces/personal')).toBe(false)
    expect(records.get('workspaces/guest').memberIds).toEqual(['user-b'])
    expect(records.get('workspaces/guest').members['user-a']).toBeUndefined()
    expect(records.has('billingPurchases/purchase')).toBe(false)
    expect(records.has('users/user-a')).toBe(false)
    expect(records.has('users/user-a/private/subscription')).toBe(false)
    expect(auth.deleteUser).toHaveBeenCalledWith('user-a')
  })
})
