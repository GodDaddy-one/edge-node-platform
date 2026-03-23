const storage = require('../../../utils/storage')

Page({
  confirmLogout() {
    storage.clearToken()
    wx.showToast({ title: '已退出', icon: 'success' })
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/login/login' })
    }, 500)
  }
})
