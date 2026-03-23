const businessService = require('./service')

Page({
  data: {
    rows: []
  },
  onShow() {
    businessService.getSwitchHistory()
      .then(res => {
        this.setData({ rows: res.orders || res || [] })
      })
      .catch(() => {
        this.setData({
          rows: [
            { number: 1001, targetTask: '视频转码', state: 0, remark: '待审核' },
            { number: 1000, targetTask: '缓存加速', state: 1, remark: '已通过' }
          ]
        })
      })
  }
})
