const deviceService = require('../../../services/device')

const PERIOD_TABS = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' }
]

const GRANULARITY_TABS = [
  { key: '5m', label: '5m' },
  { key: '1h', label: '1h' }
]

Page({
  data: {
    uuid: '',
    loading: true,
    activePeriod: 'today',
    activeGranularity: '5m',
    startDate: '',
    endDate: '',
    periodTabs: PERIOD_TABS,
    granularityTabs: GRANULARITY_TABS,
    summary: null
  },
  onLoad(query) {
    const uuid = query.uuid || ''
    const today = this.formatDate(new Date())
    this.setData({
      uuid,
      startDate: today,
      endDate: today
    })
    this.loadMonitorSnapshot(uuid)
  },
  loadMonitorSnapshot(uuid) {
    this.setData({ loading: true })
    deviceService.getDeviceDetail(uuid)
      .then(res => {
        const item = (res.devices || [])[0] || { uuid }
        this.setData({
          summary: this.normalizeSummary(item)
        })
      })
      .catch(() => {
        this.setData({
          summary: this.normalizeSummary({ uuid })
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },
  normalizeSummary(item) {
    return {
      uuid: item.uuid || '--',
      reportBandwidth: this.formatBandwidth(item.upBandwidthBase || item.bandwidth),
      testBandwidth: item.testUpBandwidth ? `${Number(item.testUpBandwidth).toFixed(2)} Mbps` : '--',
      cpuUsage: this.formatPercent(item.cpuUsage || item.cpuUsedRate || item.cpuHighLoadRate),
      memoryUsage: this.formatPercent(item.memoryUsage || item.memoryUsedRate),
      diskUsage: this.formatPercent(item.diskUsage || item.diskUsedRate),
      natType: item.realtimeNATTypeType || '--',
      location: item.location || '--',
      isp: item.isp || '--',
      onlineStatus: this.mapNetworkStatus(item.onlineStatus || item.status)
    }
  },
  mapNetworkStatus(status) {
    if (status === 'online' || status === '在线') return '在线'
    if (status === 'offline' || status === '离线') return '离线'
    return '网络异常'
  },
  formatDate(date) {
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, '0')
    const d = `${date.getDate()}`.padStart(2, '0')
    return `${y}-${m}-${d}`
  },
  formatPercent(value) {
    const num = Number(value || 0)
    if (!Number.isFinite(num)) return '--'
    return `${num.toFixed(2)}%`
  },
  formatBandwidth(size) {
    const num = Number(size || 0)
    if (!num) return '--'
    const mbps = num > 1024 * 1024 ? num / 1024 / 1024 : num
    if (mbps >= 1024) return `${(mbps / 1024).toFixed(2)} Gbps`
    return `${Math.round(mbps)} Mbps`
  },
  switchPeriod(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    const today = new Date()
    const start = new Date(today)

    if (key === 'yesterday') {
      start.setDate(today.getDate() - 1)
      today.setDate(today.getDate() - 1)
    } else if (key === 'week') {
      start.setDate(today.getDate() - 6)
    } else if (key === 'month') {
      start.setDate(today.getDate() - 29)
    }

    this.setData({
      activePeriod: key,
      startDate: this.formatDate(start),
      endDate: this.formatDate(today)
    })
  },
  switchGranularity(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    this.setData({
      activeGranularity: key
    })
  }
})
