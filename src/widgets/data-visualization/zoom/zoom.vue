<template>
  <div class="mp-widget-zoom">
    <mapgis-ui-tooltip
      title="放大"
      placement="right"
      :overlay-style="{ zIndex: 1000 }"
    >
      <div class="zoom-in button" @click="onZoomIn">
        <mapgis-ui-iconfont type="mapgis-plus" />
      </div>
    </mapgis-ui-tooltip>
    <mapgis-ui-tooltip
      title="缩小"
      placement="right"
      :overlay-style="{ zIndex: 1000 }"
    >
      <div class="zoom-out button" @click="onZoomOut">
        <mapgis-ui-iconfont type="mapgis-minus" />
      </div>
    </mapgis-ui-tooltip>
    <mapgis-ui-tooltip
      title="重置"
      placement="right"
      :overlay-style="{ zIndex: 1000 }"
    >
      <div class="button" @click="onRestore">
        <mapgis-ui-iconfont type="mapgis-home" />
      </div>
    </mapgis-ui-tooltip>
  </div>
</template>

<script lang="ts">
import {
  Objects,
  WidgetMixin,
  FitBound,
  LayerType,
  UUID,
  api,
  baseConfigInstance,
  DataCatalogManager,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpZoom',
  mixins: [WidgetMixin],
  watch: {
    is2DMapMode: {
      handler: 'is2DMapModeChange',
      immediate: true,
    },
  },

  data() {
    return {
      defaultCameraView: {
        destination: {
          x: -8579846.669255955,
          y: 20871852.812287178,
          z: 16141755.871903004,
        },
        orientation: {
          heading: 0.03209985611581789,
          pitch: -1.5635848496585378,
          roll: 0,
        },
        positionWC: {
          x: -8579846.66925595,
          y: 20871852.812287178,
          z: 16141755.871903006,
        },
      },
      cameraView: null,
      mapBounds: null,
    }
  },

  created() {
    this.sceneController = Objects.SceneController.getInstance(
      this.Cesium,
      this.vueCesium,
      this.viewer
    )
  },

  methods: {
    is2DMapModeChange(mode2D) {
      if (!mode2D) {
        if (this.viewer && !this.cameraView) {
          // fixme 目前的首次加载的初始视角效果不好，先使用defaultCameraView视角做重置视角
          // this.cameraView = this.viewer.camera.getView()
          this.cameraView = this.defaultCameraView
        }
      } else if (this.map && !this.mapBounds) {
        this.mapBounds = this.map.getBounds()
      }
    },

    async onRestore() {
      if (this.is2DMapMode) {
        // mapbox如果有旋转，恢复到平面模式
        this.map.resetNorthPitch({ duration: 100 })
      }
      const { initPositionMode } = baseConfigInstance.config
      const { Cesium, map, vueCesium, viewer } = this
      const mapParams = { Cesium, map, vueCesium, viewer }
      switch (initPositionMode) {
        // 根据范围重置
        case 'initExtent':
          const { xmin, ymin, xmax, ymax } = baseConfigInstance.config
          const bound = { xmin, ymin, xmax, ymax }
          this.initFitBound(bound, mapParams)
          break
        // 根据位置重置
        case 'initPosition':
          const {
            center,
            initZoom: zoom,
            initAltitude: cameraHeight,
          } = baseConfigInstance.config
          const x = center.split(',')[0]
          const y = center.split(',')[1]
          if (this.is2DMapMode) {
            setTimeout(() => {
              this.map.flyTo({
                center: [x, y],
                zoom,
              })
            }, 300)
          } else {
            const center = new Cesium.Cartesian3.fromDegrees(x, y, cameraHeight)
            viewer.camera.flyTo({
              destination: center,
            })
          }
          break
        case 'basemapExtent':
        default:
          /**
           * 修改说明：重置范围使用索引底图的范围
           * 修改人：龚跃健
           * 修改日期：2021/12/23
           */
          const config = await api.getWidgetConfig('basemap-manager')
          // 获取地图底图
          const baseMap = config.baseMapList.find(
            (item) => item.guid === config.indexBaseMapGUID
          )
          if (baseMap && baseMap.children && baseMap.children.length > 0) {
            // 如果索引底图下有多个图层，默认只缩放到第一个图层的范围
            const layer = baseMap.children[0]
            const mapLayer = DataCatalogManager.generateLayerByConfig(
              this.formatLayer(layer)
            )
            await mapLayer.load()
            this.fitBounds(mapLayer)
          } else {
            // 默认中国范围，与cesium的goHome()范围保持一致
            this.initFitBound(
              { xmin: 73, ymin: 3, xmax: 135, ymax: 53 },
              mapParams
            )
          }
          break
      }
    },

    initFitBound(bound, mapParams) {
      if (this.is2DMapMode) {
        setTimeout(() => {
          FitBound.fitBound2D(bound, mapParams)
        }, 300)
      } else {
        FitBound.fitBound3D(bound, mapParams)
      }
    },

    formatLayer(layer) {
      const layerConfig = {
        name: layer.name,
        guid: UUID.uuid(),
        serverURL: layer.url,
        serverType: this.parseLayerType(layer.type),
      }
      if (layer.token) {
        layerConfig.tokenValue = layer.token
        layerConfig.tokenKey = layer.tokenKey ? layer.tokenKey : 'token'
      }
      return layerConfig
    },

    parseLayerType(typeString) {
      const type = LayerType[typeString]
      if (type === undefined) {
        return LayerType.Unknown
      }

      return type
    },

    fitBounds(item) {
      const { Cesium, map, vueCesium, viewer } = this
      const isOutOfRange = FitBound.fitBoundByLayer(
        item,
        {
          Cesium,
          map,
          viewer,
          vueCesium,
        },
        this.is2DMapMode
      )
      if (isOutOfRange) {
        this.$message.error('初始底图范围有误，已调整为经纬度最大范围')
      }
    },

    onZoomIn() {
      if (this.is2DMapMode) {
        if (this.map) {
          this.map.zoomIn()
        }
      } else {
        this.ZoomCesiumView('zoomIn')
      }
    },

    onZoomOut() {
      if (this.is2DMapMode) {
        if (this.map) {
          this.map.zoomOut()
        }
      } else {
        this.ZoomCesiumView('zoomOut')
      }
    },

    // 三维视图的缩放功能
    ZoomCesiumView(type) {
      // 获取当前镜头位置的笛卡尔坐标
      const cameraPos = this.viewer.camera.position
      // 获取当前坐标系标准
      const ellipsoid = this.viewer.scene.globe.ellipsoid
      // 根据坐标系标准，将笛卡尔坐标转换为地理坐标
      const cartographic = ellipsoid.cartesianToCartographic(cameraPos)
      // 获取镜头的高度
      const height = cartographic.height

      // 根据上面当前镜头的位置，获取该中心位置的经纬度坐标
      const centerLon = parseFloat(
        this.Cesium.Math.toDegrees(cartographic.longitude).toFixed(8)
      )
      const centerLat = parseFloat(
        this.Cesium.Math.toDegrees(cartographic.latitude).toFixed(8)
      )
      if (type === 'zoomIn') {
        this.viewer.camera.flyTo({
          destination: this.Cesium.Cartesian3.fromDegrees(
            centerLon,
            centerLat,
            height / 1.8
          ),
          duration: 1.0,
        })
      } else if (type === 'zoomOut') {
        this.viewer.camera.flyTo({
          destination: this.Cesium.Cartesian3.fromDegrees(
            centerLon,
            centerLat,
            height * 1.8
          ),
          duration: 1.0,
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-zoom {
  background: $base-bg-color;
  color: $text-color;
  border-radius: 2px;
  line-height: 32px;
  font-size: 16px;
  box-shadow: 0px 1px 2px 0px $shadow-color;
  //box-shadow: 0px 1px 2px 0px @shadow-color; rgba(0,0,0,0.3)
  text-align: center;
  .button {
    width: 32px;
    height: 32px;
    cursor: pointer;
    &:hover {
      color: $primary-color;
    }
    &:not(:last-of-type) {
      border-bottom: 1px solid $btn-default-border;
    }
  }
}
</style>
