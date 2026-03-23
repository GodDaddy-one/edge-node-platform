Page({
  data: {
    company: '',
    contact: '',
    bankNo: ''
  },
  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [field]: e.detail.value })
  },
  submit() {
    wx.showToast({ title: '已保存资质草稿', icon: 'success' })
  }
})
