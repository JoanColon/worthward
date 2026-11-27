import { workspaceEntitlementIsPro } from '../../../functions/shared/billing/entitlements.js'
import { isDemoWorkspaceId } from './demo-workspace.js'

export function resolveWorkspaceHasPro(workspace) {
  return isDemoWorkspaceId(workspace?.id) || workspaceEntitlementIsPro(workspace?.entitlement)
}

export function resolveWorkspaceCapabilities(workspace) {
  const isDemo = isDemoWorkspaceId(workspace?.id)
  return {
    isDemo,
    readOnly: isDemo,
    canWrite: Boolean(workspace) && !isDemo,
    canUseAdvancedFeatures: isDemo || workspaceEntitlementIsPro(workspace?.entitlement),
  }
}
