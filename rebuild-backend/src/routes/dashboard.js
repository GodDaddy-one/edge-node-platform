const express = require('express')
const { requireAuth } = require('../middleware/auth')
const sourceService = require('../services/source-service')
const deviceService = require('../services/device-service')
const cacheService = require('../services/cache-service')
const incomeService = require('../services/income-service')
const visibilityService = require('../services/visibility-service')
const userSettingsService = require('../services/user-settings-service')
const syncService = require('../services/sync-service')

const router = express.Router()

router.use(requireAuth)

function sumIncome(devices) {
  return devices.reduce((sum, item) => sum + Number(item.rawYesterdayIncome || item.yesterdayIncome || 0), 0)
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function isOnline(item) {
  const status = normalizeText(item.onlineStatus || item.status)
  return status === 'online' || status === '在线'
}

function hasLineError(item) {
  const faultType = normalizeText(item.faultType)
  if (faultType.includes('line')) {
    return true
  }

  const totalLines = Number(item.lineCount || 0)
  const onlineLines = Number(item.lineCountOnline || 0)
  return totalLines > 0 && onlineLines < totalLines
}

function getProcessStats(devices) {
  const stats = {
    waitingForConfigNetwork: 0,
    waitingForTest: 0,
    serving: 0,
    waitingAbandoned: 0
  }

  devices.forEach(item => {
    const state = normalizeText(item.minerState || item.state)
    if (state === 'waitingforconfignetwork') {
      stats.waitingForConfigNetwork += 1
      return
    }
    if (state === 'waitingfortest') {
      stats.waitingForTest += 1
      return
    }
    if (state === 'serving') {
      stats.serving += 1
      return
    }
    if (state === 'waitingabandoned') {
      stats.waitingAbandoned += 1
    }
  })

  return stats
}

function parseSummaryAmount(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }

  // The upstream summary endpoint returns amounts in cents.
  return amount / 100
}

router.get('/home', async (req, res, next) => {
  try {
    await syncService.ensureCacheFresh({
      maxAgeMinutes: 10,
      forceIfEmpty: true,
      actor: 'dashboard.home'
    })

    const token = sourceService.getDecodedSourceToken(req.user.id) || sourceService.getAnyDecodedSourceToken()

    let devices = visibilityService.getVisibleDevicesForUser(req.user.id)

    if (!devices.length && token) {
      const deviceData = await deviceService.fetchDeviceList(token, {
        offset: 0,
        num: 100,
        sorting: 'bindTime',
        orderby: 'desc'
      })
      devices = deviceData.devices || []
    }

    const total = devices.length
    const online = devices.filter(isOnline).length
    const offline = total - online
    const lineError = devices.filter(hasLineError).length

    const userSetting = userSettingsService.getUserSetting(req.user.id)
    const userRate = incomeService.getUserAdjustRate(req.user.id)
    const visibleYesterdayIncome = incomeService.applyRate(sumIncome(devices), userRate)
    const visibleTotalIncome = devices.reduce((sum, item) => {
      const raw = Number(item.rawMonthIncome || item.totalIncome || item.accumulatedIncome || 0)
      return sum + raw
    }, 0)

    res.json({
      income: {
        totalIncome: incomeService.formatAmount(visibleTotalIncome, userRate),
        yesterdayIncome: incomeService.formatAmount(visibleYesterdayIncome, userRate),
        rawTotalIncome: Number(visibleTotalIncome || 0).toFixed(2),
        rawYesterdayIncome: Number(visibleYesterdayIncome || 0).toFixed(2)
      },
      deviceStats: {
        total,
        online,
        offline,
        lineError
      },
      qualityStats: {
        excellent: 0,
        medium: 0,
        bad: 0
      },
      processStats: getProcessStats(devices),
      incomeAdjustRate: userRate,
      accountNote: userSetting.note || '',
      banners: [
        {
          title: '\u5206\u4eab\u955c\u50cf\u5305\u8d5a\u6536\u76ca',
          actionText: '\u7acb\u5373\u7533\u8bf7'
        }
      ],
      notices: [
        '\u6bcf\u65e511\u70b9\u540e\u5237\u65b0\u6628\u65e5\u6536\u76ca',
        '\u8282\u70b9\u4e0e\u6536\u76ca\u6570\u636e\u5df2\u652f\u6301\u540c\u6b65\u5c55\u793a'
      ]
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
