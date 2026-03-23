const jwt = require('jsonwebtoken')

const COOKIE_NAME = 'admin_session'

function getAdminSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret'
}

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || 'admin'
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'admin123'
}

function parseCookies(req) {
  const raw = req.headers.cookie || ''
  return raw.split(';').reduce((acc, pair) => {
    const index = pair.indexOf('=')
    if (index === -1) {
      return acc
    }
    const key = pair.slice(0, index).trim()
    const value = pair.slice(index + 1).trim()
    if (key) {
      acc[key] = decodeURIComponent(value)
    }
    return acc
  }, {})
}

function signAdminSession(username) {
  return jwt.sign(
    {
      username,
      role: 'admin'
    },
    getAdminSecret(),
    { expiresIn: '12h' }
  )
}

function verifyAdminCredentials(username, password) {
  return username === getAdminUsername() && password === getAdminPassword()
}

function setAdminCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`)
}

function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

function requireAdmin(req, res, next) {
  const cookies = parseCookies(req)
  const token = cookies[COOKIE_NAME]

  if (!token) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'admin login required' })
    }
      return res.redirect('/paiyun/login')
  }

  try {
    const payload = jwt.verify(token, getAdminSecret())
    req.admin = payload
    next()
  } catch (err) {
    clearAdminCookie(res)
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'admin session expired' })
    }
    return res.redirect('/paiyun/login')
  }
}

module.exports = {
  COOKIE_NAME,
  clearAdminCookie,
  requireAdmin,
  setAdminCookie,
  signAdminSession,
  verifyAdminCredentials
}
