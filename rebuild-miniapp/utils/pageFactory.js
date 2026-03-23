function createPlaceholderPage(options) {
  return Page({
    data: {
      title: options.title,
      summary: options.summary || '页面已重建为可运行骨架，后续可继续补业务逻辑。'
    },
    onLoad(query) {
      if (options.onLoad) {
        options.onLoad.call(this, query)
      }
    }
  })
}

module.exports = {
  createPlaceholderPage
}
