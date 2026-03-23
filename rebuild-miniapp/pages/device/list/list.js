const accountService = require('../../../services/account')
const sourceService = require('../../../services/source')
const deviceService = require('../../../services/device')
const storage = require('../../../utils/storage')

const LABELS = {
  myNodes: '我的节点',
  searchPlaceholder: '搜索节点ID或备注',
  loading: '正在加载节点数据...',
  syncing: '同步中...',
  empty: '暂时没有可展示的节点数据',
  unbound: '中端暂未配置上游授权，请在运营后台完成授权',
  sourceInvalid: '中端上游授权已失效，请在运营后台更新',
  loadFailed: '节点数据加载失败',
  syncFailed: '自动同步失败',
  syncHint: '已自动从中端代理更新节点数据',
  bindTime: '绑定时间',
  utilizationRate: '实时利用率',
  uuid: 'UUID',
  status: '状态',
  bandwidth: '上行带宽',
  yesterdayIncome: '昨日收益',
  filterTitlePhase: '当前阶段',
  filterTitleNetwork: '网络状态',
  reset: '重置',
  confirm: '确认',
  authAction: '知道了',
  searching: '搜',
  filtering: '筛'
}

const PHASE_OPTIONS = ['待配置网络', '验收中', '服务中', '验收未通过', '待测试', '待下机', '已下机']
const NETWORK_OPTIONS = ['在线', '离线', '网络异常']

