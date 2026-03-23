const { readJson, writeJson } = require('../lib/db')

const ASSIGNMENT_PATH = 'data/device-assignments.json'

function getRows() {
  return readJson(ASSIGNMENT_PATH)
}

function saveRows(rows) {
  writeJson(ASSIGNMENT_PATH, rows)
}

function listAssignments(userId) {
  return getRows().filter(row => row.userId === userId && row.status !== 'disabled')
}

function listAssignedUuids(userId) {
  return listAssignments(userId).map(row => row.deviceUuid)
}

function hasAssignments(userId) {
  return listAssignments(userId).length > 0
}

function replaceAssignments(userId, deviceUuids) {
  const rows = getRows()
  const previousRows = rows.filter(row => row.userId === userId)
  const nextRows = rows.filter(row => row.userId !== userId)
  const now = new Date().toISOString()

  deviceUuids.forEach(uuid => {
    const existing = previousRows.find(row => row.deviceUuid === uuid)
    nextRows.push({
      id: `${userId}:${uuid}`,
      userId,
      deviceUuid: uuid,
      status: 'active',
      createdAt: existing?.createdAt || now,
      updatedAt: now
    })
  })

  saveRows(nextRows)
  return listAssignments(userId)
}

function clearAssignments(userId) {
  const rows = getRows()
  const nextRows = rows.filter(row => row.userId !== userId)
  saveRows(nextRows)
}

function getFirstAssignedAt(userId) {
  const rows = listAssignments(userId)
  if (!rows.length) {
    return ''
  }

  return rows
    .map(row => row.createdAt)
    .filter(Boolean)
    .sort()[0] || ''
}

module.exports = {
  clearAssignments,
  getFirstAssignedAt,
  hasAssignments,
  listAssignments,
  listAssignedUuids,
  replaceAssignments
}
