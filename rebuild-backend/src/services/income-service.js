const { readJson, writeJson } = require('../lib/db')
const settingsService = require('./settings-service')
const userSettingsService = require('./user-settings-service')

const HISTORY_PATH = 'data/income-history.json'

function roundToTwo(num) {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100
}

function getAdjustRate() {
  return settingsService.getIncomeAdjustRate()
}

function getUserAdjustRate(userId) {
  return userSettingsService.getUserIncomeAdjustRate(userId)
}

function applyRate(value, rate = getAdjustRate()) {
  const numeric = Number(value || 0)
  const factor = Number(rate || 100) / 100
  return roundToTwo(numeric * factor)
}

function formatAmount(value, rate = getAdjustRate()) {
  return applyRate(value, rate).toFixed(2)
}

function getIncomeHistoryRows() {
  return readJson(HISTORY_PATH)
}

function saveIncomeHistoryRows(rows) {
  writeJson(HISTORY_PATH, rows)
}

function getSettlementDate() {
  const now = new Date()
  now.setDate(now.getDate() - 1)
  return now.toISOString().slice(0, 10)
}

function upsertIncomeSnapshot(userId, rawAmount, meta = {}) {
  const rows = getIncomeHistoryRows()
  const settlementDate = meta.date || getSettlementDate()
  const nextRows = rows.filter(row => !(row.userId === userId && row.date === settlementDate))

  nextRows.push({
    id: `${userId}:${settlementDate}`,
    userId,
    date: settlementDate,
    rawAmount: roundToTwo(rawAmount),
    remark: meta.remark || '节点收益结算',
    updatedAt: new Date().toISOString()
  })

  nextRows.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  saveIncomeHistoryRows(nextRows)
  return nextRows.filter(row => row.userId === userId)
}

function listAdjustedIncomeHistory(userId, limit = 30) {
  const rate = getUserAdjustRate(userId)
  return getIncomeHistoryRows()
    .filter(row => row.userId === userId)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit)
    .map(row => ({
      date: row.date,
      rawAmount: Number(row.rawAmount || 0).toFixed(2),
      amount: formatAmount(row.rawAmount, rate),
      remark: row.remark || '节点收益结算'
    }))
}

function deleteUserIncomeHistory(userId) {
  const rows = getIncomeHistoryRows().filter(row => row.userId !== userId)
  saveIncomeHistoryRows(rows)
}

function decorateDeviceIncome(device, userId) {
  const rawYesterdayIncome = Number(
    device.rawYesterdayIncome != null ? device.rawYesterdayIncome : device.yesterdayIncome || 0
  )
  const rate = userId ? getUserAdjustRate(userId) : getAdjustRate()

  return {
    ...device,
    rawYesterdayIncome: roundToTwo(rawYesterdayIncome),
    yesterdayIncome: formatAmount(rawYesterdayIncome, rate)
  }
}

module.exports = {
  getAdjustRate,
  getUserAdjustRate,
  applyRate,
  formatAmount,
  deleteUserIncomeHistory,
  upsertIncomeSnapshot,
  listAdjustedIncomeHistory,
  decorateDeviceIncome
}
