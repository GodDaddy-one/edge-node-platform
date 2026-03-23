const { readJson, writeJson } = require('../lib/db')

function getDeviceCacheRows() {
  return readJson('data/device-cache.json')
}

function saveDeviceCacheRows(rows) {
  writeJson('data/device-cache.json', rows)
}

function upsertDevices(userId, devices) {
  const rows = getDeviceCacheRows()
  const now = new Date().toISOString()
  const nextRows = rows.filter(row => row.userId !== userId)

  devices.forEach(device => {
    nextRows.push({
      id: `${userId}:${device.uuid}`,
      userId,
      sourceDeviceUuid: device.uuid,
      payload: device,
      syncTime: now
    })
  })

  saveDeviceCacheRows(nextRows)
  return nextRows.filter(row => row.userId === userId)
}

function getDevicesByUserId(userId) {
  return getDeviceCacheRows()
    .filter(row => row.userId === userId)
    .map(row => row.payload)
}

function getAllLatestDevices() {
  const latestMap = new Map()
  getDeviceCacheRows().forEach(row => {
    latestMap.set(row.sourceDeviceUuid, row.payload)
  })
  return Array.from(latestMap.values())
}

function getDevicesByUuids(deviceUuids) {
  const uuidSet = new Set(deviceUuids)
  return getAllLatestDevices().filter(item => uuidSet.has(item.uuid))
}

function getDeviceByUuid(userId, uuid) {
  return getDeviceCacheRows().find(row => row.userId === userId && row.sourceDeviceUuid === uuid)
}

function getLatestSyncTime(userId = null) {
  const rows = getDeviceCacheRows().filter(row => userId == null || row.userId === userId)
  if (!rows.length) {
    return ''
  }
  return rows
    .map(row => row.syncTime)
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || ''
}

module.exports = {
  getAllLatestDevices,
  upsertDevices,
  getDevicesByUuids,
  getDevicesByUserId,
  getDeviceByUuid,
  getLatestSyncTime
}
