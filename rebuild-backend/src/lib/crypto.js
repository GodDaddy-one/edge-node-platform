function encodeToken(token) {
  return Buffer.from(token, 'utf8').toString('base64')
}

function decodeToken(encoded) {
  return Buffer.from(encoded, 'base64').toString('utf8')
}

module.exports = {
  encodeToken,
  decodeToken
}
