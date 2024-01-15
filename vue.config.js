const path = require('path')
const webpack = require('webpack')

module.exports = {
  lintOnSave: false,
  productionSourceMap: false,
  outputDir: 'dist-libs',
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'less',
      patterns: [path.resolve(__dirname, './src/theme/theme.less')],
    },
  },
  configureWebpack: {
    plugins: [
      // 限制只打一个包，不分Chunk
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ],
    externals: {
      '@mapgis/web-app-framework': '@mapgis/web-app-framework',
      '@mapgis/cesium': '@mapgis/cesium',
      '@mapgis/geojson-vt': '@mapgis/geojson-vt',
      '@mapgis/mapbox-gl': '@mapgis/mapbox-gl',
      '@mapgis/mapbox-gl-compare': '@mapgis/mapbox-gl-compare',
      '@mapgis/mapbox-gl-draw': '@mapgis/mapbox-gl-draw',
      '@mapgis/mapbox-gl-draw-circle': '@mapgis/mapbox-gl-draw-circle',
      '@mapgis/mapbox-gl-draw-radius': '@mapgis/mapbox-gl-draw-radius',
      '@mapgis/mapbox-gl-draw-static-mode':
        '@mapgis/mapbox-gl-draw-static-mode',
      '@mapgis/mapbox-gl-inspect': '@mapgis/mapbox-gl-inspect',
      '@mapgis/supercluster': '@mapgis/supercluster',
      '@mapgis/webclient-cesium-plugin': '@mapgis/webclient-cesium-plugin',
      '@mapgis/webclient-common': '@mapgis/webclient-common',
      '@mapgis/webclient-es6-mapboxgl': '@mapgis/webclient-es6-mapboxgl',
      '@mapgis/webclient-es6-service': '@mapgis/webclient-es6-service',
      '@mapgis/webclient-plot': '@mapgis/webclient-plot',
      '@mapgis/webclient-store': '@mapgis/webclient-store',
      '@mapgis/webclient-vue-ui': '@mapgis/webclient-vue-ui',
      '@mapgis/webclient-vue-mapboxgl': '@mapgis/webclient-vue-mapboxgl',
      '@mapgis/webclient-vue-cesium': '@mapgis/webclient-vue-cesium',
    },
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
      config.plugins.delete('fork-ts-checker') // 解决打包时候ts类型检测报错
    // config.plugin('fork-ts-checker').tap((args) => {
    //   args[0].memoryLimit = 12288
    //   return args
    // })
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {},
          javascriptEnabled: true,
        },
      },
      scss: {
        additionalData: '@import "./src/theme/mapgis-ui/index.scss";',
      },
    },
  },
}
