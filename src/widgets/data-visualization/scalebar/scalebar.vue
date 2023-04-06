<template>
  <div class="mp-widget-scalebar">比例尺</div>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpScalebar',
  mixins: [WidgetMixin],
}
</script>

<style lang="scss">
.distance-legend {
  .distance-legend-label {
    color: $text-color;
  }
}
</style>
