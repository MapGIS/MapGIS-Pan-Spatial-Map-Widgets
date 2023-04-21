<template>
  <div class="mp-model-pick">
    <mapgis-ui-input-number-panel
      size="large"
      class="mapgis-ui-number-style"
      label="二维图层透明度系数"
      :range="[0, 100]"
      v-model="imageOpacityFactor"
      @change="(val) => onChangeOpacityFactor(val, 'imageOpacityFactor')"
    />
    <mapgis-ui-input-number-panel
      size="large"
      class="mapgis-ui-number-style"
      label="模型透明度系数"
      :range="[0, 100]"
      v-model="modelOpacityFactor"
      @change="(val) => onChangeOpacityFactor(val, 'modelOpacityFactor')"
    />
  </div>
</template>
<script lang="ts">
import {
  baseConfigInstance,
  WidgetMixin,
  events,
  eventBus,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpOpacityFactor',
  mixins: [WidgetMixin],
  data() {
    return {
      imageOpacityFactor: 100,
      modelOpacityFactor: 100,
    }
  },
  mounted() {
    this.imageOpacityFactor =
      baseConfigInstance.config.imageOpacityFactor || 100
    this.modelOpacityFactor =
      baseConfigInstance.config.modelOpacityFactor || 100
  },
  methods: {
    onChangeOpacityFactor(val, field) {
      if (field === 'imageOpacityFactor') {
        eventBus.$emit(events.IMAGE_OPACITY_FACTOR_CHANGE, val)
      } else if (field === 'modelOpacityFactor') {
        eventBus.$emit(events.MODEL_OPACITY_FACTOR_CHANGE, val)
      }
    },
  },
}
</script>
