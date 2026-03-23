const { readJson, writeJson } = require('../lib/db')
const { encodeToken, decodeToken } = require('../lib/crypto')
const http = require('../lib/http')

async function verifySourceToken(token) {
  const response = await http.get(`${process.env.UPSTREAM_NODE_BASE}/account/v1/info`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return response.data
}

function pickToken(payload) {
  if (!payload || typeof payload !== 'object') return ''
  return String(
    payload.token ||
    payload.accessToken ||
    payload.jwt ||
    payload.authorization ||
    payload.data?.token ||
    payload.data?.accessToken ||
    payload.data?.jwt ||
    payload.result?.token ||
    payload.result?.accessToken ||
    ''
  ).trim()
}

async function loginWithPassword({
  username,
  password,
  magic,
  configId = '',
  agreeAgreement = true,
  agreementVersion = '20211217'
}) {
  const finalMagic = String(magic || process.env.UPSTREAM_LOGIN_MAGIC || '').trim()
  if (!finalMagic) {
    throw new Error('magic is required')
  }

  const response = await http.post(`${process.env.UPSTREAM_NODE_BASE}/v1/user/login`, {
    username,
    password,
    magic: finalMagic,
    agreeAgreement,
    agreementVersion,
    configId
  }, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json;charset=UTF-8',
      Origin: process.env.UPSTREAM_ORIGIN || 'https://lepaiyun.work',
      Referer: `${process.env.UPSTREAM_ORIGIN || 'https://lepaiyun.work'}/node/login`
    }
  })

  const token = pickToken(response.data)
  if (!token) {
    const message =
      response.data?.message ||
      response.data?.msg ||
      response.data?.error ||
      'upstream login did not return a token'
    throw new Error(message)
  }

  const profile = await verifySourceToken(token)
  return { token, profile, raw: response.data }
}

function getSourceRecord(userId) {
  const rows = readJson('data/source-authorizations.json')
  return rows.find(item => item.userId === userId && item.status === 'active')
}

function getActiveSourceRecord(userId) {
  return getSourceRecord(userId) || listSourceRecords().find(item => item.status === 'active') || null
}

function saveSourceRecord(userId, token, profile) {
  const rows = readJson('data/source-authorizations.json')
  const now = new Date().toISOString()
  const encoded = encodeToken(token)
  const existingIndex = rows.findIndex(item => item.userId === userId)
  const nextRow = {
    id: existingIndex >= 0 ? rows[existingIndex].id : rows.length + 1,
    userId,
    sourceName: 'lepaiyun',
    sourceTokenEncrypted: encoded,
    sourceUid: profile.uid || profile.data?.uid || null,
    sourceUsername: profile.username || profile.data?.username || null,
    role: profile.role || profile.data?.role || null,
    lastVerifyAt: now,
    status: 'active',
    createdAt: existingIndex >= 0 ? rows[existingIndex].createdAt : now,
    updatedAt: now
  }

  if (existingIndex >= 0) {
    rows[existingIndex] = nextRow
  } else {
    rows.push(nextRow)
  }

  writeJson('data/source-authorizations.json', rows)
  return nextRow
}

function getDecodedSourceToken(userId) {
  const row = getActiveSourceRecord(userId)
  if (!row) return null
  return decodeToken(row.sourceTokenEncrypted)
}

function getAnyDecodedSourceToken() {
  const rows = readJson('data/source-authorizations.json')
  const row = rows.find(item => item.status === 'active')
  if (!row) return null
  return decodeToken(row.sourceTokenEncrypted)
}

function listSourceRecords() {
  return readJson('data/source-authorizations.json')
}

function clearSourceRecord(userId) {
  const rows = listSourceRecords().filter(item => item.userId !== userId)
  writeJson('data/source-authorizations.json', rows)
}

async function checkSourceStatus(userId) {
  const row = getActiveSourceRecord(userId)
  if (!row) {
    return {
      bound: false,
      valid: false,
      reason: 'source token not bound'
    }
  }

  try {
    const token = decodeToken(row.sourceTokenEncrypted)
    const profile = await verifySourceToken(token)
    const currentUid = profile.uid || profile.data?.uid || null
    const currentUsername = profile.username || profile.data?.username || null
    const currentRole = profile.role || profile.data?.role || null
    const identityChanged =
      String(currentUid) !== String(row.sourceUid) ||
      String(currentUsername) !== String(row.sourceUsername) ||
      String(currentRole) !== String(row.role)

    return {
      bound: true,
      valid: !identityChanged,
      identityChanged,
      sourceUid: currentUid,
      sourceUsername: currentUsername,
      role: currentRole,
      profile
    }
  } catch (err) {
    return {
      bound: true,
      valid: false,
      reason: 'token verify failed'
    }
  }
}

module.exports = {
  clearSourceRecord,
  loginWithPassword,
  getActiveSourceRecord,
  verifySourceToken,
  getSourceRecord,
  saveSourceRecord,
  getDecodedSourceToken,
  getAnyDecodedSourceToken,
  listSourceRecords,
  checkSourceStatus
}
