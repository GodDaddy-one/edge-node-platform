const dashboardService = require('../../services/dashboard')
const storage = require('../../utils/storage')

const LABELS = {
  heroTitle: '边缘计算云节点',
  heroSubtitle: '已接入边缘云计算分发平台',
  bannerSubtitle: '中台可继续接入原平台活动位或自有投放内容',
  incomeSection: '收益情况',
  totalIncome: '账户累计收益',
  yesterdayIncome: '昨日收益',
  incomeDetail: '收益明细',
  deviceSection: '节点情况',
  totalNodes: '节点总数',
  onlineNodes: '在线节点',
  offlineNodes: '离线节点',
  lineErrorNodes: '线路异常',
  qualitySection: '昨日诊断',
  excellent: '优秀',
  medium: '中等',
  bad: '差',
  processSection: '上机流程',
  waitingForConfigNetwork: '待配置网络',
  waitingForTest: '待测试',
  serving: '服务中',
  waitingAbandoned: '验收未通过',
  loadFailed: '首页数据加载失败',
  comingSoon: '该功能正在接入中'
}

Page({
  data: {
    labels: LABELS,
    loading: true,
    income: {
      totalIncome: '0.00',
      yesterdayIncome: '0.00'
    },
    deviceStats: {
      total: 0,
      online: 0,
      offline: 0,
      lineError: 0
    },
    qualityStats: {
      excellent: 0,
      medium: 0,
      bad: 0
    },
    processStats: {
      waitingForConfigNetwork: 0,
      waitingForTest: 0,
      serving: 0,
      waitingAbandoned: 0
    },
    banners: [],
    notices: []
  },
  onShow() {
    if (!storage.getToken()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.loadDashboard()
  },
  loadDashboard() {
    this.setData({ loading: true })
    dashboardService.getHomeDashboard()
      .then(data => {
        this.setData({
          income: data.income || this.data.income,
          deviceStats: data.deviceStats || this.data.deviceStats,
          qualityStats: data.qualityStats || this.data.qualityStats,
          processStats: data.processStats || this.data.processStats,
          banners: data.banners || [],
          notices: data.notices || []
        })
      })
      .catch(() => {
        wx.showToast({
          title: this.data.labels.loadFailed,
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ loading: false })
      })
  },
  goTo(e) {
    const path = e.currentTarget.dataset.path
    if (!path) return
    wx.navigateTo({ url: path })
  },
  showComingSoon() {
    wx.showToast({
      title: this.data.labels.comingSoon,
      icon: 'none'
    })
  },
  openNodeFilter(e) {
    const dataset = e.currentTarget.dataset || {}
    wx.setStorageSync('deviceListQuickFilter', {
      phase: dataset.phase || '',
      network: dataset.network || ''
    })
    wx.switchTab({
      url: '/pages/device/list/list'
    })
  }
})
