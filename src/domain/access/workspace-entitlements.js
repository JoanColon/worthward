import { workspaceEntitlementIsPro } from '../../../functions/shared/billing/entitlements.js'
import { isDemoWorkspaceId } from './demo-workspace.js'

export function resolveWorkspaceHasPro(workspace, { now = Date.now() } = {}) {
  return (
    isDemoWorkspaceId(workspace?.id) || workspaceEntitlementIsPro(workspace?.entitlement, { now })
  )
}
