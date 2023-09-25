<template>
  <div class="mp-model-pick">
    <mapgis-ui-group-tab
      title="地质体模型"
      :has-top-margin="false"
    ></mapgis-ui-group-tab>
    <mapgis-ui-row class="model">
      <mapgis-ui-radio-group v-if="layers.length > 0" v-model="layer">
        <mapgis-ui-radio
          v-for="(node, index) in layers"
          :style="radioStyle"
          :key="`model-${index}`"
          :value="node"
        >
          {{ node.title }}
        </mapgis-ui-radio>
      </mapgis-ui-radio-group>
      <div v-else>暂无数据！</div>
    </mapgis-ui-row>
    <mp-model-stretch-ui
      :enableModelStretch.sync="enableModelStretch"
      :scaleZ.sync="scaleZ"
      :offset.sync="offset"
    />
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
  LayerType,
  IGSSceneSublayerType,
  LoadStatus,
  Objects,
  api,
} from '@mapgis/web-app-framework'

import MpModelStretchUi from '../../../components/ModelStretch/ModelStretchUi.vue'

import ModelStretchUtil from '../../../components/ModelStretch/mixin/ModelStretchUtil.js'

export default {
  name: 'MpModelStretch',
  components: { 'mp-model-stretch-ui': MpModelStretchUi },
  mixins: [WidgetMixin, ModelStretchUtil],
  data() {
    return {
      // radio样式
      radioStyle: {
        display: 'block',
        height: '30px',
        lineHeight: '30px',
      },
      // 模型集合
      layers: [],
      // 选中图层
      layer: null,
      // 是否开启模型拉伸
      enableModelStretch: false,
      scaleZ: 1,
      isActive: false,
      offset: -2,
    }
  },
  watch: {
    document: {
      handler: 'getScenes',
      immediate: true,
      deep: true,
    },
    'layer.id': {
      handler() {
        if (!this.isActive) {
          return
        }
        this.updateModelReset()
        this.updateLayer()
      },
      deep: true,
      immediate: true,
    },
    scaleZ: {
      handler() {
        if (!this.enableModelStretch) {
          return
        }
        this.changeScaleZ(this.scaleZ, this.offset, this.layer.id)
        this.updateLayerProperty()
      },
      deep: true,
    },
    enableModelStretch: {
      handler(val) {
        if (!val) {
          this.updateModelReset()
        } else {
          this.changeScaleZ(this.scaleZ, this.offset, this.layer.id)
        }
        this.updateLayerProperty()
      },
      deep: true,
    },
  },
  mounted() {
    // 存放模型编辑对象
    window.modelEditControlList = new Object()
  },
  methods: {
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
          if (layer.loadStatus === LoadStatus.loaded) {
            if (layer.type === LayerType.IGSScene) {
              if (layer.activeScene) {
                const { type } = layer.activeScene.sublayers[0]
                if (type === IGSSceneSublayerType.modelCache) {
                  // 模型拉伸只支持模型
                  layers.push(layer)
                }
              }
            }
          }
        })
      this.layers = layers
      if (layers.length > 0) {
        this.layer = layers[layers.length - 1]
      } else {
        this.layer = null
      }
    },
    updateLayer() {
      this.enableModelStretch = false
      this.scaleZ = 1
      this.offset = -2
      const { layerProperty } = this.layer
      if (layerProperty) {
        this.enableModelStretch =
          layerProperty.enableModelStretch !== undefined
            ? layerProperty.enableModelStretch
            : false
        this.scaleZ =
          layerProperty.scaleZ !== undefined ? layerProperty.scaleZ : 1
        this.offset =
          layerProperty.offset !== undefined ? layerProperty.offset : -2
      }
      this.changeLayer(this.layer)
    },
    updateLayerProperty() {
      const { enableModelStretch, scaleZ, offset } = this
      const { layerProperty } = this.layer
      if (layerProperty) {
        this.layer.layerProperty = {
          ...layerProperty,
          enableModelStretch,
          scaleZ,
          offset,
        }
      } else {
        this.layer.layerProperty = {
          enableModelStretch,
          scaleZ,
          offset,
        }
      }
    },
    onActive() {
      this.isActive = true
    },
    /**
     * 打开模块
     */
    onOpen() {
      this.isActive = true
      this.updateLayer()
    },
    /**
     * 关闭模块
     */
    onClose() {
      this.isActive = false
      window.modelEditControlList = undefined
      this.updateModelReset()
    },
    syncToServer() {
      const self = this
      this.$confirm({
        title: '提示',
        content: '是否将设置同步到服务器?',
        onOk() {
          const { dataId, layerProperty } = self.layer
          if (dataId !== undefined || dataId !== null) {
            api.updateData({ dataId, layerProperty })
          }
        },
        onCancel() {},
      })
    },
  },
}
</script>
<style lang="less" scoped>
.full-width {
  width: 100%;
}
</style>
