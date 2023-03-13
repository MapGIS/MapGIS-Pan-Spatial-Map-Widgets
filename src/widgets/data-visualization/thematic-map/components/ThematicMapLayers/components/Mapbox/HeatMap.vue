<template>
  <!-- 热力图 -->
  <!-- <mapgis-mapv-layer
    v-if="geojson && geojson.features && !!geojson.features.length"
    :geojson="geojson"
    :options="options"
    :count-field="field"
  /> -->
  <!-- <mapgis-echarts-layer
    v-if="geojson && geojson.features && !!geojson.features.length"
    :options="ectartsOptions"
  /> -->
  <mapgis-heater-layer
    v-if="geojson && geojson.features && !!geojson.features.length"
    :geojson="geojson"
    :field="field"
    :heaterRadius="radius"
    :heaterColor="heaterColor"
    :max="maxMin.max"
    :min="maxMin.min"
  ></mapgis-heater-layer>
</template>
<script lang="ts">
import BaseMixin from '../../mixins/base'

export default {
  name: 'MapboxHeatMap',
  mixins: [BaseMixin],
  inject: ['map'],
  computed: {
    options() {
      return {
        draw: 'heatmap',
        context: '2d',
        ...(this.subjectData?.themeStyle || {}),
      }
    },
    radius() {
      return this.subjectData?.themeStyle?.radius || 20
    },

    heaterColor() {
      const gradient = this.subjectData?.themeStyle?.gradient || {
        '0': 'rgba(0,0,0,0)',
        '0.25': 'rgb(0,0,255)',
        '0.55': 'rgb(0,255,0)',
        '0.85': 'rgb(241,241,15)',
        '1.0': 'rgb(255,0,0)',
      }
      const keys = Object.keys(gradient)
      const colors = ['interpolate', ['linear'], ['heatmap-density']]
      for (let i = 0; i < keys.length; i++) {
        if (i === 0 && Number(keys[i]) !== 0) {
          colors.push(0)
          colors.push('rgba(0,0,0,0)')
        }
        colors.push(Number(keys[i]))
        colors.push(gradient[keys[i]])
      }
      return colors
    },

    maxMin() {
      const { geojson } = this
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        return { max: 100, min: 0 }
      }
      const features = geojson.features
      if (typeof features[0].properties[this.field] !== 'number') {
        return { max: 100, min: 0 }
      }
      const dataSourceCopy = []
      for (let i = 0; i < features.length; i++) {
        if (
          features[i].properties[this.field] !== '' &&
          features[i].properties[this.field] !== null &&
          features[i].properties[this.field] !== undefined
        ) {
          dataSourceCopy.push(features[i].properties[this.field])
        }
      }
      dataSourceCopy.sort(function (a, b) {
        return a - b
      })
      return {
        max: dataSourceCopy[dataSourceCopy.length - 1],
        min: dataSourceCopy[0],
      }
    },
  },

  // get ectartsOptions() {
  //   const dataSet = {
  //     mapboxgl: {
  //       roam: false
  //     },
  //     visualMap: {
  //       show: false,
  //       top: 'top',
  //       min: 0,
  //       max: 5,
  //       seriesIndex: 0,
  //       calculable: true,
  //       inRange: {
  //         color: ['blue', 'blue', 'green', 'yellow', 'red']
  //       }
  //     },
  //     series: [
  //       {
  //         name: '热力图',
  //         type: 'heatmap',
  //         coordinateSystem: 'mapboxgl',
  //         data: this.convertData(),
  //         pointSize: 5,
  //         blurSize: 6
  //       }
  //     ]
  //   }
  //   return dataSet
  // }

  // convertData() {
  //   const data = []
  //   const geojson = this.geojson
  //   if (!geojson || !geojson.features || geojson.features.length === 0) return
  //   // 构造数据
  //   const { features } = geojson
  //   for (let i = 0; i < features.length; i++) {
  //     const feature = features[i]
  //     const fType = feature.geometry.type
  //     const coordinates = feature.geometry.coordinates
  //     let countValue = feature.properties[this.field]
  //     if (countValue) {
  //       countValue = Number(countValue)
  //     } else {
  //       countValue = 1
  //     }
  //     if (fType === 'Point') {
  //       const obj = {
  //         name: countValue,
  //         value: coordinates.concat(countValue)
  //       }
  //       data.push(obj)
  //     }
  //   }
  //   return data
  // }
}
</script>
