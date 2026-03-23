const { readJson, writeJson } = require('../lib/db')

const SETTINGS_PATH = 'data/user-settings.json'

function getRows() {
  return readJson(SETTINGS_PATH)
}

function saveRows(rows) {
  writeJson(SETTINGS_PATH, rows)
}

function getDefaultSetting(userId) {
  return {
    id: userId,
    userId,
    incomeAdjustRate: 100,
    note: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

function getUserSetting(userId) {
  const rows = getRows()
  return rows.find(item => item.userId === userId) || getDefaultSetting(userId)
}

function getUserIncomeAdjustRate(userId) {
  const setting = getUserSetting(userId)
  const rate = Number(setting.incomeAdjustRate || 100)
  return Number.isFinite(rate) && rate > 0 ? rate : 100
}

function updateUserSetting(userId, payload = {}) {
  const rows = getRows()
  const index = rows.findIndex(item => item.userId === userId)
  const current = index >= 0 ? rows[index] : getDefaultSetting(userId)
  const next = {
    ...current,
    userId,
    incomeAdjustRate: payload.incomeAdjustRate != null ? Number(payload.incomeAdjustRate) : current.incomeAdjustRate,
    note: payload.note != null ? String(payload.note) : current.note,
    updatedAt: new Date().toISOString()
  }

  if (!Number.isFinite(next.incomeAdjustRate) || next.incomeAdjustRate <= 0) {
    throw new Error('incomeAdjustRate must be a positive number')
  }

  if (index >= 0) {
    rows[index] = next
  } else {
    rows.push(next)
  }

  saveRows(rows)
  return next
}

function deleteUserSetting(userId) {
  const rows = getRows()
  const nextRows = rows.filter(item => item.userId !== userId)
  saveRows(nextRows)
}

module.exports = {
  deleteUserSetting,
  getUserIncomeAdjustRate,
  getUserSetting,
  updateUserSetting
}
