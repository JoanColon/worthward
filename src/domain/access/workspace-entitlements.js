import { workspaceEntitlementIsPro } from '../../../functions/shared/billing/entitlements.js'

export function resolveWorkspaceHasPro(workspace) {
  return workspaceEntitlementIsPro(workspace?.entitlement)
}
