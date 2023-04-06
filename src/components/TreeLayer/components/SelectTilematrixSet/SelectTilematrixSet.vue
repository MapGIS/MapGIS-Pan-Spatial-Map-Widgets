<template>
  <div class="select-tilematrixSet">
    <mapgis-ui-select v-model="tileMatrixSetId" style="width: 100%">
      <mapgis-ui-select-option
        v-for="{ id } in tileMatrixSets"
        :key="id"
        :value="id"
      >
        {{ id }}
      </mapgis-ui-select-option>
    </mapgis-ui-select>
  </div>
</template>

<script lang="ts">
import { LayerType, OGCWMTSLayer } from '@mapgis/web-app-framework'

export default {
  name: 'MpSelectTilematrixSet',
  props: {
    layer: {
      type: OGCWMTSLayer,
    },
  },
  computed: {
    tileMatrixSets() {
      if (this.layer) {
        return this.layer.tileMatrixSets || []
      }
      return []
    },
    tileMatrixSetId: {
      get() {
        if (this.layer) {
          return this.layer.tileMatrixSetId || ''
        }
        return ''
      },
      set(val) {
        this.layer.tileMatrixSetId = val
        this.$emit('update:layer', this.layer)
      },
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
