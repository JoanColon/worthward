import { describe, expect, it } from 'vitest'
import { displayProgressPercent } from '../../functions/shared/progress/metrics.js'

describe('progress display', () => {
  it('does not round an unreached target up to 100%', () => {
    expect(displayProgressPercent(0.996, false)).toBe(99)
  })

  it('shows 100% only when the target has actually been reached', () => {
    expect(displayProgressPercent(1, false)).toBe(99)
    expect(displayProgressPercent(0.996, true)).toBe(100)
  })
})
