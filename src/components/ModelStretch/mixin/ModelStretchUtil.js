import {
  LayerType,
  IGSSceneSublayerType,
  ModelCacheFormat,
} from '@mapgis/web-app-framework'
import ModelEditControlList from '../model-edit-control-list'

export default {
  data() {
    return {
      m3dSetObj: {
        longitude: undefined,
        latitude: undefined,
        height: undefined,
        zmax: undefined,
        zmin: undefined,
      },
    }
  },
  computed: {},
  methods: {
    isModelCache(layerObj) {
      const layer = layerObj.layer ? layerObj.layer : layerObj
      if (layer.type === LayerType.IGSScene) {
        if (layer.activeScene) {
          const { type } = layer.activeScene.sublayers[0]
          if (type === IGSSceneSublayerType.modelCache) {
            // 模型拉伸只支持模型
            return true
          }
        }
      } else if (
        layer.type === LayerType.ModelCache &&
        layer.format === ModelCacheFormat.m3d
      ) {
        return true
      }
      return false
    },
    changeLayer(layer) {
      if (!layer) return
      if (!this.isModelCache(layer)) {
        return
      }
      const { vueKey, Cesium, viewer, vueCesium } = this
      const { id } = layer
      let layerId = layer.id
      if (id.includes(':')) {
        layerId = id.split(':')[0]
      }
      if (
        ModelEditControlList[layerId] &&
        ModelEditControlList[layerId]._layer &&
        ModelEditControlList[layerId]._layer.tilesLoaded
      ) {
        window.transformEditor = ModelEditControlList[layerId]
        this.m3dSetObj = ModelEditControlList[layerId].m3dSetObj
      } else {
        // 增加延时，防止分析过程中，从数据目录中取消勾选数据，再次勾选，数据还没加到视图中的时候，就去获取数据，导致获取M3D失败
        setTimeout(() => {
          let m3dSet
          let { type } = layer
          if (layer.layer) {
            type = layer.layer.type
          }
          if (type === LayerType.IGSScene) {
            m3dSet = this.getSceneLayer3DSet(layer.id)
          } else if (type === LayerType.ModelCache) {
            m3dSet = this.getM3DSet(layerId)
          }
          window.transformEditor = new zondy.cesium.ModelTransformTool(m3dSet)
          window.transformEditor.initModelEditor(viewer)
          ModelEditControlList[layerId] = window.transformEditor
          const initTransform = m3dSet._transform
          // 模型的自身坐标系原点
          const cartographic = Cesium.Cartographic.fromCartesian(
            new Cesium.Cartesian3(
              initTransform[12],
              initTransform[13],
              initTransform[14]
            )
          )
          const longitude = Cesium.Math.toDegrees(cartographic.longitude)
          const latitude = Cesium.Math.toDegrees(cartographic.latitude)
          const height = cartographic.height // 模型高度
          const zmin = m3dSet._root.boundingVolume.minimumHeight
          // const zmax = 4.5
          const zmax = m3dSet._root.boundingVolume.maximumHeight
          this.m3dSetObj = { longitude, latitude, height, zmax, zmin }
          ModelEditControlList[layerId].m3dSetObj = this.m3dSetObj
        }, 1000)
      }
    },
    // 获取场景图层的M3DSet
    getSceneLayer3DSet(id) {
      const { vueKey, viewer, vueCesium } = this
      let layerId = id
      let layerIndex = 0
      if (id.includes(':')) {
        layerId = id.split(':')[0]
        layerIndex = id.split(':')[1]
      }
      const sceneLayer = vueCesium.G3DManager.findSource(
        vueKey || 'default',
        layerId
      )
      if (sceneLayer && sceneLayer.source && sceneLayer.source[layerIndex]) {
        return sceneLayer.source[layerIndex].source
      }
      return null
    },
    getM3DSet(id) {
      const { vueKey, viewer, vueCesium } = this
      let layerId = id
      if (id.includes(':')) {
        layerId = id.split(':')[0]
      }
      const m3dLayer = vueCesium.M3DIgsManager.findSource(
        vueKey || 'default',
        layerId
      )
      if (!m3dLayer) {
        const Tiles3DLayer = vueCesium.Tileset3DManager.findSource(
          vueKey || 'default',
          layerId
        )
        if (Tiles3DLayer) {
          return Tiles3DLayer.source
        } else {
          return null
        }
      }
      return m3dLayer.source[0]
    },
    changeScaleZ(scaleZ, offset, id) {
      if (
        window.transformEditor &&
        window.transformEditor._layer &&
        window.transformEditor._layer.tilesLoaded
      ) {
        window.transformEditor.setScala(1, 1, scaleZ)
        const { longitude, latitude, height, zmax, zmin } = this.m3dSetObj
        // 计算顶部到原点距离
        const originToTop = zmax + offset - height
        // 计算向下平移的距离,记得最后加上负号
        const downHeight = originToTop * scaleZ + height
        window.transformEditor.setTranslation(longitude, latitude, -downHeight)
      }
    },
    // 1、现有接口只针对平铺纹理；2、顶部和底部纹理可能会变形。
    changeTextureScale(scaleXY, scaleZ, id) {
      const m3dSet = this.getSceneLayer3DSet(id)
      m3dSet.textureCoordScale = new this.Cesium.Cartesian2(scaleXY, scaleZ)
    },
    updateModelReset() {
      if (
        window.transformEditor &&
        window.transformEditor._layer &&
        window.transformEditor._layer.tilesLoaded
      ) {
        this.updateModelDeactivate()
        window.transformEditor.reset()
      }
    },
    updateModelDeactivate() {
      window.transformEditor.deactivate()
    },
  },
}
