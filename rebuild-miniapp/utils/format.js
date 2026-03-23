function formatCurrency(value) {
  const num = Number(value || 0)
  return num.toFixed(2)
}

function formatDate(timestamp) {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

module.exports = {
  formatCurrency,
  formatDate
}
