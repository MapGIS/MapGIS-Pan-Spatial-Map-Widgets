<template>
  <div>
    <!-- <mp-draw-pro ref="draw" @finished="onDrawFinished" /> -->
    <mapgis-marker v-if="marker" :coordinates="marker.center" anchor="bottom">
      <img slot="marker" :src="marker.img" />
    </mapgis-marker>
  </div>
</template>

<script lang="ts">
import { LayerType, WidgetMixin } from '@mapgis/web-app-framework'
import { Style } from '@mapgis/webclient-es6-service'

const { LineStyle, PointStyle, FillStyle } = Style

export default {
  name: 'MapboxLayer',
  mixins: [WidgetMixin],
  props: [
    'dataCoordinateArr',
    'dataBarrierArr',
    'marker',
    'result',
    'highResultSource',
    'color',
  ],

  data() {
    return {
      pointResultSourceId: 'analysisPointSourceId',
      pointResultLayerId: 'analysisPointLayerId',
      lineResultSourceId: 'analysisLineSourceId',
      lineResultLayerId: 'analysisLineLayerId',
      lineResultClickSourceId: 'analysisClickLineSourceId',
      lineResultClickLayerId: 'analysisClickLineLayerId',
      circleColor: {
        'circle-radius': 6, // 半径
        'circle-color': '#FF9933', // 颜色
        'circle-opacity': 1, // 透明度
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
      // 点集图层ID
      pointLayerId: 'networkAnalysisCoordinate',
      // 点集资源ID
      pointSourceId: 'network-analysis-coordinate',
      // 障碍物图层ID
      barrierLayerId: 'networkAnalysisBarrier',
      // 障碍物资源ID
      barrierSourceId: 'network-analysis-barrier',
    }
  },

  mounted() {
    this.dataCoordinateArrChange()
    this.dataBarrierArrChange()
    this.resultChange()
    this.highResultSourceChange()
  },

  watch: {
    result: {
      deep: true,
      handler: 'resultChange',
    },
    highResultSource: {
      deep: true,
      handler: 'highResultSourceChange',
    },
    dataCoordinateArr: {
      deep: true,
      handler: 'dataCoordinateArrChange',
    },
    dataBarrierArr: {
      deep: true,
      handler: 'dataBarrierArrChange',
    },
  },

  methods: {
    resultChange() {
      this.clearResultLayer()
      const { layerPoint, layerLine } = this.result
      // 添加点图层
      this.map.addSource(this.pointResultSourceId, {
        type: 'geojson',
        data: layerPoint,
      })
      const pointStyle = new PointStyle({
        color: this.circleColor['circle-color'],
        outlineColor: this.circleColor['circle-color'],
        radius: 5,
        opacity: this.circleColor['circle-opacity'],
      })
      let style = {
        type: 'circle',
        ...pointStyle.toMapboxStyle(),
      }
      this.map.addLayer({
        id: this.pointResultLayerId,
        source: this.pointResultSourceId,
        ...style,
      })

      // 添加线图层
      this.map.addSource(this.lineResultSourceId, {
        type: 'geojson',
        data: layerLine,
      })
      const lineStyle = new LineStyle({
        color: this.color,
        width: 4,
      })
      style = {
        type: 'line',
        ...lineStyle.toMapboxStyle(),
      }
      this.map.addLayer({
        id: this.lineResultLayerId,
        source: this.lineResultSourceId,
        ...style,
      })
    },

    highResultSourceChange() {
      this.clearHighLayer()
      // 添加高亮图层
      this.map.addSource(this.lineResultClickSourceId, {
        type: 'geojson',
        data: this.highResultSource,
      })
      const lineStyle = new LineStyle({
        color: 'blue',
        width: 4,
      })
      const style = {
        type: 'line',
        ...lineStyle.toMapboxStyle(),
      }
      this.map.addLayer({
        id: this.lineResultClickLayerId,
        source: this.lineResultClickSourceId,
        ...style,
      })
    },

    dataCoordinateArrChange() {
      this.clearDataCoordinateArr()
      // 添加点图层
      this.map.addSource(this.pointSourceId, {
        type: 'geojson',
        data: this.dataCoordinateArr, // 一开始的数据是空的,后面请求到了再更新
      })
      const pointStyle = new PointStyle({
        color: this.circleColor['circle-color'],
        outlineColor: this.circleColor['circle-color'],
        radius: 5,
        opacity: this.circleColor['circle-opacity'],
      })
      const style = {
        type: 'circle',
        ...pointStyle.toMapboxStyle(),
      }
      this.map.addLayer({
        id: this.pointLayerId,
        source: this.pointSourceId,
        ...style,
      })
    },

    dataBarrierArrChange() {
      this.clearDataBarrierArr()
      // 添加障碍物图层
      this.map.addSource(this.barrierSourceId, {
        type: 'geojson',
        data: this.dataBarrierArr, // 一开始的数据是空的,后面请求到了再更新
      })
      const pointStyle = new PointStyle({
        color: 'red',
        outlineColor: 'red',
        radius: 5,
        opacity: this.circleColor['circle-opacity'],
      })
      const style = {
        type: 'circle',
        ...pointStyle.toMapboxStyle(),
      }
      this.map.addLayer({
        id: this.barrierLayerId,
        source: this.barrierSourceId,
        ...style,
      })
    },

    clearDataBarrierArr() {
      if (this.map.getLayer(this.barrierLayerId)) {
        this.map.removeLayer(this.barrierLayerId)
      }
      if (this.map.getSource(this.barrierSourceId)) {
        this.map.removeSource(this.barrierSourceId)
      }
    },

    clearDataCoordinateArr() {
      if (this.map.getLayer(this.pointLayerId)) {
        this.map.removeLayer(this.pointLayerId)
      }
      if (this.map.getSource(this.pointSourceId)) {
        this.map.removeSource(this.pointSourceId)
      }
    },

    clearResultLayer() {
      if (this.map.getLayer(this.pointResultLayerId)) {
        this.map.removeLayer(this.pointResultLayerId)
        this.map.removeSource(this.pointResultSourceId)
      }
      if (this.map.getLayer(this.lineResultLayerId)) {
        this.map.removeLayer(this.lineResultLayerId)
        this.map.removeSource(this.lineResultSourceId)
      }
    },

    clearHighLayer() {
      if (this.map.getLayer(this.lineResultClickLayerId)) {
        this.map.removeLayer(this.lineResultClickLayerId)
        this.map.removeSource(this.lineResultClickSourceId)
      }
    },

    flyToHigh(val) {
      this.map.panTo(val)
    },
  },

  beforeDestroy() {
    this.clearDataBarrierArr()
    this.clearDataCoordinateArr()
    this.clearResultLayer()
    this.clearHighLayer()
  },
}
</script>

<style scoped></style>
