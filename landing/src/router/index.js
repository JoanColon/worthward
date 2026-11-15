import LandingPage from '../pages/LandingPage.vue'
import ContentPage from '../pages/ContentPage.vue'

export const routes = [
  { path: '/', component: LandingPage },
  { path: '/how-to/', component: ContentPage, props: { section: 'how-to' } },
  { path: '/learn/', component: ContentPage, props: { section: 'learn' } },
  { path: '/pricing/', component: ContentPage, props: { section: 'pricing' } },
  { path: '/how-to/getting-started/', component: ContentPage, props: { section: 'getting-started' } },
  { path: '/learn/net-worth/', component: ContentPage, props: { section: 'net-worth' } },
]
