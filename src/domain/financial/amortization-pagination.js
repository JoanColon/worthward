export function amortizationPageForDate(rows, currentDate, rowsPerPage = 12) {
  if (!Array.isArray(rows) || rows.length === 0) return 1
  const pageSize = Number(rowsPerPage)
  if (!Number.isInteger(pageSize) || pageSize <= 0) return 1

  const targetMonth = isoMonth(currentDate)
  if (!targetMonth) return 1

  const matchingIndex = rows.findIndex((row) => {
    const rowMonth = isoMonth(row?.date)
    return rowMonth && rowMonth >= targetMonth
  })
  const targetIndex = matchingIndex === -1 ? rows.length - 1 : matchingIndex
  return Math.floor(targetIndex / pageSize) + 1
}

function isoMonth(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-/)
  return match ? `${match[1]}-${match[2]}` : null
}
