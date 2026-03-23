const accountService = require('../../services/account')
const sourceService = require('../../services/source')

function buildMenus() {
  return [
    { title: '实名认证与资质', path: '/pages/qualification/index' },
    { title: '修改密码', path: '/pages/user/password/update/update' },
    { title: '退出登录', path: '/pages/user/logout/logout' }
  ]
}

Page({
  data: {
    labels: {
      sourceOk: '平台数据同步正常',
      sourceInvalid: '平台数据源异常，请联系管理员'
    },
    user: {
      name: '演示用户',
      mobile: '138****0000'
    },
    sourceStatus: {
      bound: false,
      valid: false
    },
    menus: []
  },
  onShow() {
    this.loadProfile()
  },
  loadProfile() {
    accountService.getMe()
      .then(me => {
        const sourceStatus = {
          bound: !!me.sourceBound,
          valid: !!me.sourceBound
        }

        const applyProfile = nextStatus => {
          this.setData({
            user: {
              name: me.nickname || '演示用户',
              mobile: me.mobile || '138****0000'
            },
            sourceStatus: nextStatus,
            menus: buildMenus()
          })
        }

        if (!me.sourceBound) {
          applyProfile(sourceStatus)
          return
        }

        sourceService.checkSourceStatus()
          .then(check => {
            applyProfile({
              bound: !!check.bound,
              valid: !!check.valid
            })
          })
          .catch(() => {
            applyProfile({
              bound: true,
              valid: false
            })
          })
      })
      .catch(() => {
        this.setData({
          menus: buildMenus()
        })
      })
  },
  open(e) {
    wx.navigateTo({
      url: e.currentTarget.dataset.path
    })
  }
})
