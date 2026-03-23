const cacheService = require('./cache-service')
const sourceService = require('./source-service')
const deviceService = require('./device-service')
const incomeService = require('./income-service')
const syncLogService = require('./sync-log-service')

function minutesSince(value) {
  if (!value) return Number.POSITIVE_INFINITY
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY
  return (Date.now() - time) / 60000
}

async function syncUpstreamDevicesToCache(actor = 'system') {
  const token = sourceService.getAnyDecodedSourceToken()
  if (!token) {
    throw new Error('no active upstream authorization')
  }

  const data = await deviceService.fetchDeviceList(token, {
    offset: 0,
    num: 500,
    sorting: 'bindTime',
    orderby: 'desc'
  })
  const devices = Array.isArray(data.devices) ? data.devices : []
  const ids = devices.map(item => item.uuid).filter(Boolean).join(',')

  let incomeRows = []
  let summary = {}

  if (ids) {
    try {
      const incomeData = await deviceService.fetchIncome(token, ids)
      const rows = incomeData.data || incomeData.list || incomeData.rows || incomeData
      incomeRows = Array.isArray(rows) ? rows : []
    } catch (err) {
      incomeRows = []
    }
  }

  try {
    summary = await deviceService.fetchIncomeSummary(token)
  } catch (err) {
    summary = {}
  }

  const merged = devices.map(device => {
    const item = incomeRows.find(row =>
      row.uuid === device.uuid ||
      row.deviceUuid === device.uuid ||
      row.device_id === device.uuid
    ) || {}
    const minerIncome = Number(item.minerIncome || 0)
    return {
      ...device,
      rawYesterdayIncome: Number((minerIncome / 100).toFixed(2)),
      yesterdayIncome: (minerIncome / 100).toFixed(2),
      rawSummaryTotalIncome: Number(summary.total || 0) / 100,
      rawSummaryYesterdayIncome: Number(summary.yesterday || 0) / 100
    }
  })

  const cached = cacheService.upsertDevices(0, merged)
  incomeService.upsertIncomeSnapshot(0, Number(summary.yesterday || 0) / 100, {
    remark: 'upstream.device.sync'
  })

  syncLogService.appendLog({
    userId: 0,
    action: 'device.sync',
    target: actor,
    status: 'success',
    requestSnapshot: { total: devices.length },
    responseSnapshot: {
      cached: cached.length,
      incomeMerged: incomeRows.length
    }
  })

  return {
    synced: merged.length,
    cached: cached.length,
    incomeMerged: incomeRows.length
  }
}

async function ensureCacheFresh(options = {}) {
  const {
    maxAgeMinutes = 10,
    forceIfEmpty = true,
    actor = 'auto.ensure'
  } = options

  const token = sourceService.getAnyDecodedSourceToken()
  if (!token) {
    return {
      ok: false,
      reason: 'no active upstream authorization',
      synced: false
    }
  }

  const latestSync = cacheService.getLatestSyncTime(0)
  const hasCache = cacheService.getAllLatestDevices().length > 0
  const shouldSync = (forceIfEmpty && !hasCache) || minutesSince(latestSync) >= maxAgeMinutes

  if (!shouldSync) {
    return {
      ok: true,
      reason: 'cache fresh',
      synced: false,
      latestSync
    }
  }

  const result = await syncUpstreamDevicesToCache(actor)
  return {
    ok: true,
    reason: 'cache refreshed',
    synced: true,
    latestSync: cacheService.getLatestSyncTime(0),
    ...result
  }
}

module.exports = {
  ensureCacheFresh,
  syncUpstreamDevicesToCache
}
