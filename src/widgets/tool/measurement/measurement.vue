<template>
  <div>
    <mapgis-measure
      ref="mapgisMeasure"
      v-if="is2DMapMode"
      :enableControl="true"
      :isAdvanceControl="true"
      :editable="false"
    />
    <mapgis-3d-measure ref="mapgis3dMeasure" v-else />
  </div>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpMeasurement',
  mixins: [WidgetMixin],
  onClose() {
    this.$refs[
      `${this.is2DMapMode ? 'mapgisMeasure' : 'mapgis3dMeasure'}`
    ].remove()
  }
}
</script>
