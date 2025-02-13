<template>
  <div>
    <mapgis-3d-scene-setting
      @loaded="loaded"
      :initialStatebar="initialStatebar"
      :initParams="config"
      :initFavoritesParams="initFavoritesParams"
      :boundingSphereRadius="boundingSphereRadius"
      :baseLayerIds="baseLayerIds"
      :publicPath="publicPath"
      :isWidgetOpen="isWidgetOpen"
      :stuffWidth="stuffWidth"
      ref="sceneSetting"
    >
    </mapgis-3d-scene-setting>
    <mapgis-ui-setting-footer>
      <mapgis-ui-button @click="syncToServer" type="primary" class="full-width">
        同步到服务器
      </mapgis-ui-button>
    </mapgis-ui-setting-footer>
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  api,
  DataCatalogCheckController,
  eventBus,
  events,
  LayerType,
  IGSSceneSublayerType,
  LoadStatus,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpSceneSetting',
  mixins: [WidgetMixin],
  data() {
    return {
      // 页面布局方式
      layout: 'horizontal',
      initialStatebar: true,
      dataCatalogCheckController: DataCatalogCheckController,
      boundingSphereRadius: 0,
      baseLayerIds: [],
      isWidgetOpen: false,
      stuffWidth: 48,
    }
  },

  watch: {
    'document.defaultMap': {
      handler: 'getScenes',
      immediate: true,
      deep: true,
    },
    'document.baseLayerMap': {
      handler: 'getBaseLayerMap',
      immediate: true,
      deep: true,
    },
  },

  computed: {
    config() {
      let { config } = this.widgetInfo
      if (window.localStorage.sceneSetting) {
        config = JSON.parse(window.localStorage.sceneSetting)
      }
      if (config && config.basicSetting) {
        config.basicSetting.zoom = undefined
      }
      // fix(6503): 地表自适应透明和地下模式使用最新的Cesium接口
      // 修改人：杨琨 2024-11-7
      // 修改说明：如果服务端没有影像图层独立控制配置，则补全该配置
      if (
        config &&
        config.cameraSetting &&
        !Object.prototype.hasOwnProperty.call(
          config.cameraSetting.undgrdParams,
          'enableIndependentTranslucency'
        )
      ) {
        config.cameraSetting.undgrdParams.enableIndependentTranslucency = false
      }
      this.dataCatalogCheckController.setInitSceneConfig(config)
      return config
    },
    initFavoritesParams() {
      return this.dataCatalogCheckController.getCurrentCheckSceneSettingConfig()
    },
    publicPath() {
      return this.application.publicPath
    },
  },
  created() {
    this.getStuffWidth()
    eventBus.$on(events.SCENE_CONFIG_INFO, this.getSceneConfig)
  },

  methods: {
    /**
     * 动态获取左侧板宽度
     */
    getStuffWidth() {
      const dom = document.querySelector('.mp-side-widget-panel').childNodes[0]
      const domSideMenu = document.querySelector('.side-menu-wrapper')
      const self = this
      this.observerStuffWidth = new ResizeObserver(() => {
        if (dom && dom.style && domSideMenu && domSideMenu.style) {
          self.stuffWidth =
            this.getWidthNum(dom.style.width) +
            this.getWidthNum(domSideMenu.style.width)
        }
      }).observe(dom)
    },
    /**
     * 去掉px将宽度转成数字
     */
    getWidthNum(width) {
      return Number(width.slice(0, width.length - 2))
    },
    /**
     * 动态获取基础目录树上已勾选的三维数据
     */
    getScenes() {
      if (!this.document) return
      const layers = []
      this.document.defaultMap
        .clone()
        .getFlatLayers()
        .forEach((layer, index) => {
          if (
            layer.extend &&
            layer.extend.selfAdaption &&
            layer.loadStatus === LoadStatus.loaded
          ) {
            if (layer.type === LayerType.IGSScene) {
              if (layer.activeScene) {
                const { type } = layer.activeScene.sublayers[0]
                if (
                  type === IGSSceneSublayerType.elevation ||
                  type === IGSSceneSublayerType.modelCache
                ) {
                  layers.push(layer)
                }
              }
            } else if (
              layer.type === LayerType.STKTerrain ||
              layer.type === LayerType.ModelCache
            ) {
              layers.push(layer)
            }
          }
        })
      // fix(6503): 地表自适应透明和地下模式使用最新的Cesium接口
      // 修改人：杨琨 2024-11-7
      // 修改说明：考虑到后续可能新增二维影像图层类型，此处判断不会及时更新，因此不判断图层类型，只要目录树有更新，直接更新影像独立控制影响的图层
      if (this.$refs.sceneSetting) {
        this.$refs.sceneSetting.updateIndependentTranslucency()
      }
      setTimeout(() => {
        // 防止获取到未加载完的模型
        this._getM3DSetArrayBoundingSphere(layers)
      }, 2000)
    },
    /**
     * 获取多个模型的最大包围球
     */
    _getM3DSetArrayBoundingSphere(layers) {
      let m3dSetArray = []
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        let cesiumLayer
        if (layer.type === LayerType.IGSScene) {
          cesiumLayer = this.vueCesium.G3DManager.findSource(
            this.viewer.vueKey,
            layer.id
          )
          if (cesiumLayer) {
            const { options } = cesiumLayer
            if (options && options.m3ds && options.m3ds.length > 0) {
              m3dSetArray = m3dSetArray.concat(options.m3ds)
            }
          }
        } else if (layer.type === LayerType.ModelCache) {
          cesiumLayer = this.vueCesium.M3DIgsManager.findSource(
            this.viewer.vueKey,
            layer.id
          )
          if (cesiumLayer) {
            const { source } = cesiumLayer
            m3dSetArray.push(source[0])
          }
        } else if (layer.type === LayerType.STKTerrain) {
          cesiumLayer = this.vueCesium.Tileset3DManager.findSource(
            this.viewer.vueKey,
            layer.id
          )
          if (cesiumLayer) {
            const { source } = cesiumLayer
            m3dSetArray.push(source[0])
          }
        }
      }
      const boundingSphere =
        zondy.cesium.AlgorithmLib.mergeLayersBoundingSphere(m3dSetArray)
      if (boundingSphere && boundingSphere.radius !== undefined) {
        this.boundingSphereRadius = boundingSphere.radius
      }
    },

    getBaseLayerMap() {
      if (!this.document) return
      const ids = []
      this.document.baseLayerMap
        .clone()
        .getFlatLayers()
        .forEach((layer, index) => {
          if (layer.loadStatus === LoadStatus.loaded) {
            if (
              layer.description !== '索引底图' &&
              (layer.type === LayerType.IGSMapImage ||
                layer.type === LayerType.IGSVector ||
                layer.type === LayerType.IGSTile ||
                layer.type === LayerType.OGCWMS ||
                layer.type === LayerType.OGCWMTS ||
                layer.type === LayerType.ArcGISMapImage ||
                layer.type === LayerType.ArcGISTile)
            ) {
              ids.push(layer.id)
            }
          }
        })
      this.baseLayerIds = [...ids]
    },

    /**
     * 微件打开时
     */
    onOpen() {
      this.isWidgetOpen = true
      this.setting.mount()
    },

    /**
     * 微件关闭时
     */
    onClose() {
      this.isWidgetOpen = false
      this.setting.unmount()
      this.syncToLocalStorage()
    },

    // 微件失活时
    onDeActive() {
      this.syncToLocalStorage()
    },

    loaded(setting) {
      this.setting = setting
    },

    syncToServer() {
      const self = this
      this.$confirm({
        title: '提示',
        content: '是否将配置同步到服务器?',
        onOk() {
          self.syncToLocalStorage()
          self.saveConfig()
        },
        onCancel() {},
      })
    },

    syncToLocalStorage() {
      const config = this.getConfig()
      window.localStorage.sceneSetting = JSON.stringify(config)
      this.dataCatalogCheckController.setInitSceneConfig(config)
    },

    getConfig() {
      const sceneSettingComponent = this.$refs.sceneSetting
      const basicSetting = sceneSettingComponent.getBasicSetting()
      const cameraSetting = sceneSettingComponent.getCameraSetting()
      const lightSetting = sceneSettingComponent.getLightSetting()
      const weatherSetting = sceneSettingComponent.getWeatherSetting()
      const effectSetting = sceneSettingComponent.getEffectSetting()
      const config = {
        basicSetting,
        cameraSetting,
        lightSetting,
        weatherSetting,
        effectSetting,
      }
      return config
    },

    saveConfig() {
      const config = this.getConfig()
      api
        .saveWidgetConfig({
          name: 'scene-setting',
          config: JSON.stringify(config),
        })
        .then(() => {
          this.$message.success('更新场景设置配置成功')
          // console.log('更新场景设置配置成功')
        })
        .catch(() => {
          this.$message.error('更新场景设置配置失败')
          // console.log('更新场景设置配置失败')
        })
    },
    getSceneConfig() {
      const config = this.getConfig()
      this.dataCatalogCheckController.setCheckSceneConfig(config)
    },
  },
}
</script>

<style lang="less">
.full-width {
  width: 100%;
}

.cesium-performanceDisplay-defaultContainer {
  position: absolute;
  top: 90% !important;
  right: 25% !important;
  text-align: right;
}
</style>
