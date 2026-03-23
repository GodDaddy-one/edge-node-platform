const request = require('../utils/request')

function getIncomeDetail(limit = 30) {
  return request.get('/income/detail', { limit }, { useOwnBackend: true })
}

module.exports = {
  getIncomeDetail
}
