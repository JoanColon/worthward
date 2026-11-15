import { ViteSSG } from 'vite-ssg'
import { createHead } from '@unhead/vue'
import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'
import './css/app.scss'
import App from './App.vue'
import { routes } from './router/index.js'

export const createApp = ViteSSG(App, { routes, base: import.meta.env.BASE_URL }, ({ app }) => {
  app.use(createHead())
  app.use(Quasar, { plugins: {} })
})
