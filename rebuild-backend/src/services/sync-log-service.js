const { readJson, writeJson } = require('../lib/db')

function appendLog(entry) {
  const rows = readJson('data/sync-logs.json')
  rows.push({
    id: rows.length + 1,
    createdAt: new Date().toISOString(),
    ...entry
  })
  writeJson('data/sync-logs.json', rows)
}

function listLogs(limit = 20) {
  const rows = readJson('data/sync-logs.json')
  return rows.slice(-limit).reverse()
}

module.exports = {
  appendLog,
  listLogs
}
