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
    changeLayer(layer) {
      if (!layer) return

      const { vueKey, Cesium, viewer, vueCesium } = this
      const { id } = layer
      const g3dLayer = this.getG3dLayer(id)
      const m3dSet = g3dLayer.getM3DLayers()[0]
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
      if (window.modelEditControlList && window.modelEditControlList[id]) {
        window.transformEditor = window.modelEditControlList[id]
      } else {
        window.transformEditor = new Cesium.ModelTransformTool(g3dLayer)
        window.transformEditor.initModelEditor(viewer)
        window.modelEditControlList[id] = window.transformEditor
      }
    },
    getG3dLayer(id) {
      const { vueKey, viewer, vueCesium } = this
      let layerId = id
      if (id.includes(':')) {
        layerId = id.split(':')[0]
      }
      const sceneLayer = vueCesium.G3DManager.findSource(
        vueKey || 'default',
        layerId
      )
      const { m3ds, g3dLayerIndex } = sceneLayer.options
      const g3dLayer = viewer.scene.layers.getLayer(g3dLayerIndex)
      return g3dLayer
    },
    changeScaleZ(scaleZ, offset) {
      if (window.transformEditor) {
        window.transformEditor.setScala(1, 1, scaleZ)
        const { longitude, latitude, height, zmax, zmin } = this.m3dSetObj
        // 计算顶部到原点距离
        const originToTop = zmax + offset - height
        // 计算向下平移的距离,记得最后加上负号
        const downHeight = originToTop * scaleZ + height
        window.transformEditor.setTranslation(longitude, latitude, -downHeight)
      }
    },
    updateModelReset() {
      if (!window.transformEditor) {
        return
      }
      this.updateModelDeactivate()
      window.transformEditor.reset()
    },
    updateModelDeactivate() {
      window.transformEditor.deactivate()
    },
  },
}
