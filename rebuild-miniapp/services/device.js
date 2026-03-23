const request = require('../utils/request')

function getDeviceList(params) {
  return request.get('/device/list', params, { useOwnBackend: true })
}

function getCachedDeviceList() {
  return request.get('/device/cache', {}, { useOwnBackend: true })
}

function syncDevices(num = 100) {
  return request.post('/device/sync', { num }, { useOwnBackend: true })
}

function updateDeviceInfo(data) {
  return request.post('/device/update', data, { useOwnBackend: true })
}

function getDeviceDetail(uuid) {
  return request.get('/device/detail', { uuid }, { useOwnBackend: true })
}

function getDialInfo(deviceUUID) {
  return request.get('/device/dial-info', { uuid: deviceUUID }, { useOwnBackend: true })
}

function saveDial(uuid, diallingInfo) {
  return request.post('/device/dial-save', { uuid, diallingInfo }, { useOwnBackend: true })
}

function startBandwidthTest(uuid, bizId) {
  return request.post('/device/bandwidth/test/start', { uuid, bizId }, { useOwnBackend: true })
}

module.exports = {
  getDeviceList,
  getCachedDeviceList,
  syncDevices,
  updateDeviceInfo,
  getDeviceDetail,
  getDialInfo,
  saveDial,
  startBandwidthTest
}
