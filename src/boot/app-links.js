import { defineBoot } from '#q-app'

const INVITE_PATH = /^\/invite\/([A-Za-z0-9_-]{43})\/?$/
const TRUSTED_HOSTS = new Set(['cost-of-life-f23b2.web.app', 'cost-of-life-f23b2.firebaseapp.com'])

function inviteTokenFromUrl(rawUrl, allowCurrentHost = false) {
  try {
    const url = new URL(rawUrl)
    const trustedHost = TRUSTED_HOSTS.has(url.hostname)
    const currentHost = allowCurrentHost && url.origin === window.location.origin
    if (url.protocol !== 'https:' || (!trustedHost && !currentHost)) return null
    return url.pathname.match(INVITE_PATH)?.[1] || null
  } catch {
    return null
  }
}

export default defineBoot(async ({ router }) => {
  const routeToInvite = async (rawUrl, allowCurrentHost = false) => {
    const token = inviteTokenFromUrl(rawUrl, allowCurrentHost)
    if (!token) return false
    await router.replace({ name: 'workspace-invite', params: { token } })
    return true
  }

  if (!window.Capacitor?.isNativePlatform?.()) {
    await routeToInvite(window.location.href, true)
    return
  }

  const { App } = await import('@capacitor/app')
  const launch = await App.getLaunchUrl()
  if (launch?.url) await routeToInvite(launch.url)

  await App.addListener('appUrlOpen', ({ url }) => routeToInvite(url))
})
