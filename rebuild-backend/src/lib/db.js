const fs = require('fs')
const path = require('path')

function readJson(relativePath) {
  const filePath = path.join(__dirname, '..', '..', relativePath)
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}

function writeJson(relativePath, data) {
  const filePath = path.join(__dirname, '..', '..', relativePath)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
}

module.exports = {
  readJson,
  writeJson
}
