<template>
  <div class="mp-widget-terrain-analysis">
    <mapgis-3d-terrain-aspect :models="layers" />
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  LayerType,
  IGSSceneSublayerType,
  LoadStatus,
  Objects,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpExcavateAnalysis',
  mixins: [WidgetMixin],
  components: {},

  data() {
    return {
      layers: [],
      // radio样式
      radioStyle: {
        display: 'block',
        height: '30px',
        lineHeight: '30px',
      },
      // 开挖分析对象
      ExcavateAnalysis: null,
    }
  },

  computed: {},

  watch: {
    document: {
      handler: 'getScenes',
      immediate: true,
      deep: true,
    },
    layer: {
      handler: 'changeLayer',
      deep: true,
      immediate: true,
    },
  },

  methods: {
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
      console.log(layers, 'layers----')

      this.layers = layers
      // if (layers.length > 0) {
      //   this.layer = layers[layers.length - 1]
      // } else {
      //   this.layer = layers
      //   this.layer = null
      // }
    },
    /**
     * 切换图层
     */
    changeLayer() {
      if (!this.isActive || !this.layer) return
      const { layer } = this
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
    },

    // 微件关闭时
    onClose() {
      this.isActive = false
    },

    // 微件失活时
    onDeActive() {},
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
