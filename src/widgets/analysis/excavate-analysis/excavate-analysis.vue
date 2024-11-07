<template>
  <div class="mp-widget-terrain-analysis">
    <mapgis-3d-excavate-analysis :models="layers" @load="load" />
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  LayerType,
  IGSSceneSublayerType,
  LoadStatus
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
