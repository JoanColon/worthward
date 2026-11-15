import { defineBoot } from '#q-app'
import { installSplashWatchdog } from '@/services/splash-screen'

export default defineBoot(() => {
  installSplashWatchdog()
})
