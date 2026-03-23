const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return res.status(401).json({ message: 'missing auth token' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'invalid auth token' })
  }
}

module.exports = {
  requireAuth
}
