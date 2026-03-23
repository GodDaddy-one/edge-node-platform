const request = require('../utils/request')

function bindSourceToken(token) {
  return request.post('/source/bind-token', { token }, { useOwnBackend: true })
}

function getSourceProfile() {
  return request.get('/source/profile', {}, { useOwnBackend: true })
}

function checkSourceStatus() {
  return request.get('/source/check', {}, { useOwnBackend: true })
}

module.exports = {
  bindSourceToken,
  getSourceProfile,
  checkSourceStatus
}
