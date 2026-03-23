const deviceService = require('../../../services/device')

const TABS = [
  { key: 'quality', label: '昨日质量' },
  { key: 'network', label: '网络信息' },
  { key: 'hardware', label: '硬件信息' },
  { key: 'config', label: '设备配置' }
]

Page({
  data: {
    tabs: TABS,
    activeTab: 'quality',
    detail: null
  },
  onLoad(query) {
    const uuid = query.uuid || 'NODE-10001'
    deviceService.getDeviceDetail(uuid)
      .then(res => {
        const item = (res.devices || [])[0]
        this.setData({
          detail: this.normalizeDetail(item || { uuid })
        })
      })
      .catch(() => {
        this.setData({
          detail: this.normalizeDetail({ uuid, remark: '演示节点' })
        })
      })
  },
  normalizeDetail(item) {
    const diskList = Array.isArray(item.disk)
      ? item.disk.map(disk => ({
          name: disk.name || disk.id || '--',
          size: this.formatDiskSize(disk.size),
          type: disk.type || '--'
        }))
      : []

    return {
      uuid: item.uuid || '--',
      name: item.remark || item.deviceName || item.name || item.uuid || '--',
      monthIncome: item.monthIncome || item.totalIncome || '0.00',
      bindTime: item.bindTime || this.formatDate(item.bindTimestamp),
      networkStatus: this.mapNetworkStatus(item.onlineStatus || item.status),
      currentPhase: this.mapMinerState(item.minerState),
      remark: item.remark || '',
      ip: item.ip || '--',
      isp: item.isp || '--',
      location: item.location || '--',
      networkType: item.diallingType || item.ipProtocol || '--',
      networkConfigText: `配置${item.lineCount || 0}条 | 连通${item.lineCountOnline || 0}条`,
      reportBandwidth: this.formatBandwidth(item.upBandwidthBase || item.bandwidth),
      testBandwidth: item.testUpBandwidth ? `${Number(item.testUpBandwidth).toFixed(2)}Mbps` : '--',
      testDate: item.testTime && Number(item.testTime) > 0 ? this.formatDate(item.testTime) : '--',
      isIDC: item.specialLineType || '--',
      version: item.version || '--',
      deviceType: item.type || '--',
      cpuType: item.cpuType || '--',
      cpuNum: item.cpuNum || '--',
      cpuFrequency: item.cpuFrequency ? `${(Number(item.cpuFrequency) / 1000000000).toFixed(2)}GHz` : '--',
      memoryInfo: this.formatMemory(item.memoryInfo),
      diskList,
      dispatchType: this.mapDispatchType(item.dispatchType),
      dispatchTypeRaw: String(item.dispatchType == null ? '' : item.dispatchType),
      dispatchTime: '不限时间',
      ipv6Dispatch: item.ipv6Dispatch ? '是' : '否',
      allowCrossIsp: item.allowCrossIsp ? '是' : '否',
      allowCrossIspRaw: !!item.allowCrossIsp,
      utilizationRate: this.formatPercent(item.yesterdayUtilizationRate),
      natType: item.realtimeNATTypeType || '--',
      lossRate: '--',
      latency: '--'
    }
  },
  mapNetworkStatus(status) {
    if (status === 'online' || status === '在线') return '在线'
    if (status === 'offline' || status === '离线') return '离线'
    return '网络异常'
  },
  mapMinerState(state) {
    const stateMap = {
      waitingForConfigNetwork: '待配置网络',
      checking: '验收中',
      serving: '服务中',
      reject: '验收未通过',
      waitingForTest: '待测试',
      waitingForOffboarding: '待下机',
      offboarded: '已下机'
    }
    return stateMap[state] || '--'
  },
  mapDispatchType(type) {
    if (String(type) === '1') return '本省调度'
    if (String(type) === '0') return '全国调度'
    return '--'
  },
  formatDate(timestamp) {
    if (!timestamp) return '--'
    const value = Number(timestamp)
    const date = new Date(value > 1000000000000 ? value : value * 1000)
    if (Number.isNaN(date.getTime())) return '--'
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, '0')
    const d = `${date.getDate()}`.padStart(2, '0')
    return `${y}-${m}-${d}`
  },
  formatDiskSize(size) {
    const num = Number(size || 0)
    if (!num) return '--'
    return (num / 1024 / 1024 / 1024 / 1024).toFixed(2)
  },
  formatMemory(size) {
    const num = Number(size || 0)
    if (!num) return '--'
    return `${(num / 1024 / 1024 / 1024).toFixed(0)}GB`
  },
  formatBandwidth(size) {
    const num = Number(size || 0)
    if (!num) return '--'
    const mbps = num > 1024 * 1024 ? num / 1024 / 1024 : num
    if (mbps >= 1024) return `${(mbps / 1024).toFixed(2)}G`
    return `${Math.round(mbps)}M`
  },
  formatPercent(value) {
    return `${Number(value || 0).toFixed(2)}%`
  },
  switchTab(e) {
    this.setData({
      activeTab: e.currentTarget.dataset.key
    })
  },
  copyUuid() {
    wx.setClipboardData({
      data: this.data.detail.uuid
    })
  },
  openDial() {
    wx.navigateTo({
      url: `/pages/dial/info/info?uuid=${this.data.detail.uuid}`
    })
  },
  openReport() {
    wx.navigateTo({
      url: `/pages/device-detail/report/report?uuid=${this.data.detail.uuid}`
    })
  },
  onRemarkInput(e) {
    this.setData({
      'detail.remark': e.detail.value
    })
  },
  saveRemark() {
    deviceService.updateDeviceInfo({
      uuid: this.data.detail.uuid,
      remark: this.data.detail.remark
    })
      .then(() => {
        wx.showToast({ title: '备注已保存', icon: 'success' })
      })
      .catch(err => {
        wx.showModal({
          title: '保存失败',
          content: (err && err.message) || '备注保存失败',
          showCancel: false
        })
      })
  },
  changeDispatchType() {
    const current = this.data.detail.dispatchTypeRaw === '1' ? 1 : 0
    const next = current === 1 ? 0 : 1
    deviceService.updateDeviceInfo({
      uuid: this.data.detail.uuid,
      dispatchType: next
    })
      .then(() => {
        this.setData({
          'detail.dispatchTypeRaw': String(next),
          'detail.dispatchType': this.mapDispatchType(next)
        })
        wx.showToast({ title: '调度已更新', icon: 'success' })
      })
      .catch(err => {
        wx.showModal({
          title: '更新失败',
          content: (err && err.message) || '调度类型更新失败',
          showCancel: false
        })
      })
  },
  toggleCrossIsp() {
    const next = !this.data.detail.allowCrossIspRaw
    deviceService.updateDeviceInfo({
      uuid: this.data.detail.uuid,
      allowCrossIsp: next
    })
      .then(() => {
        this.setData({
          'detail.allowCrossIspRaw': next,
          'detail.allowCrossIsp': next ? '是' : '否'
        })
        wx.showToast({ title: '跨网设置已更新', icon: 'success' })
      })
      .catch(err => {
        wx.showModal({
          title: '更新失败',
          content: (err && err.message) || '跨网设置更新失败',
          showCancel: false
        })
      })
  }
})
