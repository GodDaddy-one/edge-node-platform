const request = require('../utils/request')

function login(payload) {
  return request.post('/auth/login', payload, { useOwnBackend: true })
}

function getMe() {
  return request.get('/auth/me', {}, { useOwnBackend: true })
}

function getBankName(cardNo) {
  return request.get(`/v1/user/bankname?cardNo=${cardNo}`)
}

function saveQualificationQs(qualificationRes) {
  return request.post('/account/v1/saveQualificationQs', { qualificationRes })
}

module.exports = {
  login,
  getMe,
  getBankName,
  saveQualificationQs
}
