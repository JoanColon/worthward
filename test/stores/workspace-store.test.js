import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const {
  createWorkspace,
  deleteWorkspace,
  getActiveWorkspaceId,
  getUserWorkspaces,
  saveActiveWorkspaceId,
  updateWorkspaceSettings,
} = vi.hoisted(() => ({
  createWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  getActiveWorkspaceId: vi.fn(),
  getUserWorkspaces: vi.fn(),
  saveActiveWorkspaceId: vi.fn(),
  updateWorkspaceSettings: vi.fn(),
}))

vi.mock('@/services/firebase/workspace.service', () => ({
  createWorkspace,
  deleteWorkspace,
  getUserWorkspaces,
  updateWorkspaceSettings,
}))

vi.mock('@/services/firebase/user-preferences.service', () => ({
  getActiveWorkspaceId,
  saveActiveWorkspaceId,
}))

import { useWorkspaceStore } from '../../src/stores/workspace-store'

describe('workspace store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    createWorkspace.mockReset()
    deleteWorkspace.mockReset()
    getActiveWorkspaceId.mockReset().mockResolvedValue(null)
    getUserWorkspaces.mockReset()
    saveActiveWorkspaceId.mockReset().mockResolvedValue()
    updateWorkspaceSettings.mockReset()
  })

  it('distinguishes a failed load from a successfully empty workspace list', async () => {
    const store = useWorkspaceStore()
    const failure = new Error('permission denied')
    getUserWorkspaces.mockRejectedValueOnce(failure)

    await expect(store.load({ uid: 'user-a' })).rejects.toThrow('permission denied')
    expect(store.ready).toBe(false)
    expect(store.error).toBe(failure)

    getUserWorkspaces.mockResolvedValueOnce([])
    await store.load({ uid: 'user-a' }, true)

    expect(store.ready).toBe(true)
    expect(store.error).toBeNull()
    expect(store.workspaces).toEqual([])
  })

  it('does not restore a stale workspace response after reset', async () => {
    let resolveWorkspaces
    getUserWorkspaces.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWorkspaces = resolve
      }),
    )
    const store = useWorkspaceStore()

    const pendingLoad = store.load({ uid: 'user-a' })
    store.reset()
    resolveWorkspaces([{ id: 'workspace-a', name: 'Private' }])
    await pendingLoad

    expect(store.ready).toBe(false)
    expect(store.workspaces).toEqual([])
    expect(store.activeWorkspaceId).toBeNull()
  })

  it('keeps the newest user when workspace loads finish out of order', async () => {
    let resolveFirstUser
    getUserWorkspaces
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstUser = resolve
        }),
      )
      .mockResolvedValueOnce([{ id: 'workspace-b', name: 'Current' }])
    const store = useWorkspaceStore()

    const firstLoad = store.load({ uid: 'user-a' })
    await store.load({ uid: 'user-b' })
    resolveFirstUser([{ id: 'workspace-a', name: 'Stale' }])
    await firstLoad

    expect(store.workspaces).toEqual([{ id: 'workspace-b', name: 'Current' }])
    expect(store.ready).toBe(true)
    expect(store.activeWorkspaceId).toBe('workspace-b')
  })

  it('automatically activates and persists the only workspace', async () => {
    getUserWorkspaces.mockResolvedValueOnce([{ id: 'workspace-a', name: 'Family' }])
    const store = useWorkspaceStore()

    await store.load({ uid: 'user-a' })

    expect(store.activeWorkspaceId).toBe('workspace-a')
    expect(saveActiveWorkspaceId).toHaveBeenCalledWith('workspace-a')
  })

  it('restores a valid active workspace for the current user', async () => {
    getActiveWorkspaceId.mockResolvedValueOnce('workspace-b')
    getUserWorkspaces.mockResolvedValueOnce([
      { id: 'workspace-a', name: 'Personal' },
      { id: 'workspace-b', name: 'Family' },
    ])
    const store = useWorkspaceStore()

    await store.load({ uid: 'user-a' })

    expect(store.activeWorkspaceId).toBe('workspace-b')
    expect(store.activeWorkspace?.name).toBe('Family')
    expect(saveActiveWorkspaceId).not.toHaveBeenCalled()
  })

  it('keeps workspace selection open when multiple workspaces have no active selection', async () => {
    getUserWorkspaces.mockResolvedValueOnce([
      { id: 'workspace-a', name: 'Personal' },
      { id: 'workspace-b', name: 'Family' },
    ])
    const store = useWorkspaceStore()

    await store.load({ uid: 'user-a' })

    expect(store.activeWorkspaceId).toBeNull()
  })

  it('clears an inaccessible stored workspace and safely selects the only remaining one', async () => {
    getActiveWorkspaceId.mockResolvedValueOnce('workspace-removed')
    getUserWorkspaces.mockResolvedValueOnce([{ id: 'workspace-a', name: 'Personal' }])
    const store = useWorkspaceStore()

    await store.load({ uid: 'user-a' })

    expect(store.activeWorkspaceId).toBe('workspace-a')
    expect(saveActiveWorkspaceId).toHaveBeenCalledWith('workspace-a')
  })

  it('falls back to selection when an inaccessible stored workspace has multiple alternatives', async () => {
    getActiveWorkspaceId.mockResolvedValueOnce('workspace-removed')
    getUserWorkspaces.mockResolvedValueOnce([
      { id: 'workspace-a', name: 'Personal' },
      { id: 'workspace-b', name: 'Family' },
    ])
    const store = useWorkspaceStore()

    await store.load({ uid: 'user-a' })

    expect(store.activeWorkspaceId).toBeNull()
    expect(saveActiveWorkspaceId).toHaveBeenCalledWith(null)
  })

  it('activates newly created workspaces and clears a deleted active workspace', async () => {
    getUserWorkspaces.mockResolvedValueOnce([
      { id: 'workspace-a', name: 'Personal' },
      { id: 'workspace-b', name: 'Family' },
    ])
    createWorkspace.mockResolvedValueOnce({
      id: 'workspace-c',
      name: 'Business',
      createdBy: 'user-a',
    })
    deleteWorkspace.mockResolvedValueOnce()
    const store = useWorkspaceStore()
    await store.load({ uid: 'user-a' })

    await store.create({ name: 'Business' })
    expect(store.activeWorkspaceId).toBe('workspace-c')

    await store.deleteWorkspace('workspace-c')
    expect(store.activeWorkspaceId).toBeNull()
    expect(saveActiveWorkspaceId).toHaveBeenLastCalledWith(null)
  })

  it('keeps a created workspace active when saving the preference fails', async () => {
    getUserWorkspaces.mockResolvedValueOnce([])
    createWorkspace.mockResolvedValueOnce({
      id: 'workspace-new',
      name: 'Home',
      createdBy: 'user-a',
    })
    saveActiveWorkspaceId.mockRejectedValueOnce(new Error('preference unavailable'))
    const store = useWorkspaceStore()
    await store.load({ uid: 'user-a' })

    const workspace = await store.create({ name: 'Home' })

    expect(workspace.id).toBe('workspace-new')
    expect(store.activeWorkspaceId).toBe('workspace-new')
    expect(store.workspaces).toContainEqual(workspace)
  })

  it('updates workspace settings in local state', async () => {
    getUserWorkspaces.mockResolvedValueOnce([
      { id: 'workspace-a', currency: 'EUR', members: { user: { displayName: 'Old' } } },
    ])
    updateWorkspaceSettings.mockResolvedValueOnce({
      currency: 'USD',
      members: { user: { displayName: 'Alex' } },
    })
    const store = useWorkspaceStore()
    await store.load({ uid: 'user' })

    await store.updateSettings('workspace-a', {
      currency: 'USD',
      memberNames: { user: 'Alex' },
    })

    expect(store.workspaces[0]).toMatchObject({
      id: 'workspace-a',
      currency: 'USD',
      members: { user: { displayName: 'Alex' } },
    })
  })

  it('keeps demo selection session-local and excludes it from real workspace state', async () => {
    getUserWorkspaces.mockResolvedValueOnce([
      { id: 'workspace-a', name: 'Personal' },
      { id: 'worthward_demo', name: 'Demo' },
    ])
    const store = useWorkspaceStore()
    await store.load({ uid: 'user-a' })
    saveActiveWorkspaceId.mockClear()

    await store.setActiveWorkspace('worthward_demo')

    expect(store.activeWorkspaceIsDemo).toBe(true)
    expect(store.realWorkspaces.map(({ id }) => id)).toEqual(['workspace-a'])
    expect(store.hasWorkspaces).toBe(true)
    expect(saveActiveWorkspaceId).not.toHaveBeenCalled()
  })
})
