import { describe, expect, it } from 'vitest'
import * as firebaseFunctions from '../../functions/index.js'

const publicFunctionNames = [
  'acceptWorkspaceInvite',
  'closeMonthlyFinancialPositions',
  'createWorkspace',
  'createWorkspaceInvite',
  'deleteAccount',
  'deleteWorkspace',
  'ensureFinancialYear',
  'getWorkspaceInvite',
  'mutateFinancialModel',
  'onExpenseTrackingWritten',
  'onModelConfigWritten',
  'readInvestmentPortfolioSheet',
  'reconcileGooglePlaySubscriptions',
  'syncWorkspaceInvestmentPortfolios',
  'updateInvestmentPortfolio',
  'updateWorkspaceSettings',
  'verifyGooglePlaySubscription',
]

describe('Firebase Functions public entry points', () => {
  it('preserves the deployed export names', () => {
    expect(Object.keys(firebaseFunctions).sort()).toEqual(publicFunctionNames)
  })

  it('preserves trigger paths, retries, and scheduler configuration', () => {
    expect(firebaseFunctions.onModelConfigWritten.__endpoint.eventTrigger).toMatchObject({
      eventFilterPathPatterns: {
        document: 'workspaces/{workspaceId}/modelConfig/{section}',
      },
      retry: true,
    })
    expect(firebaseFunctions.onExpenseTrackingWritten.__endpoint.eventTrigger).toMatchObject({
      eventFilterPathPatterns: {
        document: 'workspaces/{workspaceId}/expenseTracking/{period}',
      },
      retry: true,
    })
    expect(firebaseFunctions.closeMonthlyFinancialPositions.__endpoint).toMatchObject({
      region: ['europe-west1'],
      timeoutSeconds: 540,
      scheduleTrigger: {
        schedule: '5 0 1 * *',
        retryConfig: { retryCount: 3 },
        timeZone: 'Europe/Madrid',
      },
    })
    expect(firebaseFunctions.reconcileGooglePlaySubscriptions.__endpoint).toMatchObject({
      region: ['europe-west1'],
      timeoutSeconds: 540,
      scheduleTrigger: {
        schedule: 'every 6 hours',
        retryConfig: { retryCount: 3 },
        timeZone: 'Europe/Madrid',
      },
    })
  })

  it('preserves callable regions and the portfolio timeout override', () => {
    const callableNames = publicFunctionNames.filter(
      (name) =>
        ![
          'closeMonthlyFinancialPositions',
          'reconcileGooglePlaySubscriptions',
          'onExpenseTrackingWritten',
          'onModelConfigWritten',
        ].includes(name),
    )
    for (const name of callableNames) {
      expect(firebaseFunctions[name].__endpoint).toMatchObject({
        region: ['europe-west1'],
        callableTrigger: {},
      })
    }
    expect(firebaseFunctions.syncWorkspaceInvestmentPortfolios.__endpoint.timeoutSeconds).toBe(120)
  })
})
