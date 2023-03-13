<template>
  <!-- 聚合标注专题图 ， 必须有geojson数据才会展示 -->
  <!-- <mapgis-mapv-layer
    v-if="geojson && geojson.features && !!geojson.features.length"
    :geojson="geojson"
    :options="options"
    :count-field="field"
  /> -->
  <mapgis-cluster-layer
    v-if="geojson && geojson.features && !!geojson.features.length"
    :geojson="geojson"
    :cluster="cluster"
    :uncluster="uncluster"
  />
</template>
<script lang="ts">
import BaseMixin from '../../mixins/base'
import { Util } from '@mapgis/webclient-vue-ui'

const { ColorUtil } = Util

export default {
  name: 'MapboxLabel',
  mixins: [BaseMixin],
  computed: {
    options() {
      return {
        draw: 'cluster',
        context: '2d',
        ...(this.subjectData?.themeStyle || {}),
      }
    },

    globalAlpha() {
      return this.subjectData?.themeStyle?.globalAlpha
    },

    defaultColor() {
      let alpha = this.globalAlpha
      if (this.globalAlpha == undefined) {
        alpha = 0.8
      }
      const color = ColorUtil.getColorObject('#ffffff', alpha)
      return ColorUtil.colorObjectToRgba(color, false)
    },

    colors() {
      const gradient = this.subjectData?.themeStyle?.gradient

      const colors = ['#51bbd6cc', '#f1f075cc', '#f28cb1cc']
      let alpha = this.globalAlpha
      if (this.globalAlpha == undefined) {
        alpha = 0.8
      }
      if (gradient) {
        const keys = Object.keys(gradient)
        if (keys && keys.length > 0) {
          const length = keys.length < 3 ? keys.length : 3
          for (let i = 0; i < keys.length; i++) {
            const color = ColorUtil.getColorObject(gradient[keys[i]], alpha)
            colors[i] = ColorUtil.colorObjectToRgba(color, false)
          }
        }
      }
      return colors
    },
    cluster() {
      const { colors } = this
      return {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          colors[0],
          10,
          colors[1],
          100,
          colors[2],
        ],
        'circle-radius': ['step', ['get', 'point_count'], 10, 0, 20, 100, 30],
        'circle-stroke-color': this.defaultColor,
        'circle-stroke-width': 2,
      }
    },

    uncluster() {
      const { colors } = this
      return {
        'circle-color': colors[1],
        'circle-radius': 10,
        'circle-stroke-width': 1,
        'circle-stroke-color': this.defaultColor,
      }
    },
  },
}
</script>
