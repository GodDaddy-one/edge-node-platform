const { readJson, writeJson } = require('../lib/db')

const SETTINGS_PATH = 'data/system-settings.json'

function getSettings() {
  return readJson(SETTINGS_PATH)
}

function getIncomeAdjustRate() {
  const settings = getSettings()
  const rate = Number(settings.incomeAdjustRate || 100)
  if (!Number.isFinite(rate) || rate <= 0) {
    return 100
  }
  return rate
}

function updateIncomeAdjustRate(rate) {
  const numericRate = Number(rate)
  if (!Number.isFinite(numericRate) || numericRate <= 0) {
    throw new Error('incomeAdjustRate must be a positive number')
  }

  const settings = getSettings()
  const nextSettings = {
    ...settings,
    incomeAdjustRate: Number(numericRate.toFixed(2))
  }
  writeJson(SETTINGS_PATH, nextSettings)
  return nextSettings
}

module.exports = {
  getSettings,
  getIncomeAdjustRate,
  updateIncomeAdjustRate
}
