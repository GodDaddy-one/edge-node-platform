Page({
  data: {
    url: 'https://lepaiyun.work'
  },
  onLoad(query) {
    if (query.url) {
      this.setData({ url: decodeURIComponent(query.url) })
    }
  }
})
