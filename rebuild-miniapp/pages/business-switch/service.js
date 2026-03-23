const request = require('../../utils/request')

function checkCanSwitch(deviceUUID) {
  return request.post('/device/v1/checkCanSubmitSwitchOrder', { deviceUUID })
}

function submitSwitchOrder(data) {
  return request.post('/device/v1/submitSwitchOrder', data)
}

function getSwitchHistory() {
  return request.get('/device/v1/searchOrderHistory')
}

module.exports = {
  checkCanSwitch,
  submitSwitchOrder,
  getSwitchHistory
}
