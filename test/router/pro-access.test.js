import { describe, expect, it } from 'vitest'
import routes from '../../src/router/routes.js'

const appRoutes = routes.find((route) => route.path === '/home').children
const routeByName = new Map(appRoutes.map((route) => [route.name, route]))

describe('Pro feature routes', () => {
  it.each(['plan', 'what-if'])('keeps %s available to Free users', (routeName) => {
    expect(routeByName.get(routeName)?.meta?.requiresPro).not.toBe(true)
  })

  it.each([
    'investment-portfolio',
    'real-estate-model',
    'cash-model',
    'mortgage-detail',
    'what-if-strategy',
  ])('marks %s as a visually gated Pro feature', (routeName) => {
    expect(routeByName.get(routeName)?.meta?.requiresPro).toBe(true)
  })
})
