import { describe, expect, it } from 'vitest'
import {
  addCalendarMonthsClamped,
  isCanonicalDate,
  requireCanonicalDate,
} from '../../../functions/shared/core/dates.js'

describe('canonical financial dates', () => {
  it('accepts real canonical dates including leap days', () => {
    expect(isCanonicalDate('2024-02-29')).toBe(true)
    expect(isCanonicalDate('2026-11-28')).toBe(true)
    expect(requireCanonicalDate('2024-02-29')).toBe('2024-02-29')
  })

  it('rejects impossible, non-canonical, and empty dates', () => {
    for (const value of ['2023-02-29', '2026-04-31', '2026-1-01', '', null]) {
      expect(isCanonicalDate(value)).toBe(false)
      expect(() => requireCanonicalDate(value)).toThrow('A valid date is required')
    }
  })

  it('clamps calendar month arithmetic without a time-zone shift', () => {
    expect(addCalendarMonthsClamped('2024-01-31', 1)).toBe('2024-02-29')
    expect(addCalendarMonthsClamped('2023-01-31', 1)).toBe('2023-02-28')
  })
})
