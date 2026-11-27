import { describe, expect, it, vi } from 'vitest'
import { getWorkspaceAccess } from '../../functions/features/workspaces/access.js'
import { mutateFinancialModel } from '../../functions/features/financial-model/service.js'
import { rebuildFinancialYear } from '../../functions/features/financial-years/service.js'
import {
  syncInvestmentPortfolio,
  syncWorkspaceInvestmentPortfolios,
  updateInvestmentPortfolio,
} from '../../functions/features/investment-portfolios/service.js'
import {
  createWorkspaceInvite,
  deleteWorkspaceData,
  updateWorkspaceSettings,
} from '../../functions/features/workspaces/service.js'
import {
  assertMutableWorkspaceId,
  DEMO_FINANCIAL_YEAR,
  DEMO_OBSERVED_MONTH,
  DEMO_REFERENCE_DATE,
  DEMO_WORKSPACE_ID,
  financialMonthForWorkspace,
  financialYearForWorkspace,
  isDemoWorkspaceId,
} from '../../functions/shared/workspaces/demo.js'

describe('demo workspace contract', () => {
  it('uses a single reserved identifier and frozen reporting period', () => {
    expect(isDemoWorkspaceId(DEMO_WORKSPACE_ID)).toBe(true)
    expect(isDemoWorkspaceId('workspace-a')).toBe(false)
    expect(DEMO_REFERENCE_DATE).toBe('2026-11-26')
    expect(financialYearForWorkspace(DEMO_WORKSPACE_ID, 2040)).toBe(DEMO_FINANCIAL_YEAR)
    expect(financialMonthForWorkspace(DEMO_WORKSPACE_ID, '03')).toBe(DEMO_OBSERVED_MONTH)
  })

  it('rejects the reserved workspace at shared mutation boundaries', () => {
    expect(() => assertMutableWorkspaceId('workspace-a')).not.toThrow()
    expect(() => assertMutableWorkspaceId(DEMO_WORKSPACE_ID)).toThrowError(
      expect.objectContaining({ code: 'permission-denied' }),
    )
  })

  it('projects contextual Pro visibility without granting membership or writes', async () => {
    const workspace = {
      memberIds: ['demo-alex'],
      members: { 'demo-alex': { role: 'owner' } },
      entitlement: { tier: 'pro', expiresAt: new Date('2099-01-01') },
    }
    const get = vi.fn().mockResolvedValue({ exists: true, data: () => workspace })
    const reference = { get }
    const firestore = {
      collection: vi.fn(() => ({ doc: vi.fn(() => reference) })),
    }

    const access = await getWorkspaceAccess(firestore, {
      workspaceId: DEMO_WORKSPACE_ID,
      userId: 'authenticated-viewer',
    })

    expect(access.capabilities).toMatchObject({
      tier: 'pro',
      isPro: true,
      isMember: false,
      isOwner: false,
      canRead: true,
      canWrite: false,
      canUseStrategy: true,
      canUseAdvancedModels: true,
      canInviteMembers: false,
    })
  })

  it('rejects backend mutations before touching Firestore or external sources', async () => {
    const blocked = { code: 'permission-denied' }
    await expect(
      mutateFinancialModel(null, {
        workspaceId: DEMO_WORKSPACE_ID,
        userId: 'viewer',
        section: 'assets',
        operation: 'delete',
      }),
    ).rejects.toMatchObject(blocked)
    await expect(rebuildFinancialYear(null, DEMO_WORKSPACE_ID, 2026)).rejects.toMatchObject(blocked)
    await expect(
      updateInvestmentPortfolio(null, {
        workspaceId: DEMO_WORKSPACE_ID,
        userId: 'viewer',
        assetId: 'portfolio',
      }),
    ).rejects.toMatchObject(blocked)
    await expect(
      syncInvestmentPortfolio(null, {
        workspaceId: DEMO_WORKSPACE_ID,
        userId: 'viewer',
        assetId: 'portfolio',
      }),
    ).rejects.toMatchObject(blocked)
    await expect(
      syncWorkspaceInvestmentPortfolios(null, { workspaceId: DEMO_WORKSPACE_ID }),
    ).rejects.toMatchObject(blocked)
    await expect(
      createWorkspaceInvite(null, { workspaceId: DEMO_WORKSPACE_ID, userId: 'viewer' }),
    ).rejects.toMatchObject(blocked)
    await expect(
      updateWorkspaceSettings(null, { workspaceId: DEMO_WORKSPACE_ID, userId: 'viewer' }),
    ).rejects.toMatchObject(blocked)
    await expect(deleteWorkspaceData(null, { id: DEMO_WORKSPACE_ID })).rejects.toMatchObject(blocked)
  })
})
