const express = require('express')
const { requireAuth } = require('../middleware/auth')
const sourceService = require('../services/source-service')
const deviceService = require('../services/device-service')
const cacheService = require('../services/cache-service')
const syncLogService = require('../services/sync-log-service')
const incomeService = require('../services/income-service')
const visibilityService = require('../services/visibility-service')
const syncService = require('../services/sync-service')

const router = express.Router()

router.use(requireAuth)

function ensureSourceToken(userId, res) {
  const token = sourceService.getDecodedSourceToken(userId) || sourceService.getAnyDecodedSourceToken()
  if (!token) {
    res.status(400).json({ message: 'source token not bound' })
    return null
  }
  return token
}

router.get('/list', async (req, res, next) => {
  try {
    const token = ensureSourceToken(req.user.id, res)
    if (!token) return

    const data = await deviceService.fetchDeviceList(token, req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/detail', async (req, res, next) => {
  try {
    const token = ensureSourceToken(req.user.id, res)
    if (!token) return
    if (!visibilityService.canAccessDevice(req.user.id, req.query.uuid)) {
      return res.status(403).json({ message: 'device access denied' })
    }

    const data = await deviceService.fetchDeviceDetail(token, req.query.uuid)
    const devices = Array.isArray(data.devices) ? data.devices.map(item => {
      const rawMonthIncome = Number(item.rawMonthIncome || item.monthIncome || item.totalIncome || 0)
      return {
        ...incomeService.decorateDeviceIncome(item, req.user.id),
        rawMonthIncome,
        monthIncome: incomeService.formatAmount(rawMonthIncome, incomeService.getUserAdjustRate(req.user.id)),
        totalIncome: incomeService.formatAmount(rawMonthIncome, incomeService.getUserAdjustRate(req.user.id))
      }
    }) : []

    res.json({
      ...data,
      devices
    })
  } catch (err) {
    next(err)
  }
})

router.get('/dial-info', async (req, res, next) => {
  try {
    const token = ensureSourceToken(req.user.id, res)
    if (!token) return

    const data = await deviceService.fetchDialInfo(token, req.query.uuid)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/sync', async (req, res, next) => {
  try {
    const token = ensureSourceToken(req.user.id, res)
    if (!token) return

    const query = {
      offset: 0,
      num: Number(req.body?.num || 100),
      sorting: 'bindTime',
      orderby: 'desc'
    }

    const data = await deviceService.fetchDeviceList(token, query)
    const devices = data.devices || []
    const deviceIds = devices.map(device => device.uuid).filter(Boolean).join(',')
    let incomeRows = []

    if (deviceIds) {
      try {
        const incomeData = await deviceService.fetchIncome(token, deviceIds)
        const rawRows = incomeData.data || incomeData.list || incomeData.rows || incomeData
        incomeRows = Array.isArray(rawRows) ? rawRows : []
      } catch (err) {
        incomeRows = []
      }
    }

    const mergedDevices = devices.map(device => {
      const incomeItem = incomeRows.find(item =>
        item.uuid === device.uuid ||
        item.deviceUuid === device.uuid ||
        item.device_id === device.uuid
      )
      const minerIncome = incomeItem ? incomeItem.minerIncome : null
      return {
        ...device,
        rawYesterdayIncome: typeof minerIncome === 'number' ? Number((minerIncome / 100).toFixed(2)) : 0,
        yesterdayIncome: typeof minerIncome === 'number' ? (minerIncome / 100).toFixed(2) : '0.00',
        minerRemark: incomeItem ? incomeItem.minerRemark : ''
      }
    })

    const cached = cacheService.upsertDevices(req.user.id, mergedDevices)
    const rawTotalIncome = mergedDevices.reduce((sum, device) => sum + Number(device.rawYesterdayIncome || 0), 0)
    incomeService.upsertIncomeSnapshot(req.user.id, rawTotalIncome)

    syncLogService.appendLog({
      userId: req.user.id,
      action: 'device.sync',
      target: 'upstream.device.list',
      status: 'success',
      requestSnapshot: query,
      responseSnapshot: {
        total: data.total || devices.length,
        cached: cached.length,
        incomeMerged: incomeRows.length
      }
    })

    res.json({
      synced: mergedDevices.length,
      cached: cached.length
    })
  } catch (err) {
    syncLogService.appendLog({
      userId: req.user.id,
      action: 'device.sync',
      target: 'upstream.device.list',
      status: 'failed',
      requestSnapshot: req.body || {},
      responseSnapshot: { message: err.message }
    })
    next(err)
  }
})

router.get('/cache', async (req, res) => {
  await syncService.ensureCacheFresh({
    maxAgeMinutes: 10,
    forceIfEmpty: true,
    actor: 'device.cache'
  })
  const devices = visibilityService.getVisibleDevicesForUser(req.user.id).map(item =>
    incomeService.decorateDeviceIncome(item, req.user.id)
  )
  res.json({
    total: devices.length,
    devices
  })
})

router.post('/dispatch', async (req, res, next) => {
  try {
    const token = ensureSourceToken(req.user.id, res)
    if (!token) return

    const data = await deviceService.updateDispatch(token, req.body || {})
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/dial-save', async (req, res, next) => {
  try {
    const token = ensureSourceToken(req.user.id, res)
    if (!token) return

    const data = await deviceService.saveDial(token, req.body || {})
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.post('/update', async (req, res, next) => {
  try {
    const token = ensureSourceToken(req.user.id, res)
    if (!token) return

    const data = await deviceService.updateDeviceInfo(token, req.body || {})
    res.json(data)
  } catch (err) {
    next(err)
  }
})

router.get('/sync-logs', async (req, res) => {
  res.json({
    logs: syncLogService.listLogs(50)
  })
})

module.exports = router
