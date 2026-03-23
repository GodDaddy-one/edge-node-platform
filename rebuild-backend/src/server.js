require('dotenv').config()

const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const sourceRoutes = require('./routes/source')
const deviceRoutes = require('./routes/device')
const dashboardRoutes = require('./routes/dashboard')
const incomeRoutes = require('./routes/income')
const settingsRoutes = require('./routes/settings')
const adminRoutes = require('./routes/admin')
const syncService = require('./services/sync-service')

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/auth', authRoutes)
app.use('/source', sourceRoutes)
app.use('/device', deviceRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/income', incomeRoutes)
app.use('/settings', settingsRoutes)
app.use('/paiyun', adminRoutes)

app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status).json({
    message: err.message || 'server error'
  })
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  console.log(`rebuild-backend listening on ${port}`)
})

async function runScheduledSync(reason) {
  try {
    await syncService.ensureCacheFresh({
      maxAgeMinutes: 10,
      forceIfEmpty: true,
      actor: reason
    })
  } catch (err) {
    console.error(`[scheduled-sync] ${reason} failed: ${err.message}`)
  }
}

setTimeout(() => {
  runScheduledSync('server.startup')
}, 5000)

setInterval(() => {
  runScheduledSync('server.interval.10m')
}, 10 * 60 * 1000)
