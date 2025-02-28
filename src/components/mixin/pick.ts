import {
  LayerType,
  ModelPickController,
  Rectangle3D,
  Point3D,
  Exhibition,
  ExhibitionControllerMixin,
  Feature,
  baseConfigInstance,
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
    }
  },
  computed: {},
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
      pickLayer.forEach((layer) => {
        if (LayerType.IGSScene === layer.type && layer.activeScene) {
          layer.sublayers = layer.activeScene.sublayers.map((row) => ({
            ...row,
          }))
        }
      })
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
        //添加鼠标左键点击监听
        this.cesiumHandler.setInputAction(function (movement) {
          if (ModelPickController.unablePick) {
            return
          }
          let position = movement.position || movement.endPosition
          let cartesian = viewer.getCartesian3Position(position)
          let tempRay = new Cesium.Ray()
          let tempPos = new Cesium.Cartesian3()
          const { scene } = viewer
          let ray = scene.camera.getPickRay(position, tempRay)
          let cartesian2 = scene.globe.pick(ray, scene, tempPos)

          let longitudeString2, latitudeString2, heightString2

          if (Cesium.defined(cartesian2)) {
            let cartographic2 = Cesium.Cartographic.fromCartesian(cartesian)
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
        //移除鼠标左键点击监听
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
    /**
     * 拾取查询
     * @param shape 查询范围
     * @returns
     */
    queryLayers(shape) {
      const document = this.document || this.layerDocument
      if (!document) {
        return
      }

      const layers = document.defaultMap.layers()
      const self = this
      this.openPickLayers.forEach((item) => {
        const layer = layers.find((change) => change.id === item.key)
        if (!self.isCrossWithLayer(layer, shape, QueryType.Point)) {
          return
        }

        // fix(6188): 三维视图倾斜一定角度，绘制交互异常
        // 修改人: 杨琨 2024-9-2
        // 修改说明: 重构计算缓冲半径的逻辑，
        // 通过缓冲半径单位，将用户设置的缓冲半径值，转化为服务需要的缓冲半径值
        // 默认单位为像素，根据分辨率计算一像素代表多少米，之后换算为服务端需要的缓冲半径值
        // 其他可选单位为千米、米、厘米，当前仅支持经纬度坐标系图层的要素查询
        const nearDistance = baseConfigInstance.config.nearDistance
        const nearDis = self.getNearDistance(shape, layer, nearDistance)

        const geometry = self.toQueryGeometry(
          layer,
          shape,
          nearDis,
          QueryType.Point
        )

        switch (layer.type) {
          // IGSVector跟IGSMapImage走相同逻辑
          case LayerType.IGSVector:
          case LayerType.IGSMapImage:
            self.queryFeaturesByDoc(layer, geometry)
            break
        }
      })
    },
  },
}
