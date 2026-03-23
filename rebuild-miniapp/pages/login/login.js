const storage = require('../../utils/storage')
const accountService = require('../../services/account')

Page({
  data: {
    mobile: '',
    password: ''
  },
  onMobileChange(e) {
    this.setData({ mobile: e.detail.value })
  },
  onPasswordChange(e) {
    this.setData({ password: e.detail.value })
  },
  submit() {
    accountService.login({
      mobile: this.data.mobile,
      password: this.data.password
    })
      .then(res => {
        storage.setToken(res.token)
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 500)
      })
      .catch(err => {
        wx.showModal({
          title: '登录失败',
          content: (err && err.message) || '请检查手机号、密码和后端服务',
          showCancel: false
        })
      })
  }
})
