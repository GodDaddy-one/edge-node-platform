const config = require('./config')
const storage = require('./storage')

let redirectingToLogin = false

function handleUnauthorized() {
  storage.clearToken()
  if (redirectingToLogin) return
  redirectingToLogin = true
  const reset = () => {
    setTimeout(() => {
      redirectingToLogin = false
    }, 300)
  }

  try {
    wx.reLaunch({
      url: '/pages/login/login',
      complete: reset
    })
  } catch (err) {
    reset()
  }
}

function request({
  url,
  method = 'GET',
  data = {},
  header = {},
  useNode = false,
  useOwnBackend = false
}) {
  const baseUrl = useOwnBackend ? config.ownBackend : (useNode ? config.apiNode : config.apiBff)
  const token = storage.getToken()

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      header: Object.assign({}, header, token ? { Authorization: `Bearer ${token}` } : {}),
      success(res) {
        if (res.statusCode === 401) {
          handleUnauthorized()
          reject(res.data || { message: 'unauthorized' })
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }
        reject(res.data || { message: 'request failed' })
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

module.exports = {
  get(url, data, options = {}) {
    return request(Object.assign({ url, data, method: 'GET' }, options))
  },
  post(url, data, options = {}) {
    return request(Object.assign({ url, data, method: 'POST' }, options))
  }
}
