const express = require('express')
const { requireAuth } = require('../middleware/auth')
const userService = require('../services/user-service')
const sourceService = require('../services/source-service')
const syncService = require('../services/sync-service')

const router = express.Router()

router.post('/login', async (req, res) => {
  const { mobile, password } = req.body || {}
  const user = userService.findByMobile(mobile)

  if (!user || !userService.verifyPassword(user, password)) {
    return res.status(401).json({ message: 'mobile or password is incorrect' })
  }

  const token = userService.signUser(user)
  const sourceRecord = sourceService.getSourceRecord(user.id) || sourceService.listSourceRecords().find(item => item.status === 'active')

  if (sourceRecord) {
    try {
      await syncService.ensureCacheFresh({
        maxAgeMinutes: 10,
        forceIfEmpty: true,
        actor: 'auth.login'
      })
    } catch (err) {
      // Keep login available even when upstream sync fails.
    }
  }

  res.json({
    token,
    user: {
      id: user.id,
      mobile: user.mobile,
      nickname: user.nickname,
      sourceBound: !!sourceRecord
    }
  })
})

router.get('/me', requireAuth, (req, res) => {
  const sourceRecord = sourceService.getSourceRecord(req.user.id) || sourceService.listSourceRecords().find(item => item.status === 'active')
  res.json({
    id: req.user.id,
    mobile: req.user.mobile,
    nickname: req.user.nickname,
    sourceBound: !!sourceRecord
  })
})

module.exports = router
