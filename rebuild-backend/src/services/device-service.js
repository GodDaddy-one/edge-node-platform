const http = require('../lib/http')

function buildAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  }
}

async function fetchDeviceList(token, query) {
  const response = await http.get(`${process.env.UPSTREAM_NODE_BASE}/v1/device/list`, {
    params: query,
    headers: buildAuthHeaders(token)
  })
  return response.data
}

async function fetchDeviceDetail(token, uuid) {
  const response = await http.get(`${process.env.UPSTREAM_NODE_BASE}/v1/device/list`, {
    params: {
      uuid,
      offset: 0,
      num: 1
    },
    headers: buildAuthHeaders(token)
  })
  return response.data
}

async function fetchDialInfo(token, uuid) {
  const response = await http.get(`${process.env.UPSTREAM_NODE_BASE}/v1/miner/dialling/info`, {
    params: {
      deviceUUID: uuid,
      status: ''
    },
    headers: buildAuthHeaders(token)
  })
  return response.data
}

async function fetchIncome(token, deviceIds) {
  const response = await http.get(`${process.env.UPSTREAM_BFF_BASE}/billing/v1/income/device`, {
    params: {
      device_ids: deviceIds,
      offset: 0,
      num: deviceIds.split(',').length,
      key_style: 'camel_case'
    },
    headers: buildAuthHeaders(token)
  })
  return response.data
}

async function fetchIncomeSummary(token) {
  const response = await http.get(`${process.env.UPSTREAM_NODE_BASE}/v1/billing/income/summary`, {
    headers: buildAuthHeaders(token)
  })
  return response.data
}

async function updateDispatch(token, payload) {
  const response = await http.post(`${process.env.UPSTREAM_NODE_BASE}/v1/miner/device/update_dispatch_type`, payload, {
    headers: buildAuthHeaders(token)
  })
  return response.data
}

async function saveDial(token, payload) {
  const response = await http.post(`${process.env.UPSTREAM_NODE_BASE}/device/dial/save`, payload, {
    headers: buildAuthHeaders(token)
  })
  return response.data
}

async function updateDeviceInfo(token, payload) {
  const response = await http.post(`${process.env.UPSTREAM_NODE_BASE}/v1/device/update`, payload, {
    headers: buildAuthHeaders(token)
  })
  return response.data
}

module.exports = {
  fetchDeviceList,
  fetchDeviceDetail,
  fetchDialInfo,
  fetchIncome,
  fetchIncomeSummary,
  updateDispatch,
  saveDial,
  updateDeviceInfo
}
