<template>
  <div>
    <mapgis-3d-model-flatten :M3Ds="M3Ds" :heightOffset="heightOffset" />
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  dataCatalogManagerInstance,
  eventBus,
  events,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpModelFlatten',
  mixins: [WidgetMixin],

  data() {
    return {
      M3Ds: [],
      heightOffset: 0,
    }
  },

  watch: {
    document: {
      handler: 'getScenes',
      immediate: true,
      deep: true,
    },
  },

  methods: {
    getScenes() {
      if (!this.document) return
      this.M3Ds = []
      const vm = this
      this.document.defaultMap
        .clone()
        .getFlatLayers()
        .forEach((layer, index) => {
          if (layer.type === 22) {
            vm.M3Ds.push({
              key: layer.id,
              value: layer.title,
            })
          }
        })
    },
  },
}
</script>

<style lang="less" scoped></style>
