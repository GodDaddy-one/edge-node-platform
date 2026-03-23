const settingsService = require('./service')

Page({
  data: {
    loading: true,
    saving: false,
    incomeAdjustRate: '100'
  },
  onShow() {
    this.loadSettings()
  },
  loadSettings() {
    this.setData({ loading: true })
    settingsService.getIncomeAdjustment()
      .then(data => {
        this.setData({
          incomeAdjustRate: String(data.incomeAdjustRate || 100)
        })
      })
      .catch(() => {
        wx.showToast({
          title: '系统设置加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },
  onRateInput(e) {
    this.setData({
      incomeAdjustRate: e.detail.value
    })
  },
  saveRate() {
    const value = Number(this.data.incomeAdjustRate || 100)
    this.setData({ saving: true })
    settingsService.updateIncomeAdjustment(value)
      .then(() => {
        wx.showToast({
          title: '收益比例已更新',
          icon: 'success'
        })
      })
      .catch(err => {
        wx.showToast({
          title: (err && err.message) || '保存失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ saving: false })
      })
  }
})
