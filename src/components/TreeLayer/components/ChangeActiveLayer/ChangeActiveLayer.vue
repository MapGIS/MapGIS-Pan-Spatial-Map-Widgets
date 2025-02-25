<template>
  <div class="select-tilematrixSet">
    <mapgis-ui-form
      labelAlign="left"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <mapgis-ui-form-item label="图层">
        <mapgis-ui-select v-model="selectId" style="width: 100%">
          <mapgis-ui-select-option
            v-for="{ title, id } in Sublayers"
            :key="id"
            :value="id"
          >
            {{ title }}
          </mapgis-ui-select-option>
        </mapgis-ui-select>
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="瓦片集">
        <mapgis-ui-select v-model="tileMatrixSetId" style="width: 100%">
          <mapgis-ui-select-option
            v-for="{ id } in tileMatrixSets"
            :key="id"
            :value="id"
          >
            {{ id }}
          </mapgis-ui-select-option>
        </mapgis-ui-select>
      </mapgis-ui-form-item>
      <div style="textalign: right">
        <mapgis-ui-button type="primary" @click="save"> 保存 </mapgis-ui-button>
      </div>
    </mapgis-ui-form>
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
      return this.layer.sublayersBackup
    },
    tileMatrixSetId: {
      get() {
        return this.layer.activeLayer.tileMatrixSetId
      },
      set(id: string) {
        this.layer.activeLayer.tileMatrixSetId = id
        this.$emit('update:layer', this.layer)
      },
    },
    tileMatrixSets() {
      return this.layer.activeLayer.tileMatrixSets
    },
  },
  methods: {
    save() {
      this.$emit('save', this.layer)
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
