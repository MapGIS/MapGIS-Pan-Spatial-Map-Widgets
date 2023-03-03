const path = require('path')
const webpack = require('webpack')

module.exports = {
  lintOnSave: false,
  productionSourceMap: false,
  outputDir: 'dist-libs',
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'less',
      patterns: [path.resolve(__dirname, './src/theme/theme.less')]
    }
  },
  configureWebpack: {
    plugins: [
      // 限制只打一个包，不分Chunk
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
      })
    ],
    externals: {
      '@mapgis/webclient-vue-ui': '@mapgis/webclient-vue-ui',
      '@mapgis/webclient-vue-mapboxgl': '@mapgis/webclient-vue-mapboxgl',
      '@mapgis/webclient-vue-cesium': '@mapgis/webclient-vue-cesium',
      '@mapgis/webclient-es6-mapboxgl': '@mapgis/webclient-es6-mapboxgl',
      '@mapgis/webclient-es6-service': '@mapgis/webclient-es6-service'
    }
  },
  chainWebpack: (config) => {
    // 生产环境下关闭css压缩的 colormin 项，因为此项优化与主题色替换功能冲突
    config.plugin('optimize-css').tap((args) => {
      args[0].cssnanoOptions.preset[1].colormin = false
      return args
    })

    config.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|ico)$/i)
      .use('url-loader')
      .loader('url-loader')
      .tap((options) =>
        Object.assign(options, { limit: 2000, esModule: false })
      )
    config.plugin('fork-ts-checker').tap((args) => {
      args[0].memoryLimit = 12288
      return args
    })
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {},
          javascriptEnabled: true
        }
      },
      scss: {
        additionalData: '@import "./src/theme/mapgis-ui/index.scss";'
      }
    }
  }
}
