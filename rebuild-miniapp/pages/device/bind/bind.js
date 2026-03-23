Page({
  data: {
    deviceUUID: '',
    provinceDispatch: '全国调度'
  },
  onInput(e) {
    this.setData({ deviceUUID: e.detail.value })
  },
  submit() {
    wx.showToast({ title: '已模拟提交绑定', icon: 'success' })
  }
})
