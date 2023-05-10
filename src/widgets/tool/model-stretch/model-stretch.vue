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
    <!-- <mapgis-ui-switch-panel
      size="default"
      label="地质体拉伸"
      v-model="enableModelStretch"
    >
      <mapgis-ui-input-number-panel
        v-model="scaleZ"
        size="large"
        :step="0.5"
        :slider="true"
        :range="[1, 100]"
        label="拉伸级别"
      />
      <mapgis-ui-form-item label="偏移量">
        <mapgis-ui-input-number-addon
          v-model.number="offset"
          :step="0.5"
          addon-after="米"
        />
      </mapgis-ui-form-item>
    </mapgis-ui-switch-panel> -->
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
      // m3dSetObj: {
      //   longitude: undefined,
      //   latitude: undefined,
      //   height: undefined,
      //   zmax: undefined,
      //   zmin: undefined,
      // },
      offset: -2,
    }
  },
  watch: {
    document: {
      handler: 'getScenes',
      immediate: true,
      deep: true,
    },
    layer: {
      handler() {
        if (!this.active) {
          return
        }
        this.changeLayer(this.layer)
      },
      deep: true,
      immediate: true,
    },
    scaleZ: {
      handler() {
        this.changeScaleZ(this.scaleZ, this.offset)
      },
      deep: true,
    },
    enableModelStretch: {
      handler(val) {
        if (!val) {
          this.updateModelReset()
        }
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
        this.layer = layers
        this.layer = null
      }
    },
    /**
     * 切换三维数据
     */
    // changeLayer() {
    //   if (!this.isActive || !this.layer) return

    //   const { vueKey, Cesium, viewer, vueCesium, layer } = this
    //   const { id } = layer
    //   const g3dLayer = this.getG3dLayer()
    //   const m3dSet = g3dLayer.getM3DLayers()[0]
    //   // m3dSet.debugShowBoundingVolume = true
    //   // const center = window.transformEditor._centers[0]
    //   const initTransform = m3dSet._transform
    //   // 模型的自身坐标系原点
    //   const cartographic = Cesium.Cartographic.fromCartesian(
    //     new Cesium.Cartesian3(
    //       initTransform[12],
    //       initTransform[13],
    //       initTransform[14]
    //     )
    //   )
    //   const longitude = Cesium.Math.toDegrees(cartographic.longitude)
    //   const latitude = Cesium.Math.toDegrees(cartographic.latitude)
    //   const height = cartographic.height // 模型高度
    //   const zmin = m3dSet._root.boundingVolume.minimumHeight
    //   // const zmax = 4.5
    //   const zmax = m3dSet._root.boundingVolume.maximumHeight
    //   this.m3dSetObj = { longitude, latitude, height, zmax, zmin }
    //   if (window.modelEditControlList && window.modelEditControlList[id]) {
    //     window.transformEditor = window.modelEditControlList[id]
    //   } else {
    //     window.transformEditor = new Cesium.ModelTransformTool(g3dLayer)
    //     window.transformEditor.initModelEditor(viewer)
    //     window.modelEditControlList[id] = window.transformEditor
    //   }
    // },
    // getG3dLayer() {
    //   const { vueKey, viewer, vueCesium, layer } = this
    //   const { id } = layer
    //   const sceneLayer = vueCesium.G3DManager.findSource(
    //     vueKey || 'default',
    //     id
    //   )
    //   const { m3ds, g3dLayerIndex } = sceneLayer.options
    //   const g3dLayer = viewer.scene.layers.getLayer(g3dLayerIndex)
    //   return g3dLayer
    // },
    // changeScaleZ() {
    //   if (window.transformEditor) {
    //     window.transformEditor.setScala(1, 1, this.scaleZ)
    //     const { longitude, latitude, height, zmax, zmin } = this.m3dSetObj
    //     // 计算顶部到原点距离
    //     const originToTop = zmax + this.offset - height
    //     // 计算向下平移的距离,记得最后加上负号
    //     const downHeight = originToTop * this.scaleZ + height
    //     // const m3dSetHeight = zmax - height
    //     // const downHeight = m3dSetHeight * (this.scaleZ - 1)
    //     window.transformEditor.setTranslation(longitude, latitude, -downHeight)
    //   }
    // },
    onActive() {
      this.isActive = true
    },
    // updateModelReset() {
    //   if (!window.transformEditor) {
    //     return
    //   }
    //   window.transformEditor.deactivate()
    //   window.transformEditor.reset()
    // },
    /**
     * 打开模块
     */
    onOpen() {
      this.isActive = true
      this.changeLayer(this.layer)
    },
    /**
     * 关闭模块
     */
    onClose() {
      this.isActive = false
      window.modelEditControlList = undefined
      this.updateModelReset()
    },
  },
}
</script>
