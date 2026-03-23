const request = require('../utils/request')

function getHomeDashboard() {
  return request.get('/dashboard/home', {}, { useOwnBackend: true })
}

module.exports = {
  getHomeDashboard
}
