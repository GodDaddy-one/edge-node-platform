const TOKEN_KEY = 'rebuild_token'

function getToken() {
  return wx.getStorageSync(TOKEN_KEY)
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

function clearToken() {
  wx.removeStorageSync(TOKEN_KEY)
}

module.exports = {
  getToken,
  setToken,
  clearToken
}
