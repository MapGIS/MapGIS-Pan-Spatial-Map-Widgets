<template>
  <div class="mp-widget-dynamic-section-analysis">
    <mapgis-3d-dynamic-section :models="models" @load="load" />
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
  name: 'MpDynamicSectionAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      // 模型集合
      models: [],
      dynamicSection: undefined,
    }
  },

  /**
   * 动态获取基础目录树上已勾选的三维模型数据
   */
  watch: {
    document: {
      handler: 'getScenes',
      immediate: true,
      deep: true,
    },
  },

  methods: {
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
      this.models = layers
    },

    load(dynamicSection) {
      this.dynamicSection = dynamicSection
    },

    onActive() {
      this.dynamicSection.mount()
    },

    /**
     * 打开模块
     */
    onOpen() {
      this.dynamicSection.mount()
      this.dynamicSection.startClipping()
    },

    /**
     * 关闭模块
     */
    onClose() {
      this.dynamicSection.unmount()
    },
  },
}
</script>

<style lang="less" scoped>
@import './style/index.less';

::v-deep {
  .ant-input-number {
    width: 100%;
  }
}

.mp-widget-dynamic-section-analysis {
  display: flex;
  flex-direction: column;
  .model,
  .axis {
    font-size: 12px;
    .ant-radio-wrapper {
      font-size: 12px;
    }
  }
}
</style>
