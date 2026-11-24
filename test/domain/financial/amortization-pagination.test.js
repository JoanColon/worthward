import { describe, expect, it } from 'vitest'
import { amortizationPageForDate } from '../../../src/domain/financial/amortization-pagination.js'

const rows = Array.from({ length: 37 }, (_, index) => ({
  date: new Date(Date.UTC(2024, index, 1)).toISOString().slice(0, 10),
}))

describe('amortization table pagination', () => {
  it('opens the page containing the current month', () => {
    expect(amortizationPageForDate(rows, '2026-11-24', 12)).toBe(3)
  })

  it('opens the first page before the mortgage starts', () => {
    expect(amortizationPageForDate(rows, '2023-11-24', 12)).toBe(1)
  })

  it('opens the final page after the mortgage ends', () => {
    expect(amortizationPageForDate(rows, '2030-01-01', 12)).toBe(4)
  })

  it('falls back safely for missing rows or invalid dates', () => {
    expect(amortizationPageForDate([], '2026-11-24', 12)).toBe(1)
    expect(amortizationPageForDate(rows, 'not-a-date', 12)).toBe(1)
  })
})
