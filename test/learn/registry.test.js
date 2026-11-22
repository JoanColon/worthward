import { describe, expect, it } from 'vitest'
import { learnContexts, learnTopics, resolveLearnContext } from '../../src/learn/registry.js'

describe('Worthward Learn registry', () => {
  it('resolves registered contexts from stable route names', () => {
    const context = resolveLearnContext({ name: 'workspace-dashboard' })

    expect(context.id).toBe('workspace-dashboard')
    expect(context.topics.map(({ id }) => id)).toEqual(['netWorth', 'costOfLife', 'savingsRate'])
  })

  it('does not expose Learn on unrelated routes', () => {
    expect(resolveLearnContext({ name: 'login' })).toBeNull()
    expect(resolveLearnContext({ name: 'home' })).toBeNull()
    expect(resolveLearnContext({ name: 'account' })).toBeNull()
  })

  it('only references defined reusable topics', () => {
    for (const context of Object.values(learnContexts)) {
      for (const topicId of context.topicIds) expect(learnTopics[topicId]).toBeDefined()
    }
  })

  it('reuses shared concepts instead of duplicating them', () => {
    expect(learnContexts.assets.topicIds).toContain('liquidity')
    expect(learnContexts['real-estate-model'].topicIds).toContain('liquidity')
    expect(learnContexts.progress.topicIds).toContain('financialIndependence')
    expect(learnContexts['what-if-strategy'].topicIds).toContain('financialIndependence')
  })
})