Page({
  data: {
    labels: LABELS,
    loading: true,
    syncing: false,
    keyword: '',
    filterVisible: false,
    selectedPhases: [],
    selectedNetworks: [],
    phaseOptions: PHASE_OPTIONS,
    networkOptions: NETWORK_OPTIONS,
    devices: [],
    filteredDevices: [],
    sourceBound: false,
    sourceValid: false,
    emptyMessage: LABELS.empty
  },
  onLoad() {
    this.consumeQuickFilter()
  },
  onShow() {
    if (!storage.getToken()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.consumeQuickFilter()
    this.bootstrap()
  },
  consumeQuickFilter() {
    try {
      const filter = wx.getStorageSync('deviceListQuickFilter')
      if (!filter) return
      wx.removeStorageSync('deviceListQuickFilter')
      this.applyQuickFilter(filter)
    } catch (err) {}
  },
  applyQuickFilter(filter) {
    this.setData({
      selectedPhases: filter.phase ? [filter.phase] : [],
      selectedNetworks: filter.network ? [filter.network] : []
    })
  },
  bootstrap() {
    this.setData({ loading: true })
    accountService.getMe()
      .then(me => {
        this.setData({
          sourceBound: !!me.sourceBound,
          sourceValid: !!me.sourceBound,
          emptyMessage: LABELS.empty
        })
        return this.loadDevices(me)
      })
      .catch(() => {
        this.setData({
          devices: [],
          emptyMessage: LABELS.loadFailed
        }, () => this.applyFilters())
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },
  loadDevices(me) {
    return deviceService.getCachedDeviceList()
      .then(res => {
        let devices = (res.devices || []).map(item => this.normalizeDevice(item))
        if (devices.length) {
          this.setData({ devices }, () => this.applyFilters())
          return null
        }

        const sourceBound = me ? !!me.sourceBound : this.data.sourceBound
        if (!sourceBound) {
          this.setData({
            sourceBound: false,
            sourceValid: false,
            devices: [],
            emptyMessage: LABELS.unbound
          }, () => this.applyFilters())
          return null
        }

        return sourceService.checkSourceStatus()
          .then(check => {
            if (!check.valid) {
              this.setData({
                sourceBound: true,
                sourceValid: false,
                devices: [],
                emptyMessage: LABELS.sourceInvalid
              }, () => this.applyFilters())
              return null
            }

            this.setData({
              sourceBound: true,
              sourceValid: true,
              emptyMessage: LABELS.empty
            })
            return this.autoSyncAndReload()
          })
          .catch(() => {
            this.setData({
              sourceBound: true,
              sourceValid: false,
              devices: [],
              emptyMessage: LABELS.sourceInvalid
            }, () => this.applyFilters())
            return null
          })
      })
      .then(devices => {
        if (devices) {
          this.setData({ devices }, () => this.applyFilters())
        }
      })
      .catch(() => {
        this.setData({ devices: [] }, () => this.applyFilters())
        wx.showToast({
          title: LABELS.loadFailed,
          icon: 'none'
        })
      })
  },
  autoSyncAndReload() {
    this.setData({ syncing: true })
    return deviceService.syncDevices(100)
      .then(() => deviceService.getCachedDeviceList())
      .then(res => {
        const devices = (res.devices || []).map(item => this.normalizeDevice(item))
        if (devices.length) {
          wx.showToast({
            title: LABELS.syncHint,
            icon: 'none'
          })
        }
        return devices
      })
      .catch(() => {
        wx.showToast({
          title: LABELS.syncFailed,
          icon: 'none'
        })
        return []
      })
      .finally(() => {
        this.setData({ syncing: false })
      })
  },
  normalizeDevice(item) {
    const rawStatus = item.onlineStatus || item.status || 'unknown'
    const networkStatus = rawStatus === 'online' || rawStatus === '在线'
      ? '在线'
      : rawStatus === 'offline' || rawStatus === '离线'
        ? '离线'
        : '网络异常'

    const currentPhase = item.currentPhase || item.phase || item.minerStateLabel || this.mapMinerState(item.minerState, networkStatus)

    return {
      uuid: item.uuid,
      name: item.remark || item.deviceName || item.name || item.uuid,
      status: rawStatus,
      networkStatus,
      currentPhase,
      bandwidth: this.getDisplayBandwidth(item),
      yesterdayIncome: item.yesterdayIncome || '0.00',
      bindTime: item.bindTime || this.formatBindTime(item.bindTimestamp),
      utilizationRate: this.formatUtilization(item.minerRealtimeUtilizationRate || item.yesterdayUtilizationRate || 0)
    }
  },
  mapMinerState(minerState, networkStatus) {
    const stateMap = {
      waitingForConfigNetwork: '待配置网络',
      checking: '验收中',
      serving: '服务中',
      reject: '验收未通过',
      waitingForTest: '待测试',
      waitingForOffboarding: '待下机',
      offboarded: '已下机'
    }
    return stateMap[minerState] || (networkStatus === '离线' ? '待配置网络' : '待测试')
  },
  formatBindTime(timestamp) {
    if (!timestamp) return '--'
    const date = new Date(Number(timestamp) * 1000)
    if (Number.isNaN(date.getTime())) return '--'
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, '0')
    const d = `${date.getDate()}`.padStart(2, '0')
    return `${y}-${m}-${d}`
  },
  formatUtilization(value) {
    return `${Number(value || 0).toFixed(2)}%`
  },
  getDisplayBandwidth(item) {
    const lineCount = Number(item.lineCount || 0)
    const phase = item.minerState || ''
    if (!lineCount || phase === 'waitingForConfigNetwork') return '--'

    const perLine = Number(item.upBandwidthPerline || 0)
    if (perLine > 0) return this.formatBandwidthValue(perLine)

    const bandwidth = Number(item.bandwidth || 0)
    if (bandwidth > 0 && bandwidth < 1024 * 100) return this.formatBandwidthValue(bandwidth)

    return '--'
  },
  formatBandwidthValue(value) {
    const mbps = Number(value || 0)
    if (!mbps) return '--'
    if (mbps >= 1024) return `${(mbps / 1024).toFixed(2)}G`
    return `${Math.round(mbps)}M`
  },
  applyFilters() {
    const keyword = (this.data.keyword || '').trim().toLowerCase()
    const selectedPhases = this.data.selectedPhases
    const selectedNetworks = this.data.selectedNetworks

    const filteredDevices = this.data.devices.filter(item => {
      const textMatched = !keyword || String(item.uuid || '').toLowerCase().includes(keyword) || String(item.name || '').toLowerCase().includes(keyword)
      const phaseMatched = !selectedPhases.length || selectedPhases.includes(item.currentPhase)
      const networkMatched = !selectedNetworks.length || selectedNetworks.includes(item.networkStatus)
      return textMatched && phaseMatched && networkMatched
    })

    this.setData({ filteredDevices })
  },
  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value }, () => this.applyFilters())
  },
  openFilter() {
    this.setData({ filterVisible: true })
  },
  closeFilter() {
    this.setData({ filterVisible: false })
  },
  togglePhase(e) {
    const value = e.currentTarget.dataset.value
    const selected = new Set(this.data.selectedPhases)
    if (selected.has(value)) selected.delete(value)
    else selected.add(value)
    this.setData({ selectedPhases: Array.from(selected) })
  },
  toggleNetwork(e) {
    const value = e.currentTarget.dataset.value
    const selected = new Set(this.data.selectedNetworks)
    if (selected.has(value)) selected.delete(value)
    else selected.add(value)
    this.setData({ selectedNetworks: Array.from(selected) })
  },
  resetFilters() {
    this.setData({
      selectedPhases: [],
      selectedNetworks: []
    }, () => this.applyFilters())
  },
  confirmFilters() {
    this.applyFilters()
    this.closeFilter()
  },
  goBindSource() {
    wx.showToast({
      title: LABELS.unbound,
      icon: 'none'
    })
  },
  openDetail(e) {
    wx.navigateTo({
      url: `/pages/device-detail/detail/detail?uuid=${e.currentTarget.dataset.uuid}`
    })
  }
})
