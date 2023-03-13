<template>
  <div>
    <!-- 分段专题图 -->
    <mapgis-theme-layer-custom
      @highlightChanged="emitHighlight"
      :theme-options="themeOptions"
      :show-panel="false"
      :enable-tips="false"
      :tips-options="tipsOptions"
      :layer-id="id"
      :field="field"
      :data-source="geojson"
      :highlight-feature="selfMarker.feature"
      type="range"
      ref="customRangeThemeLayer"
      @rangeLayer="getRangeLayer"
    />
    <mp-marker-pro
      :marker="selfMarker"
      v-if="selfMarker.fid"
      :defaultShowPopup="true"
      :popup-anchor="popupAnchor"
      :popup-toggle-type="popupToggleType"
    />
  </div>
</template>
<script lang="ts">
import BaseMixin from '../../mixins/base'
import { getMarker, IMarker } from '../../../../utils'
import _debounce from 'lodash/debounce'
import { baseConfigInstance } from '../../../../../../../model'

export default {
  name: 'MapboxSubSectionMap',
  mixins: [BaseMixin],
  inject: ['map'],
  watch: {
    /**
     * 监听：图属联动变化
     */
    'marker.fid'() {
      this.selfMarker = this.marker
    },
  },
  data() {
    return {
      // 标注
      selfMarker: {},

      tipsOptions: {
        enableHighlight: true,
        type: 'point',
      },
    }
  },
  computed: {
    themeOptions() {
      if (!this.subjectData) {
        return {}
      } else {
        const { color, themeStyle } = this.subjectData
        // 兼容旧配置
        return color && color.length
          ? {
              styleGroups: color.map(({ min, max, sectionColor }) => ({
                start: min,
                end: max,
                style: {
                  color: sectionColor,
                },
              })),
            }
          : themeStyle || {}
      }
    },
    popupAnchor() {
      return baseConfigInstance.config.colorConfig.label.image.popupAnchor
    },

    popupToggleType() {
      return baseConfigInstance.config.colorConfig.label.image.popupToggleType
    },
  },
  methods: {
    getRangeLayer(layer) {
      // console.log(layer)
      const { map } = this
      map.on(
        'mousemove',
        _debounce((e) => {
          const f = map.queryRenderedFeatures(e.point, {
            layers: [layer.id],
          })
          if (!f || f.length < 1) return
          const fid = f[0].id
          getMarker(this.geojson, fid, this.propertiesOption).then(
            (marker) => (this.selfMarker = marker || {})
          )
        }, 200)
      )
    },

    removeLayer() {
      const rangeLayer = this.$refs.customRangeThemeLayer
      if (rangeLayer) {
        rangeLayer.resetLayer(this.id)
      }
      this.map.off('mousemove')
    },
  },
}
</script>
<style>
/* .mapboxgl-popup-content{
  padding: 0;
} */
</style>
