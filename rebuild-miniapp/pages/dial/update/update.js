Page({
  data: {
    account: '',
    password: '',
    vlanId: '0'
  },
  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value })
  },
  submit() {
    wx.showToast({ title: '已保存拨号信息', icon: 'success' })
  }
})
