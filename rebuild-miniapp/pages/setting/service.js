const request = require('../../utils/request')

function getIncomeAdjustment() {
  return request.get('/settings/income-adjustment', {}, { useOwnBackend: true })
}

function updateIncomeAdjustment(incomeAdjustRate) {
  return request.post('/settings/income-adjustment', { incomeAdjustRate }, { useOwnBackend: true })
}

module.exports = {
  getIncomeAdjustment,
  updateIncomeAdjustment
}
