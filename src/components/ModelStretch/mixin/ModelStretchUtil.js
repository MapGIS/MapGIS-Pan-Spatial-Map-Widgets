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
      } else if (layer.type === LayerType.ModelCache) {
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
        ModelEditControlList[layerId]._layer.ready
      ) {
        window.transformEditor = ModelEditControlList[layerId]
        this.m3dSetObj = ModelEditControlList[layerId].m3dSetObj
      } else {
        // 增加延时，防止分析过程中，从数据目录中取消勾选数据，再次勾选，数据还没加到视图中的时候，就去获取数据，导致获取M3D失败
        setTimeout(() => {
          let m3dSet
          if (layer.type === LayerType.IGSScene) {
            m3dSet = this.getSceneLayer3DSet(layerId)
          } else if (layer.type === LayerType.ModelCache) {
            m3dSet = this.getM3DSet(layerId)
          }
          window.transformEditor = new Cesium.ModelTransformTool(m3dSet)
          window.transformEditor.initModelEditor(viewer)
          ModelEditControlList[layerId] = window.transformEditor
          const initTransform = m3dSet._transform || m3dSet._root.transform

          const { longitude, latitude, height } = this.toDegrees(
            // 模型的自身坐标系原点
            new Cesium.Cartesian3(
              initTransform[12],
              initTransform[13],
              initTransform[14]
            )
          )
          let zmin = m3dSet._root.boundingVolume.minimumHeight
          let zmax = m3dSet._root.boundingVolume.maximumHeight
          if (
            (zmin == undefined || zmax == undefined) &&
            m3dSet._root.boundingVolume._orientedBoundingBox
          ) {
            // 如果不存在minimumHeight或者maximumHeight，则使用中心点的z加减radius计算zmin和zmax
            const corners = this.computeCorners(
              m3dSet._root.boundingVolume._orientedBoundingBox
            )
            corners.sort((a, b) => a.height - b.height)
            zmin = corners[0].height
            zmax = corners[corners.length - 1].height
          }
          // const zmax = 4.5
          this.m3dSetObj = { longitude, latitude, height, zmax, zmin }
          ModelEditControlList[layerId].m3dSetObj = this.m3dSetObj
        }, 1000)
      }
    },
    /**
     * 将笛卡尔坐标转经纬度坐标
     * @param {*} cartesian3
     * @returns
     */
    toDegrees(cartesian3) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian3)
      const longitude = Cesium.Math.toDegrees(cartographic.longitude)
      const latitude = Cesium.Math.toDegrees(cartographic.latitude)
      const height = cartographic.height // 模型高度
      return { longitude, latitude, height }
    },
    /**
     * Computes the eight corners of an oriented bounding box. The corners are ordered by (-X, -Y, -Z), (-X, -Y, +Z), (-X, +Y, -Z), (-X, +Y, +Z), (+X, -Y, -Z), (+X, -Y, +Z), (+X, +Y, -Z), (+X, +Y, +Z).
     *
     * @param {OrientedBoundingBox} box The oriented bounding box.
     * @param {Cartesian3[]} [result] An array of eight {@link Cartesian3} instances onto which to store the corners.
     * @returns {Cartesian3[]} The modified result parameter or a new array if none was provided.
     */
    computeCorners(box) {
      const { Cesium } = this
      const scratchXAxis = new Cesium.Cartesian3()
      const scratchYAxis = new Cesium.Cartesian3()
      const scratchZAxis = new Cesium.Cartesian3()

      const result = [
        new Cesium.Cartesian3(),
        new Cesium.Cartesian3(),
        new Cesium.Cartesian3(),
        new Cesium.Cartesian3(),
        new Cesium.Cartesian3(),
        new Cesium.Cartesian3(),
        new Cesium.Cartesian3(),
        new Cesium.Cartesian3(),
      ]

      const center = box.center
      const halfAxes = box.halfAxes
      const xAxis = Cesium.Matrix3.getColumn(halfAxes, 0, scratchXAxis)
      const yAxis = Cesium.Matrix3.getColumn(halfAxes, 1, scratchYAxis)
      const zAxis = Cesium.Matrix3.getColumn(halfAxes, 2, scratchZAxis)

      Cesium.Cartesian3.clone(center, result[0])
      Cesium.Cartesian3.subtract(result[0], xAxis, result[0])
      Cesium.Cartesian3.subtract(result[0], yAxis, result[0])
      Cesium.Cartesian3.subtract(result[0], zAxis, result[0])
      result[0] = this.toDegrees(result[0])

      Cesium.Cartesian3.clone(center, result[1])
      Cesium.Cartesian3.subtract(result[1], xAxis, result[1])
      Cesium.Cartesian3.subtract(result[1], yAxis, result[1])
      Cesium.Cartesian3.add(result[1], zAxis, result[1])
      result[1] = this.toDegrees(result[1])

      Cesium.Cartesian3.clone(center, result[2])
      Cesium.Cartesian3.subtract(result[2], xAxis, result[2])
      Cesium.Cartesian3.add(result[2], yAxis, result[2])
      Cesium.Cartesian3.subtract(result[2], zAxis, result[2])
      result[2] = this.toDegrees(result[2])

      Cesium.Cartesian3.clone(center, result[3])
      Cesium.Cartesian3.subtract(result[3], xAxis, result[3])
      Cesium.Cartesian3.add(result[3], yAxis, result[3])
      Cesium.Cartesian3.add(result[3], zAxis, result[3])
      result[3] = this.toDegrees(result[3])

      Cesium.Cartesian3.clone(center, result[4])
      Cesium.Cartesian3.add(result[4], xAxis, result[4])
      Cesium.Cartesian3.subtract(result[4], yAxis, result[4])
      Cesium.Cartesian3.subtract(result[4], zAxis, result[4])
      result[4] = this.toDegrees(result[4])

      Cesium.Cartesian3.clone(center, result[5])
      Cesium.Cartesian3.add(result[5], xAxis, result[5])
      Cesium.Cartesian3.subtract(result[5], yAxis, result[5])
      Cesium.Cartesian3.add(result[5], zAxis, result[5])
      result[5] = this.toDegrees(result[5])

      Cesium.Cartesian3.clone(center, result[6])
      Cesium.Cartesian3.add(result[6], xAxis, result[6])
      Cesium.Cartesian3.add(result[6], yAxis, result[6])
      Cesium.Cartesian3.subtract(result[6], zAxis, result[6])
      result[6] = this.toDegrees(result[6])

      Cesium.Cartesian3.clone(center, result[7])
      Cesium.Cartesian3.add(result[7], xAxis, result[7])
      Cesium.Cartesian3.add(result[7], yAxis, result[7])
      Cesium.Cartesian3.add(result[7], zAxis, result[7])
      result[7] = this.toDegrees(result[7])

      return result
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
      const { m3ds, g3dLayerIndex } = sceneLayer.options
      return m3ds.find((m3d) => Number(m3d._layerIndex) === Number(layerIndex))
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
        window.transformEditor._layer.ready
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
      let m3dSet = this.getM3DSet(id)
      if (!m3dSet) {
        m3dSet = this.getSceneLayer3DSet(id)[0]
      }
      m3dSet.textureCoordScale = new this.Cesium.Cartesian2(scaleXY, scaleZ)
    },
    updateModelReset() {
      if (
        window.transformEditor &&
        window.transformEditor._layer &&
        window.transformEditor._layer.ready
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
