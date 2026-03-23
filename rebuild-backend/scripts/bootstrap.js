const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const rootDir = path.join(__dirname, '..')
const envExamplePath = path.join(rootDir, '.env.example')
const envPath = path.join(rootDir, '.env')
const dataDir = path.join(rootDir, 'data')

function parseEnv(content) {
  return content.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      return acc
    }
    const index = trimmed.indexOf('=')
    if (index === -1) {
      return acc
    }
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    acc[key] = value
    return acc
  }, {})
}

function stringifyEnv(envObj) {
  return Object.entries(envObj)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n') + '\n'
}

function randomSecret(length = 48) {
  return crypto.randomBytes(length).toString('hex')
}

function envOrFallback(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return ''
}

function ensureEnv() {
  const example = fs.existsSync(envExamplePath) ? parseEnv(fs.readFileSync(envExamplePath, 'utf8')) : {}
  const current = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf8')) : {}

  const next = {
    PORT: envOrFallback(process.env.BOOTSTRAP_PORT, current.PORT, example.PORT, '3000'),
    JWT_SECRET:
      current.JWT_SECRET && !current.JWT_SECRET.includes('replace-with')
        ? current.JWT_SECRET
        : randomSecret(),
    ADMIN_JWT_SECRET:
      current.ADMIN_JWT_SECRET && !current.ADMIN_JWT_SECRET.includes('replace-with')
        ? current.ADMIN_JWT_SECRET
        : randomSecret(),
    ADMIN_USERNAME: envOrFallback(process.env.BOOTSTRAP_ADMIN_USERNAME, current.ADMIN_USERNAME, example.ADMIN_USERNAME, 'admin'),
    ADMIN_PASSWORD:
      current.ADMIN_PASSWORD && !current.ADMIN_PASSWORD.includes('change-this')
        ? current.ADMIN_PASSWORD
        : envOrFallback(process.env.BOOTSTRAP_ADMIN_PASSWORD, example.ADMIN_PASSWORD, 'admin123'),
    UPSTREAM_NODE_BASE: envOrFallback(process.env.BOOTSTRAP_UPSTREAM_NODE_BASE, current.UPSTREAM_NODE_BASE, example.UPSTREAM_NODE_BASE, 'https://lepaiyun.work/api/node'),
    UPSTREAM_BFF_BASE:
      envOrFallback(process.env.BOOTSTRAP_UPSTREAM_BFF_BASE, current.UPSTREAM_BFF_BASE, example.UPSTREAM_BFF_BASE, 'https://lepaiyun.work/api/bff/console/miniapp/api'),
    UPSTREAM_LOGIN_MAGIC: envOrFallback(process.env.BOOTSTRAP_UPSTREAM_LOGIN_MAGIC, current.UPSTREAM_LOGIN_MAGIC, example.UPSTREAM_LOGIN_MAGIC, '')
  }

  fs.writeFileSync(envPath, stringifyEnv(next), 'utf8')
  return next
}

function ensureJson(fileName, fallbackValue) {
  const filePath = path.join(dataDir, fileName)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallbackValue, null, 2), 'utf8')
  }
}

function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  ensureJson('users.json', [
    {
      id: 1,
      mobile: envOrFallback(process.env.BOOTSTRAP_TEST_MOBILE, '13800000000'),
      nickname: envOrFallback(process.env.BOOTSTRAP_TEST_NICKNAME, 'admin'),
      password: envOrFallback(process.env.BOOTSTRAP_TEST_PASSWORD, 'admin123'),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ])
  ensureJson('source-authorizations.json', [])
  ensureJson('device-cache.json', [])
  ensureJson('device-assignments.json', [])
  ensureJson('user-settings.json', [])
  ensureJson('sync-logs.json', [])
  ensureJson('system-settings.json', { incomeAdjustRate: 100 })
  ensureJson('income-history.json', [])
}

function main() {
  const env = ensureEnv()
  ensureDataFiles()

  console.log('bootstrap completed')
  console.log(`backend port: ${env.PORT}`)
  console.log(`admin login: ${env.ADMIN_USERNAME} / ${env.ADMIN_PASSWORD}`)
  console.log(`env file: ${envPath}`)
}

main()
