const sourceService = require('../../../services/source')

Page({
  data: {
    token: '',
    saving: false,
    profile: null
  },
  onInput(e) {
    this.setData({ token: e.detail.value })
  },
  submit() {
    if (!this.data.token) {
      wx.showToast({ title: '请先粘贴 token', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    sourceService.bindSourceToken(this.data.token)
      .then(profile => {
        this.setData({ profile })
        wx.showToast({ title: '授权已验证', icon: 'success' })
      })
      .catch(err => {
        wx.showModal({
          title: '绑定失败',
          content: (err && err.message) || '请检查后端服务和 token 是否有效',
          showCancel: false
        })
      })
      .finally(() => {
        this.setData({ saving: false })
      })
  }
})
