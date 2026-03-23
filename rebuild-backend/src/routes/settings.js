const express = require('express')
const { requireAuth } = require('../middleware/auth')
const settingsService = require('../services/settings-service')

const router = express.Router()

router.use(requireAuth)

router.get('/income-adjustment', (req, res) => {
  res.json({
    incomeAdjustRate: settingsService.getIncomeAdjustRate()
  })
})

router.post('/income-adjustment', (req, res, next) => {
  try {
    const { incomeAdjustRate } = req.body || {}
    const settings = settingsService.updateIncomeAdjustRate(incomeAdjustRate)
    res.json(settings)
  } catch (err) {
    next({
      status: 400,
      message: err.message
    })
  }
})

module.exports = router
