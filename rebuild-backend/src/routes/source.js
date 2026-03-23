const express = require('express')
const { requireAuth } = require('../middleware/auth')
const sourceService = require('../services/source-service')
const syncService = require('../services/sync-service')

const router = express.Router()

router.post('/bind-token', requireAuth, async (req, res, next) => {
  try {
    const { token } = req.body || {}
    if (!token) {
      return res.status(400).json({ message: 'token is required' })
    }

    const profile = await sourceService.verifySourceToken(token)
    const saved = sourceService.saveSourceRecord(req.user.id, token, profile)
    await syncService.ensureCacheFresh({
      maxAgeMinutes: 0,
      forceIfEmpty: true,
      actor: 'source.bind-token'
    })

    res.json({
      sourceUid: saved.sourceUid,
      sourceUsername: saved.sourceUsername,
      role: saved.role
    })
  } catch (err) {
    next({
      status: 400,
      message: 'source token verify failed'
    })
  }
})

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const token = sourceService.getDecodedSourceToken(req.user.id)
    if (!token) {
      return res.status(404).json({ message: 'source token not bound' })
    }

    const profile = await sourceService.verifySourceToken(token)
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

router.get('/check', requireAuth, async (req, res, next) => {
  try {
    const result = await sourceService.checkSourceStatus(req.user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

module.exports = router
