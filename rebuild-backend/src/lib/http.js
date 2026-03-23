const axios = require('axios')

const client = axios.create({
  timeout: 15000
})

module.exports = client
