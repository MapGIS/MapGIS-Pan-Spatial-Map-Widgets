<template>
  <div>
    <mapgis-3d-dynamic-marker-layer
      v-if="!cluster"
      :data="getMarkerGeoJson()"
      :selects="hoverMarker"
      :highlight="false"
      :layerStyle="layerStyle"
      :highlightStyle="highlightStyle"
      :popupShowType="popupShowType"
      :popupToggleType="popupToggleType"
      :popupAnchor="popupAnchor"
      :field-configs="fieldConfigs"
      @show-popup="showPopup"
      idField="markerId"
    />
    <mapgis-3d-cesium-custer-layer
      v-else-if="geojson && geojson.features && !!geojson.features.length"
      :geojson="geojson"
      :clusterStyle="clusterStyle"
    />
  </div>
</template>

<script lang="ts">
import { Style } from '@mapgis/webclient-es6-service'
import {
  MapMixin,
  PopupOverlay,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

const { MarkerStyle, LineStyle, PointStyle, FillStyle } = Style

export default {
  name: 'PlaceNameCesium',
  mixins: [MapMixin],
  props: {
    selectedMarkerIcon: {
      type: String,
      default: '',
    },
    defaultMarkerIcon: {
      type: String,
      default: '',
    },
    cluster: {
      type: Boolean,
      default: false,
    },
    colorCluster: {
      type: String,
      default: '',
    },
    geojson: {
      type: Object,
      default: () => ({}),
    },
    hoverMarker: {
      type: Array,
      default: () => [],
    },
    fieldConfigs: {
      type: Array,
      required: false,
      default: () => [],
    },
  },
  computed: {
    popupAnchor() {
      return baseConfigInstance.config.colorConfig.label.image.popupAnchor
    },
    popupToggleType() {
      return baseConfigInstance.config.colorConfig.label.image.popupToggleType
    },
    popupShowType() {
      return baseConfigInstance.config.popupShowType
    },

    layerStyle() {
      return new MarkerStyle({
        symbol: this.defaultMarkerIcon,
      })
    },

    highlightStyle() {
      const highlightStyle = {
        enableHoverMarker: false,
        enableHoverFeature: false,
        marker: new MarkerStyle({
          symbol: this.selectedMarkerIcon,
        }),
        point: new PointStyle(),
        line: new LineStyle(),
        polygon: new FillStyle(),
      }
      this.changeColor(highlightStyle)
      return highlightStyle
    },

    options() {
      return {
        fillStyle: this.colorCluster,
        size: 50 / 3 / 2, // 非聚合点的半径
        minSize: 8, // 聚合点最小半径
        maxSize: 31, // 聚合点最大半径
        globalAlpha: 0.8, // 透明度
        clusterRadius: 150, // 聚合像素半径
        maxClusterZoom: 18, // 最大聚合的级别
        maxZoom: 19, // 最大显示级别
        minPoints: 5, // 最少聚合点数，点数多于此值才会被聚合
        extent: 400, // 聚合的细腻程度，越高聚合后点越密集
        label: {
          // 聚合文本样式
          show: true, // 是否显示
          fillStyle: 'white',
        },
        gradient: {
          0: this.colorCluster,
          0.5: this.colorCluster,
          1.0: this.colorCluster,
        }, // 聚合图标渐变色
        cesium: { postRender: true, postRenderFrame: 0 },
        draw: 'cluster',
        context: '2d',
        showUnCluster: false, // 不显示未聚合的点
      }
    },
    clusterStyle() {
      return [
        {
          start: 0,
          end: 1,
          billboard: {
            color: [1, 1, 1, 0.6], // rgba
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            imageStyle: {
              radius: 10,
              fillColor: this.colorCluster, // 填充色
              borderColor: '#ffffff', // 边框颜色
              borderWidth: 2, // 边框宽度
            },
          },
          label: {
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            scale: 0.5, // 文字放大倍率
            fillColor: [0, 0, 0, 1], // rgba
            font: "40px Microsoft YaHei", // 字体
          },
        },
        {
          start: 2,
          end: 30,
          billboard: {
            color: [1, 1, 1, 0.6], // rgba
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            imageStyle: {
              radius: 30,
              fillColor: this.colorCluster, // 填充色
              borderColor: '#ffffff', // 边框颜色
              borderWidth: 5, // 边框宽度
            },
          },
          label: {
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            scale: 0.5, // 文字放大倍率
            fillColor: [0, 0, 0, 1], // rgba
            font: "40px Microsoft YaHei", // 字体
          },
        },
        {
          start: 30,
          end: 60,
          billboard: {
            color: [1, 1, 1, 0.6], // rgba
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            imageStyle: {
              radius: 30,
              fillColor: this.colorCluster, // 填充色
              borderColor: '#ffffff', // 边框颜色
              borderWidth: 5, // 边框宽度
            },
          },
          label: {
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            scale: 0.5, // 文字放大倍率
            fillColor: [0, 0, 0, 1], // rgba
            font: "40px Microsoft YaHei", // 字体
          },
        },
        {
          start: 60,
          end: 90,
          billboard: {
            color: [1, 1, 1, 0.6], // rgba
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            imageStyle: {
              radius: 30,
              fillColor: this.colorCluster, // 填充色
              borderColor: '#ffffff', // 边框颜色
              borderWidth: 5, // 边框宽度
            },
          },
          label: {
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            scale: 0.5, // 文字放大倍率
            fillColor: [0, 0, 0, 1], // rgba
            font: "40px Microsoft YaHei", // 字体
          },
        },
        {
          start: 90,
          billboard: {
            color: [1, 1, 1, 0.6], // rgba
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            imageStyle: {
              radius: 30,
              fillColor: this.colorCluster, // 填充色
              borderColor: '#ffffff', // 边框颜色
              borderWidth: 5, // 边框宽度
            },
          },
          label: {
            horizontalOrigin: 0, //CENTER:0 LEFT:1 RIGHT: -1
            verticalOrigin: 0, //CENTER:0 BOTTOM:1 TOP: -1 BASELINE:2
            scale: 0.5, // 文字放大倍率
            fillColor: [0, 0, 0, 1], // rgba
            font: "40px Microsoft YaHei", // 字体
          },
        },
      ]
    },
  },
  data() {
    return {
      unClusterData: [],
    }
  },
  methods: {
    showPopup(data) {
      this.popupOverlayInstance.setContent(data)
    },
    changeColor(highlightStyle) {
      // 手动修改高亮样式与系统设置一致
      const { color: regColor } =
        baseConfigInstance.config.colorConfig.feature.reg
      const { color: lineColor } =
        baseConfigInstance.config.colorConfig.feature.line
      const { size: lineWidth } =
        baseConfigInstance.config.colorConfig.feature.line
      const { color: pntColor } =
        baseConfigInstance.config.colorConfig.feature.pnt
      const { size: pntSize } =
        baseConfigInstance.config.colorConfig.feature.pnt
      highlightStyle.line.color = lineColor
      highlightStyle.line.width = +lineWidth // 转number
      highlightStyle.point.color = pntColor
      highlightStyle.point.radius = +pntSize // 转number
      highlightStyle.polygon.color = regColor
      highlightStyle.polygon.outlineColor = lineColor
      highlightStyle.polygon.outlineWidth = +lineWidth
    },
    // 获取聚合图未聚合的点集
    getUnClusterData(data) {
      this.unClusterData = data
    },
    // 获取显示标注的geojson
    getMarkerGeoJson() {
      if (!this.cluster) {
        return this.geojson
      } else if (this.unClusterData && this.unClusterData.length > 0) {
        const unClusterGeojson = {
          type: 'FeatureCollection',
          features: [],
        }
        for (let i = 0; i < this.unClusterData.length; i++) {
          const feature = this.unClusterData[i]
          const { geometry, properties } = feature
          const obj = {
            type: 'Feature',
            geometry,
            properties,
          }
          unClusterGeojson.features.push(obj)
        }
        return unClusterGeojson
      }
    },
  },

  created() {
    this.popupOverlayInstance = PopupOverlay.getInstance()
  },
}
</script>

<style scoped></style>
