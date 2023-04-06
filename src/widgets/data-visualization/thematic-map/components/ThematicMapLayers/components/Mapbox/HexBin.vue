<template>
  <!-- 蜂窝图 -->
  <mapgis-mapv-layer
    v-if="geojson && geojson.features && !!geojson.features.length"
    :geojson="geojson"
    :options="options"
    :count-field="field"
  />
</template>
<script lang="ts">
import BaseMixin from '../../mixins/base'

export default {
  name: 'MapboxHexBin',
  mixins: [BaseMixin],
  computed: {
    options() {
      return {
        draw: 'honeycomb',
        context: '2d',
        ...(this.subjectData?.themeStyle || {}),
      }
    },
  },
}
</script>
