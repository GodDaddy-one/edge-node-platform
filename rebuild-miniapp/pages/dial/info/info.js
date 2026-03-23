const deviceService = require('../../../services/device')

Page({
  data: {
    uuid: '',
    lines: []
  },
  onLoad(query) {
    const uuid = query.uuid || 'NODE-10001'
    this.setData({ uuid })
    deviceService.getDialInfo(uuid)
      .then(res => {
        const lines = Object.keys(res || {}).map(name => ({
          name,
          isManager: !!res[name].isManager,
          ip: res[name].ip,
          speed: res[name].speed,
          lineCount: (res[name].diallingResult || []).length
        }))
        this.setData({ lines })
      })
      .catch(() => {
        this.setData({
          lines: [
            { name: '管理线路', isManager: true, ip: '192.168.1.2', speed: '1000Mbps', lineCount: 1 },
            { name: '业务线路 1', isManager: false, ip: '10.0.0.2', speed: '500Mbps', lineCount: 4 }
          ]
        })
      })
  },
  goUpdate() {
    wx.navigateTo({
      url: `/pages/dial/update/update?uuid=${this.data.uuid}`
    })
  }
})
