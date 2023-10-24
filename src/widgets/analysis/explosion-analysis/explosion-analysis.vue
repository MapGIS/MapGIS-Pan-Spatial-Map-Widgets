<template>
  <div>
    <mapgis-3d-explosion-analysis
      v-if="show"
      ref="explosionAnalysis"
      @loaded="load"
      :models="layers"
    ></mapgis-3d-explosion-analysis>
  </div>
</template>

<script lang="ts">
import { WidgetMixin, LayerType, LoadStatus } from '@mapgis/web-app-framework'

export default {
  name: 'MpExplosionAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      layers: [],

      show: false,
    }
  },
  watch: {
    /**
     * 动态获取基础目录树上已勾选的三维模型数据
     */
    document: {
      immediate: true,
      deep: true,
      handler() {
        if (!this.document) return
        const layers = []
        this.document.defaultMap
          .clone()
          .getFlatLayers()
          .forEach((layer, index) => {
            const { id, type, title, searchParams } = layer
            if (type === LayerType.IGSScene || type === LayerType.ModelCache) {
              if (searchParams && searchParams.searchServiceType) {
                if (searchParams.searchServiceType === LayerType.IGSVector3D) {
                  searchParams.searchServiceType = 'IGSVector3D'
                } else if (
                  searchParams.searchServiceType === LayerType.IGSVector
                ) {
                  searchParams.searchServiceType = 'IGSVector'
                } else if (
                  searchParams.searchServiceType === LayerType.IGSMapImage
                ) {
                  searchParams.searchServiceType = 'IGSMapImage'
                }
              }
              layers.push({
                vueIndex: id,
                searchParams,
                ...layer,
              })
            }
          })
        this.layers = layers
      },
    },
  },
  methods: {
    /**
     * 微件打开时
     */
    onOpen() {
      this.show = true
    },

    /**
     * 微件关闭时
     */
    onClose() {
      this.show = false
    },

    load(payload) {
      const { component } = payload
      this.component = component
    },

    handleChangeLayer(layer) {
      const { title, vueIndex } = layer
      this.layerId = vueIndex
      this.layerTitle = title
    },
  },
}
</script>

<style lang="less" scoped>
.mapgis-3d-explosion-analysis-wrapper {
  height: 450px;
}
</style>
