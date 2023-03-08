<template>
  <div class="mp-widget-scalebar">比例尺</div>
</template>

<script lang="ts">
import { Mixins, Component } from 'vue-property-decorator'
import { WidgetMixin } from '@mapgis/web-app-framework'

@Component({ name: 'MpScalebar' })
export default class MpScalebar extends Mixins(WidgetMixin) {}
</script>

<style lang="scss">
.distance-legend {
  .distance-legend-label {
    color: $text-color;
  }
}
</style>
