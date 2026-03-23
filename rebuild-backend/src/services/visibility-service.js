const cacheService = require('./cache-service')
const assignmentService = require('./assignment-service')

function getVisibleDevicesForUser(userId) {
  if (assignmentService.hasAssignments(userId)) {
    const uuids = assignmentService.listAssignedUuids(userId)
    return cacheService.getDevicesByUuids(uuids)
  }

  return cacheService.getDevicesByUserId(userId)
}

function canAccessDevice(userId, uuid) {
  return getVisibleDevicesForUser(userId).some(item => item.uuid === uuid)
}

module.exports = {
  canAccessDevice,
  getVisibleDevicesForUser
}
