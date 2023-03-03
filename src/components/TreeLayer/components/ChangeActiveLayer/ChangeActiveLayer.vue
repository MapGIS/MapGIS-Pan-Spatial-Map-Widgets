<template>
  <div class="select-tilematrixSet">
    <mapgis-ui-select v-model="selectId" style="width: 100%">
      <mapgis-ui-select-option
        v-for="{ title, id } in Sublayers"
        :key="id"
        :value="id"
      >
        {{ title }}
      </mapgis-ui-select-option>
    </mapgis-ui-select>
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  OGCWMTSLayer,
  WMTSSublayer,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpChangeActiveLayer',
  props: {
    layer: {
      type: OGCWMTSLayer,
    },
  },
  computed: {
    selectId: {
      get() {
        return this.layer.activeLayer.id
      },
      set(id: string) {
        const layer: WMTSSublayer = this.Sublayers.find(
          (item: WMTSSublayer) => item.id === id
        )
        this.layer.activeLayer = layer
        this.$emit('update:layer', this.layer)
      },
    },
    Sublayers(): Array<WMTSSublayer> {
      return this.layer.sublayers
    },
  },
}
</script>

<style lang="less" scoped>
.select-tilematrixSet {
  margin: 0.5em;
}
.top-02em {
  margin-top: 0.2em;
}
</style>
