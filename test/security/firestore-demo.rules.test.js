import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'

const DEMO_WORKSPACE_ID = 'worthward_demo'
const hasEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
let environment

describe.skipIf(!hasEmulator)('Firestore demo workspace rules', () => {
  beforeAll(async () => {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':')
    environment = await initializeTestEnvironment({
      projectId: 'worthward-rules-test',
      firestore: {
        host,
        port: Number(port),
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    })
  })

  beforeEach(async () => {
    await environment.clearFirestore()
    await environment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await setDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID), {
        memberIds: ['alex-demo', 'emma-demo'],
        members: {},
        milestoneTracking: { active: true },
      })
      await setDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, 'financialYears', '2026'), {
        schemaVersion: 1,
      })
      await setDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, 'achievements', 'safety_1'), {
        status: 'achieved',
      })
      await setDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, 'modelConfig', 'assets'), {
        setupCompleted: true,
      })
      await setDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, 'modelAssets', 'cash'), {
        currentValue: 1000,
      })
      await setDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, 'expenseTracking', '2026-11'), {
        total: 100,
      })
      await setDoc(doc(firestore, 'workspaces', 'ordinary'), {
        memberIds: ['member'],
        milestoneTracking: { active: false },
        entitlement: { tier: 'free' },
      })
    })
  })

  afterAll(async () => environment?.cleanup())

  test('denies unauthenticated demo reads', async () => {
    const firestore = environment.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID)))
    await assertFails(
      getDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, 'modelAssets', 'cash')),
    )
  })

  test('allows authenticated reads only for supported demo documents', async () => {
    const firestore = environment.authenticatedContext('viewer').firestore()
    const readablePaths = [
      ['workspaces', DEMO_WORKSPACE_ID],
      ['workspaces', DEMO_WORKSPACE_ID, 'financialYears', '2026'],
      ['workspaces', DEMO_WORKSPACE_ID, 'achievements', 'safety_1'],
      ['workspaces', DEMO_WORKSPACE_ID, 'modelConfig', 'assets'],
      ['workspaces', DEMO_WORKSPACE_ID, 'modelAssets', 'cash'],
      ['workspaces', DEMO_WORKSPACE_ID, 'expenseTracking', '2026-11'],
    ]
    for (const path of readablePaths) await assertSucceeds(getDoc(doc(firestore, ...path)))

    await assertFails(
      getDoc(doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, 'privateData', 'secret')),
    )
  })

  test('denies every client write shape in the demo workspace', async () => {
    const firestore = environment.authenticatedContext('viewer').firestore()
    const workspace = doc(firestore, 'workspaces', DEMO_WORKSPACE_ID)
    await assertFails(updateDoc(workspace, { milestoneTracking: { active: false } }))
    await assertFails(deleteDoc(workspace))

    const targets = [
      ['financialYears', '2026'],
      ['achievements', 'safety_1'],
      ['modelConfig', 'assets'],
      ['modelAssets', 'cash'],
      ['modelLiabilities', 'mortgage'],
      ['modelIncome', 'salary'],
      ['modelExpenses', 'rent'],
      ['expenseTracking', '2026-11'],
    ]
    for (const [collection, id] of targets) {
      const target = doc(firestore, 'workspaces', DEMO_WORKSPACE_ID, collection, id)
      await assertFails(setDoc(target, { blocked: true }, { merge: true }))
      await assertFails(deleteDoc(target))
    }
  })

  test('preserves ordinary member access and denies non-members', async () => {
    const member = environment.authenticatedContext('member').firestore()
    const outsider = environment.authenticatedContext('outsider').firestore()
    const workspace = doc(member, 'workspaces', 'ordinary')

    await assertSucceeds(getDoc(workspace))
    await assertSucceeds(
      updateDoc(workspace, {
        milestoneTracking: { active: true },
        updatedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      setDoc(doc(member, 'workspaces', 'ordinary', 'modelConfig', 'assets'), {
        setupCompleted: true,
      }),
    )
    await assertFails(getDoc(doc(outsider, 'workspaces', 'ordinary')))
    await assertFails(
      setDoc(doc(outsider, 'workspaces', 'ordinary', 'expenseTracking', '2026-11'), {
        total: 0,
      }),
    )
  })

  test('prevents persisting the demo as a user preference', async () => {
    const firestore = environment.authenticatedContext('viewer').firestore()
    await assertFails(
      setDoc(doc(firestore, 'users', 'viewer'), {
        activeWorkspaceId: DEMO_WORKSPACE_ID,
        updatedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      setDoc(doc(firestore, 'users', 'viewer'), {
        activeWorkspaceId: 'ordinary',
        updatedAt: serverTimestamp(),
      }),
    )
  })
})
