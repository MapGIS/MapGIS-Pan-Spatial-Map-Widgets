<template>
  <mapgis-marker
    v-if="coordinate.length > 0"
    :coordinates="[coordinate[0], coordinate[1]]"
    anchor="bottom"
  >
    <img slot="marker" :src="`${baseUrl + markerImg}`" />
  </mapgis-marker>
</template>

<script lang="ts">
import {
  MapMixin,
  AppMixin,
  Feature,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

export default {
  name: 'CoordinateMapbox',
  mixins: [MapMixin, AppMixin],
  props: {
    pickable: {
      type: Boolean,
      default: false,
    },
    coordinate: {
      type: Array,
      default: () => [],
    },
    center: {
      type: Array,
      default: () => [],
    },
    frameFeature: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    highlightStyle: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      markerImg: `${baseConfigInstance.config.colorConfig.label.image.defaultImg}`,

      timer: null,
    }
  },
  watch: {
    pickable: {
      immediate: false,
      handler() {
        this.pickableChange()
      },
    },
    center: {
      deep: true,
      immediate: false,
      handler() {
        this.centerChange()
      },
    },
    frameFeature: {
      deep: true,
      immediate: false,
      handler(val) {
        this.frameFeatureChange(val)
      },
    },
  },
  methods: {
    emitPickedCoordinate(pickedCoordinate, is2D) {
      this.$emit('picked-coordinate', pickedCoordinate, is2D)
    },
    pickableChange() {
      const canvas = this.map.getCanvasContainer()

      if (this.pickable) {
        this.map.on('click', this.onClick)
        canvas.style.cursor = 'default'
      } else {
        this.map.off('click', this.onClick)
        canvas.style.cursor = ''
      }
    },
    frameFeatureChange(val) {
      this.clear()
      if (val && Object.keys(val).length > 0) {
        this.map.addSource('coordinate', { type: 'geojson', data: val })
        this.map.addLayer({
          id: 'coordinate',
          type: 'fill',
          source: 'coordinate',
          paint: {
            'fill-color': this.highlightStyle.feature.reg.color,
          },
        })
        this.map.addLayer({
          id: 'coordinate-outline',
          type: 'line',
          source: 'coordinate',
          paint: {
            'line-color': this.highlightStyle.feature.line.color,
            'line-width': parseInt(this.highlightStyle.feature.line.size),
          },
        })
        this.map.addLayer({
          id: 'coordinate-text',
          type: 'symbol',
          source: 'coordinate',
          paint: { 'text-color': this.highlightStyle.label.text.color },
          layout: {
            'text-field': '{name}',
            'text-size': parseInt(this.highlightStyle.label.text.fontSize),
          },
        })
      }
    },
    centerChange(){
      if (this.center && this.center.length > 0) {
        this.map.panTo([this.center[0], this.center[1]])
      }
    },
    clearTimer() {
      if (this.timer !== null) {
        window.clearTimeout(this.timer)
        this.timer = null
      }
    },

    onClick({
      lngLat: { lng, lat },
    }: {
      lngLat: { lng: number; lat: number }
    }) {
      this.emitPickedCoordinate([lng, lat], true)
    },

    clear() {
      if (this.map.getLayer('coordinate-text')) {
        this.map.removeLayer('coordinate-text')
      }
      if (this.map.getLayer('coordinate-outline')) {
        this.map.removeLayer('coordinate-outline')
      }
      if (this.map.getLayer('coordinate')) {
        this.map.removeLayer('coordinate')
      }
      if (this.map.getSource('coordinate')) {
        this.map.removeSource('coordinate')
      }
    },

    removeClickEvent() {
      if (this.pickable) {
        this.map.off('click', this.onClick)
        this.map.getCanvasContainer().style.cursor = ''
      }
    },
  },

  mounted() {
    this.pickableChange()
    this.frameFeatureChange()
    this.timer = window.setTimeout(() => {
      this.clearTimer()
      this.centerChange()
    }, 500)
  },
  beforeDestroy() {
    this.clear()
    this.removeClickEvent()
    this.clearTimer()
  },
}
</script>

<style lang="less"></style>
