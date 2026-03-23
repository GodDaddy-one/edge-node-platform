const storage = require('./utils/storage')

App({
  globalData: {
    appName: '节点运营台',
    userInfo: null
  },
  onLaunch() {
    const token = storage.getToken()
    if (token) {
      this.globalData.token = token
    }
  }
})
