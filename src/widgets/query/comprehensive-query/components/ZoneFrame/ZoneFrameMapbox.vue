<template>
  <div></div>
</template>

<script lang="ts">
import { MapMixin, Feature } from '@mapgis/web-app-framework'
import { bboxPolygon, lineString, bbox } from '@turf/turf'
import { Style } from '@mapgis/webclient-es6-service'

const { LineStyle, PointStyle, FillStyle, TextStyle } = Style

export default {
  name: 'ZoneFrameMapbox',
  mixins: [MapMixin],
  props: {
    feature: {
      type: Object,
      required: true,
      default: () => {
        return {}
      },
    },
    center: {
      type: Array,
      default: () => {
        return []
      },
    },
    fitBound: {
      type: Object,
      default: () => {
        return {}
      },
    },
    highlightStyle: {
      type: Object,
      default: () => {
        return {}
      },
    },
  },
  data() {
    return {
      timer: null,
    }
  },

  mounted() {
    this.featureChange()
    this.timer = window.setTimeout(() => {
      this.clearTimer()
      this.centerChange()
      this.fitBoundChange()
    }, 500)
  },
  methods: {
    clearTimer() {
      if (this.timer !== null) {
        window.clearTimeout(this.timer)
        this.timer = null
      }
    },
    clear() {
      if (this.map.getLayer('zone-frame-text')) {
        this.map.removeLayer('zone-frame-text')
      }
      if (this.map.getLayer('zone-frame-outline')) {
        this.map.removeLayer('zone-frame-outline')
      }
      if (this.map.getLayer('zone-frame')) {
        this.map.removeLayer('zone-frame')
      }
      if (this.map.getSource('zone-frame')) {
        this.map.removeSource('zone-frame')
      }
    },
    featureChange() {
      this.clear()
      if (this.feature && Object.keys(this.feature).length > 0) {
        this.map.addSource('zone-frame', {
          type: 'geojson',
          data: this.feature,
        })
        const fillStyle = new FillStyle({
          color: this.highlightStyle.feature.reg.color,
          outlineColor: this.highlightStyle.feature.line.color,
        })
        let style = {
          type: 'fill',
          ...fillStyle.toMapboxStyle(),
        }
        this.map.addLayer({
          id: 'zone-frame',
          source: 'zone-frame',
          ...style,
        })

        const lineStyle = new LineStyle({
          color: this.highlightStyle.feature.line.color,
          width: parseInt(this.highlightStyle.feature.line.size),
        })
        style = {
          type: 'line',
          ...lineStyle.toMapboxStyle(),
        }
        this.$delete(style, 'filter')
        this.map.addLayer({
          id: 'zone-frame-outline',
          source: 'zone-frame',
          ...style,
        })

        const textStyle = new TextStyle({
          text: '{name}',
          color: this.highlightStyle.label.text.color,
          font: {
            family: '微软雅黑',
            size: parseInt(this.highlightStyle.label.text.fontSize),
            style: 'normal',
            weight: 'normal',
          },
        })
        style = {
          type: 'symbol',
          ...textStyle.toMapboxStyle(),
        }
        this.map.addLayer({
          id: 'zone-frame-text',
          source: 'zone-frame',
          ...style,
        })
      }
    },
    centerChange() {
      if (this.center && this.center.length > 0) {
        this.map.panTo([this.center[0], this.center[1]])
      }
    },
    fitBoundChange() {
      if (this.fitBound && Object.keys(this.fitBound).length > 0) {
        const { xmin, ymin, xmax, ymax } = this.fitBound
        this.map.fitBounds([
          [xmin, ymin],
          [xmax, ymax],
        ])
      }
    },
  },
  watch: {
    feature: {
      deep: true,
      handler() {
        this.featureChange()
      },
    },
    highlightStyle: {
      deep: true,
      handler() {
        this.featureChange()
      },
    },
    center: {
      deep: true,
      handler() {
        this.centerChange()
      },
    },
    fitBound: {
      deep: true,
      handler() {
        this.fitBoundChange()
      },
    },
  },

  beforeDestroy() {
    this.clear()
    this.clearTimer()
  },
}
</script>

<style lang="less"></style>
