<template>
  <div class="mp-widget-output-image">
    <mapgis-3d-output-image />
  </div>
</template>
<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpOutputImage',
  mixins: [WidgetMixin],
}
</script>
