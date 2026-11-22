export function getWorkspaceMembers(workspace) {
  const memberIds = [...new Set((workspace?.memberIds || []).filter(Boolean))]
  const entries = memberIds.map((id) => {
    const member = workspace?.members?.[id] || {}
    return {
      id,
      name: member.displayName?.split('@')[0] || 'Member',
      photoURL: member.photoURL || '',
    }
  })
  return entries
}
