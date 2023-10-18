<template>
  <div>
    <!-- <mp-draw-pro ref="draw" @finished="onDrawFinished" /> -->
  </div>
</template>

<script lang="ts">
import { LayerType, WidgetMixin } from '@mapgis/web-app-framework'
import { Style } from '@mapgis/webclient-es6-service'

const { LineStyle, PointStyle, FillStyle } = Style

export default {
  name: 'MapboxLayer',
  mixins: [WidgetMixin],
  props: ['geoJSONAnalysis', 'geoJSONTarget'],

  data() {
    return {
      // 点集图层ID
      layerTargetId: 'topologyAnalysisTarget',
      // 点集资源ID
      sourceTargetId: 'topology-analysis-target',
      // 点集图层ID
      layerAnalysisId: 'topologyAnalysisAnalysis',
      // 点集资源ID
      sourceAnalysisId: 'topology-analysis-analysis',
    }
  },

  watch: {
    geoJSONAnalysis: {
      deep: true,
      immediate: true,
      handler: 'geoJSONAnalysisChange',
    },
    geoJSONTarget: {
      deep: true,
      immediate: true,
      handler: 'geoJSONTargetChange',
    },
  },

  methods: {
    geoJSONAnalysisChange() {
      this.geoJSONChange('Analysis')
    },

    geoJSONTargetChange() {
      this.geoJSONChange('Target')
    },

    geoJSONChange(val) {
      let geoJSON
      let layerId
      let sourceId
      let color
      if (val === 'Target') {
        this.clearDataTargetArr()
        geoJSON = this.geoJSONTarget
        layerId = this.layerTargetId
        sourceId = this.sourceTargetId
        color = '#FFA500'
      } else {
        this.clearDataAnalysisArr()
        geoJSON = this.geoJSONAnalysis
        layerId = this.layerAnalysisId
        sourceId = this.sourceAnalysisId
        color = '#ff9c6e'
      }

      if (!geoJSON) {
        return
      }
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: geoJSON, // 一开始的数据是空的,后面请求到了再更新
      })
      const { features } = geoJSON
      const {
        properties: { bound, center },
        geometry: { type, coordinates },
      } = features[0]
      let style
      if (type === 'Point') {
        const pointStyle = new PointStyle({
          color: color,
          outlineColor: color,
          radius: 5,
          opacity: 1,
        })
        style = {
          type: 'circle',
          ...pointStyle.toMapboxStyle(),
        }
        this.map.addLayer({
          id: layerId,
          source: sourceId,
          ...style,
        })
        this.map.panTo(center)
      } else if (type === 'LineString') {
        const lineStyle = new LineStyle({
          color: color,
          width: 3,
          opacity: 1,
        })
        style = {
          type: 'line',
          ...lineStyle.toMapboxStyle(),
        }
        this.map.addLayer({
          id: layerId,
          source: sourceId,
          ...style,
        })
        this.map.fitBounds(bound, {
          padding: { top: 100, bottom: 100, left: 200, right: 200 },
        })
      } else if (type === 'Polygon') {
        const fillStyle = new FillStyle({
          color: color,
          outlineColor: '#FFFFFF',
        })
        style = {
          type: 'fill',
          ...fillStyle.toMapboxStyle(),
        }
        this.map.addLayer({
          id: layerId,
          source: sourceId,
          ...style,
        })
        this.map.fitBounds(bound, {
          padding: { top: 100, bottom: 100, left: 200, right: 200 },
        })
      }
    },

    clearDataTargetArr() {
      if (this.map.getLayer(this.layerTargetId)) {
        this.map.removeLayer(this.layerTargetId)
      }
      if (this.map.getSource(this.sourceTargetId)) {
        this.map.removeSource(this.sourceTargetId)
      }
    },

    clearDataAnalysisArr() {
      if (this.map.getLayer(this.layerAnalysisId)) {
        this.map.removeLayer(this.layerAnalysisId)
      }
      if (this.map.getSource(this.sourceAnalysisId)) {
        this.map.removeSource(this.sourceAnalysisId)
      }
    },

    clear() {
      this.clearDataTargetArr()
      this.clearDataAnalysisArr()
    },
  },

  beforeDestroy() {
    this.clear()
  },
}
</script>

<style scoped></style>
