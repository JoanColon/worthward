export const DEMO_WORKSPACE_ID = 'worthward_demo'
export const DEMO_REFERENCE_DATE = '2026-11-26'
export const DEMO_FINANCIAL_YEAR = 2026
export const DEMO_OBSERVED_MONTH = '11'

export function isDemoWorkspaceId(workspaceId) {
  return String(workspaceId || '') === DEMO_WORKSPACE_ID
}

export function financialYearForWorkspace(workspaceId, fallbackYear) {
  return isDemoWorkspaceId(workspaceId) ? DEMO_FINANCIAL_YEAR : fallbackYear
}

export function financialMonthForWorkspace(workspaceId, fallbackMonth) {
  return isDemoWorkspaceId(workspaceId) ? DEMO_OBSERVED_MONTH : fallbackMonth
}

export function assertMutableWorkspaceId(workspaceId) {
  if (!isDemoWorkspaceId(workspaceId)) return
  const error = new Error('The demo workspace is read-only')
  error.code = 'permission-denied'
  throw error
}
