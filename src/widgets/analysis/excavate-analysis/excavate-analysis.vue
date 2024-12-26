<template>
  <div class="mp-widget-terrain-analysis">
    <mapgis-3d-excavate-analysis :models="layers" :terrainGroundFillImages="terrainGroundFillImages" :terrainWallFillImages="terrainWallFillImages" :modelFillImage="modelFillImage" @load="load" />
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  LayerType,
  IGSSceneSublayerType,
  LoadStatus,
  api
} from '@mapgis/web-app-framework'

export default {
  name: 'MpExcavateAnalysis',
  mixins: [WidgetMixin],
  components: {},

  data() {
    return {
      layers: [],
      // 开挖分析对象
      ExcavateAnalysis: null,
      // 底面纹理
      terrainGroundFillImages: [],
      // 剖面纹理
      terrainWallFillImages: [],
      // 模型纹理
      modelFillImage: ''
    }
  },

  computed: {},

  watch: {
    document: {
      handler: 'getScenes',
      immediate: true,
      deep: true,
    }
  },

  async mounted() {
    const config = await api.getWidgetConfig('excavate-analysis')
    this.terrainGroundFillImages = config.terrainGroundFillImages.map((item, index) => {
      if(index > 0) {
        item.value = this.imageUrl(item.value)
      }
      return item
    })
    this.terrainWallFillImages = config.terrainWallFillImages.map((item, index) => {
      if(index > 0) {
        item.value = this.imageUrl(item.value)
      }
      return item
    })
    this.modelFillImage = this.imageUrl(config.modelFillImage)
  },

  methods: {
    /**
     * 获取纹理的最终路径
     */
    imageUrl(url) {
      if (url.startsWith('/file')) {
        return `${this.baseUrl}/${this.appProductName}${url}`
      }
      return `${this.baseUrl}${url}`
    },
    /**
     * 动态获取基础目录树上已勾选的地图图层
     */
    getScenes() {
      if (!this.document) return
      const layers = []
      this.document.defaultMap
        .clone()
        .getFlatLayers()
        .forEach((layer, index) => {
          if (layer.loadStatus === LoadStatus.loaded) {
            if (layer.type === LayerType.IGSScene) {
              if (layer.activeScene) {
                const { type } = layer.activeScene.sublayers[0]
                if (type === IGSSceneSublayerType.modelCache) {
                  const { id } = layer.activeScene.layer
                  layers.push({
                    title: layer.title,
                    vueIndex: id,
                  })
                }
              }
            } else if (layer.type === LayerType.ModelCache) {
              layers.push({
                title: layer.title,
                vueIndex: layer.id,
              })
            }
          }
        })
      this.layers = layers
    },

    // 加载成功时
    load(ExcavateAnalysis) {
      this.ExcavateAnalysis = ExcavateAnalysis
    },
    // 微件打开时
    onOpen() {
      this.isActive = true
    },

    // 微件激活时
    onActive() {
      this.isActive = true
      this.ExcavateAnalysis.mount()
    },

    // 微件关闭时
    onClose() {
      this.isActive = false
      this.ExcavateAnalysis.unmount()
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-terrain-analysis {
  .terrain-analysis-types {
    .analysis-type {
      .analysis-type-img {
        &.active-type,
        &:hover {
          box-shadow: 0 0 0 2px $primary-color;
        }
      }
      .analysis-type-text {
        color: $text-color;
      }
    }
  }
}
</style>
