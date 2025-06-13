import {
  LayerType,
  ModelPickController,
  Rectangle3D,
  Point3D,
  Exhibition,
  ExhibitionControllerMixin,
  Feature,
  baseConfigInstance,
  eventBus,
  events,
  UUID,
} from '@mapgis/web-app-framework'
import { lineString, polygon, point, multiPolygon } from '@turf/helpers'
import booleanDisjoint from '@turf/boolean-disjoint'
import booleanContains from '@turf/boolean-contains'
import * as Zondy from '@mapgis/webclient-es6-service'
import featureQueryMixin from './feature-query-mixin'

import QueryType from './query-type'

const { AttributeTableListExhibition } = Exhibition
const { FeatureQuery } = Feature

export default {
  mixins: [ExhibitionControllerMixin, featureQueryMixin],
  data() {
    return {
      layerRelation: {},
      openPickLayers: [],
      hasHander: false,
      popupInfo: undefined,
    }
  },
  computed: {},
  watch: {
    is2DMapMode: {
      deep: true,
      handler(newValue) {
        this.popupInfo = undefined
      },
    },
  },
  methods: {
    /**
     * 更新支持拾取的图层集合，在图层管理微件中，对document的监听中调用
     * @date 26/02/2025
     * @author 龚跃健
     * @param {*} layers
     */
    resetPickLayers(layers) {
      const pickLayer = layers.filter((layer) =>
        [
          LayerType.IGSScene,
          LayerType.ModelCache,
          LayerType.IGSMapImage,
          LayerType.IGSVector,
        ].includes(layer.type)
      )

      // 记录父子图层节点关系
      this.layerRelation = {}
      // 组装数据，支持拾取(可以显示拾取开关，不管是否开启)的图层集合，
      const pickArr = []
      // 开启拾取的图层集合,必须支持拾取，并且已开启拾取
      const openPickArr = []
      pickLayer.forEach((layer) => {
        this.layerRelation[layer.id] = []
        const openObj = {
          isOpen: false,
        }
        const childLayer = []
        if (
          layer.type !== LayerType.IGSVector &&
          layer.sublayers &&
          layer.sublayers.length > 0
        ) {
          this.getLayerRelation(layer.sublayers, childLayer, openObj)
        } else {
          openObj.isOpen = layer.layerProperty?.enablePopup
        }

        this.layerRelation[layer.id] = childLayer
        const pick = {
          key: layer.id,
          title: layer.title,
          value: openObj.isOpen,
        }
        pickArr.push(pick)
        // 这里暂时只管地图服务和图层地图服务(简单要素类)的拾取
        if (
          [LayerType.IGSMapImage, LayerType.IGSVector].includes(layer.type) &&
          openObj.isOpen
        ) {
          openPickArr.push(pick)
        }
      })
      ModelPickController.pickLayers = pickArr
      this.openPickLayers = openPickArr
      const { Cesium, viewer, map } = this
      const self = this
      if (openPickArr.length > 0) {
        if (this.hasHander) {
          return
        }
        // 添加鼠标左键点击监听
        this.cesiumHandler.setInputAction(function (movement) {
          if (ModelPickController.unablePick) {
            return
          }
          const position = movement.position || movement.endPosition
          const cartesian = viewer.getCartesian3Position(position)
          const tempRay = new Cesium.Ray()
          const tempPos = new Cesium.Cartesian3()
          const { scene } = viewer
          const ray = scene.camera.getPickRay(position, tempRay)
          const cartesian2 = scene.globe.pick(ray, scene, tempPos)

          let longitudeString2
          let latitudeString2
          let heightString2

          if (Cesium.defined(cartesian2)) {
            const cartographic2 = Cesium.Cartographic.fromCartesian(cartesian)
            longitudeString2 = Cesium.Math.toDegrees(cartographic2.longitude)
            latitudeString2 = Cesium.Math.toDegrees(cartographic2.latitude)
            heightString2 = cartographic2.height
            const shape = {
              x: longitudeString2,
              y: latitudeString2,
              z: heightString2,
            }
            self.queryLayers(shape)
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        map.on('click', self.mapClick)
        this.hasHander = true
      } else {
        if (!this.hasHander) {
          return
        }
        // 移除鼠标左键点击监听
        this.cesiumHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        )
        map.off('click', self.mapClick)
        this.hasHander = false
      }
    },
    /**
     * 二维视图点击事件
     * @param e
     * @returns
     */
    mapClick(e) {
      if (ModelPickController.unablePick) {
        return
      }
      const lngLat = e.lngLat
      const shape = {
        x: lngLat.lng,
        y: lngLat.lat,
      }
      this.queryLayers(shape)
    },
    /**
     * pickLayers上挂在子图层，从拾取微件中移植过来
     * @date 26/02/2025
     * @author 龚跃健
     * @param {*} layers
     * @param {*} childLayer
     * @param {*} openObj
     */
    getLayerRelation(layers, childLayer, openObj) {
      layers.forEach((layer) => {
        childLayer.push(layer.id)

        if (!openObj.isOpen) {
          openObj.isOpen = layer.layer
            ? layer.layer.layerProperty?.enablePopup
            : layer.layerProperty?.enablePopup
        }
        if (layer.layer) {
          return
        }
        if (layer.sublayers && layer.sublayers.length > 0) {
          this.getLayerRelation(layer.sublayers, childLayer, openObj.isOpen)
        }
      })
    },
    getQueryLayers(shape) {
      const document = this.document || this.layerDocument
      if (!document) {
        return
      }

      const layers = document.defaultMap.layers()
      const queryLayers = []
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        const openPickLayer = this.openPickLayers.find(
          (change) => change.key === layer.id
        )
        if (
          !openPickLayer ||
          ![LayerType.IGSVector, LayerType.IGSMapImage].includes(layer.type)
        ) {
          continue
        }
        if (!this.isCrossWithLayer(layer, shape, QueryType.Point)) {
          continue
        }
        // fix(6188): 三维视图倾斜一定角度，绘制交互异常
        // 修改人: 杨琨 2024-9-2
        // 修改说明: 重构计算缓冲半径的逻辑，
        // 通过缓冲半径单位，将用户设置的缓冲半径值，转化为服务需要的缓冲半径值
        // 默认单位为像素，根据分辨率计算一像素代表多少米，之后换算为服务端需要的缓冲半径值
        // 其他可选单位为千米、米、厘米，当前仅支持经纬度坐标系图层的要素查询
        const nearDistance = baseConfigInstance.config.nearDistance
        const nearDis = this.getNearDistance(shape, layer, nearDistance)

        const geometry = this.toQueryGeometry(
          layer,
          shape,
          nearDis,
          QueryType.Point
        )
        queryLayers.push({ layer, queryGeometry: geometry })
      }
      return queryLayers
    },
    /**
     * 拾取查询
     * @param shape 查询范围
     * @returns
     */
    async queryLayers(shape) {
      this.popupInfo = undefined
      const queryLayers = this.getQueryLayers(shape)
      if (!queryLayers || !queryLayers.length) {
        return
      }
      const { layer, queryGeometry } = queryLayers[queryLayers.length - 1]
      const { domain, docName } = layer._parseUrl(layer.url)
      const isDataStoreQuery = false
      const DNSName = undefined
      const ipPortObj = this.getIpPort({
        isDataStoreQuery,
      })
      const option = {
        DNSName,
        isDataStoreQuery,
        domain,
        ...ipPortObj,
        gdbp: layer.type === LayerType.IGSVector ? layer.gdbps : undefined,
        layerIdxs: '*',
        docName: docName,
        geometry: queryGeometry,
        coordPrecision: 8,
      }
      let properties
      const results = await FeatureQuery.query(option)
      if (!results) {
        return
      }
      let geojson
      let sublayerId
      if (results.value && results.value.length) {
        for (let i = results.value.length - 1; i >= 0; i--) {
          const res = results.value[i]
          if (res.features && res.features.length > 0) {
            geojson = res.features[0]
            sublayerId = res.layerId
            break
          }
        }
      } else if (results.features && results.features.length > 0) {
        geojson = results.features[0]
        sublayerId = results.layerId
      }
      let layerTitle = layer.title
      if (sublayerId && layer.sublayers && layer.sublayers.length) {
        const sublayer = this.getSublayerById(sublayerId, layer.sublayers)
        if (sublayer) {
          layerTitle = sublayer.title
        }
      }
      if (geojson && geojson.properties) {
        properties = { title: layerTitle, ...geojson.properties }
      }

      const pickInfo = {
        layerId: layer.id,
        sublayerId,
        queryLayers,
        position: {
          height: shape.z,
          latitude: shape.y,
          longitude: shape.x,
        },
        properties,
      }

      eventBus.$emit(events.SEND_MODEL_PICK_INFO, pickInfo)

      if (!geojson) {
        return
      }

      let showPopup = true
      if (layer.layerProperty.extensions) {
        const extensions = JSON.parse(layer.layerProperty.extensions)
        showPopup = extensions.showPopup
      }
      if (showPopup) {
        // 显示弹框表示在一张图中显示拾取的属性信息
        this.popupInfo = {
          id: UUID.uuid(),
          coordinates: [shape.x, shape.y, shape.z],
          fid: geojson.properties?.FID,
          properties,
          feature: geojson,
        }
      }
    },
    /**
     * 根据子图层id获取子图层对象
     * @param sublayerId 子图层id
     * @param sublayers 子图层数组
     * @returns
     */
    getSublayerById(sublayerId, sublayers) {
      let sublayer
      if (!sublayers || !sublayers.length) {
        return
      }
      for (let i = 0; i < sublayers.length; i++) {
        const layer = sublayers[i]
        if (layer.id === sublayerId) {
          sublayer = layer
          break
        } else if (layer.sublayers && layer.sublayers.length) {
          sublayer = this.getSublayerById(sublayerId, layer.sublayers)
          if (sublayer) {
            break
          }
        }
      }
      return sublayer
    },
  },
}
