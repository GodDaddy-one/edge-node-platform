const incomeService = require('../../../services/income')

Page({
  data: {
    loading: true,
    note: '',
    rows: []
  },
  onShow() {
    this.loadIncomeDetail()
  },
  loadIncomeDetail() {
    this.setData({ loading: true })
    incomeService.getIncomeDetail(30)
      .then(data => {
        this.setData({
          note: data.note || '',
          rows: data.rows || []
        })
      })
      .catch(() => {
        wx.showToast({
          title: '收益明细加载失败',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  }
})
