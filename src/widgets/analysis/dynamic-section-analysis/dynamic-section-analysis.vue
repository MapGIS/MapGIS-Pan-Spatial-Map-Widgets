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

<style lang="scss" scoped>
.mp-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid $border-color;
  &.center {
    justify-content: center;
    .ant-btn {
      margin: 0 4px;
    }
  }
  /deep/.ant-btn {
    margin-left: 8px;
  }
}

.mp-note-info {
  padding: 3px 0;
  color: $text-color-secondary;
  word-break: break-all;
  white-space: break-spaces;
  font-size: 12px;
  &.ant-input {
    border: none;
    background-color: transparent;
    resize: none;
    min-height: 24px;
  }
}

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
