<template>
  <div>
    <mapgis-measure
      ref="mapgisMeasure"
      v-if="is2DMapMode && hasMapDisplay"
      :enableControl="true"
      :isAdvanceControl="true"
      :editable="false"
      :measureMethod="measureMethod"
      :featureConfig="featureConfig"
    />
    <mapgis-3d-measure
      ref="mapgis3dMeasure"
      :featureConfig="featureConfig"
      v-if="!is2DMapMode && hasGlobeDisplay"
    />
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  baseConfigInstance,
  DisplayModeMixin,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpMeasurement',
  mixins: [WidgetMixin, DisplayModeMixin],
  data() {
    return {
      // 判断微件是否执行了失活onDeActive函数
      doDeActive: false,
    }
  },
  computed: {
    measureMethod() {
      return this.widgetInfo.config.measureMethod || 'geography'
    },
    featureConfig() {
      return baseConfigInstance.config.colorConfig
    },
  },
  methods: {
    onClose() {
      this.$refs[
        `${this.is2DMapMode ? 'mapgisMeasure' : 'mapgis3dMeasure'}`
      ].remove()
      if (!this.doDeActive && this.map) {
        this.map.getCanvas().style.cursor = 'grab'
      }
    },

    onActive() {
      this.doDeActive = false
      if (this.map) {
        this.map.getCanvas().style.cursor =
          this.widgetInfo.config.cursorType || 'default'
      }
    },
    // 微件失活时
    onDeActive() {
      this.doDeActive = true
      this.$refs[
        `${this.is2DMapMode ? 'mapgisMeasure' : 'mapgis3dMeasure'}`
      ].remove()
      if (this.map) {
        this.map.getCanvas().style.cursor = 'grab'
      }
    },
  },
}
</script>
