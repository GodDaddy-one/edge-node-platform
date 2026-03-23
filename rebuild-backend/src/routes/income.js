const express = require('express')
const { requireAuth } = require('../middleware/auth')
const incomeService = require('../services/income-service')
const userSettingsService = require('../services/user-settings-service')
const cacheService = require('../services/cache-service')
const sourceService = require('../services/source-service')
const deviceService = require('../services/device-service')

const router = express.Router()

router.use(requireAuth)

function parseSummaryAmount(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }

  return amount / 100
}

router.get('/detail', async (req, res, next) => {
  try {
    const userSetting = userSettingsService.getUserSetting(req.user.id)
    let rows = incomeService.listAdjustedIncomeHistory(req.user.id, Number(req.query.limit || 30))

    if (!rows.length) {
      let rawAmount = 0
      const token = sourceService.getDecodedSourceToken(req.user.id) || sourceService.getAnyDecodedSourceToken()

      if (token) {
        try {
          const summary = await deviceService.fetchIncomeSummary(token)
          rawAmount = parseSummaryAmount(summary.yesterday)
        } catch (err) {
          rawAmount = 0
        }
      }

      if (!rawAmount) {
        const allDevices = cacheService.getAllLatestDevices()
        rawAmount = allDevices.reduce((sum, item) => sum + Number(item.rawYesterdayIncome || item.yesterdayIncome || 0), 0)
      }

      if (rawAmount > 0) {
        rows = [
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            rawAmount: rawAmount.toFixed(2),
            amount: incomeService.formatAmount(rawAmount, incomeService.getUserAdjustRate(req.user.id)),
            remark: '节点收益结算'
          }
        ]
      }
    }

    res.json({
      adjustRate: incomeService.getUserAdjustRate(req.user.id),
      note: userSetting.note || '',
      rows
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
