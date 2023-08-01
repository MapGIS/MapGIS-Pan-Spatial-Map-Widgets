<template>
  <div class="swipe-cesium-compare">
    <!-- 卷帘组件 -->
    <mapgis-3d-compare
      v-if="showCompare && refreshFlag()"
      :before-layers="beforeLayers"
      :after-layers="afterLayers"
      :orientation="direction"
    />
    <!-- 空数据提示 -->
    <mapgis-ui-empty
      v-show="!showCompare"
      description="卷帘分析功能至少需要选择2个图层"
    />
    <!-- 图层设置 -->
    <swipe-setting v-show="showCompare" />
  </div>
</template>
<script lang="ts">
import { Layer } from '@mapgis/web-app-framework'
import SwipeSetting from './SwipeSetting'

export default {
  name: 'CesiumCompare',
  components: {
    SwipeSetting,
  },
  inject: {
    swipe: {
      from: 'swipe',
      default: () => ({}),
    },
  },
  computed: {
    // 卷帘方向
    direction() {
      return this.swipe.direction || 'vertical'
    },
    // 上级(左侧)图层列表
    beforeLayers() {
      let beforeLayers = [this.swipe.aboveLayer]
      if (this.swipe.aboveLayer.id == 'other') {
        // 如果上级(左侧)选的'其他'，则表示上级(左侧)图层为除下级(右侧)图层的所有图层
        beforeLayers = this.swipe.getLayers(this.swipe.belowLayer.id)
      }
      return this.getLayerIds(beforeLayers)
    },

    // 下级(右侧)图层列表
    afterLayers() {
      let afterLayers = [this.swipe.belowLayer]
      if (this.swipe.belowLayer.id == 'other') {
        // 如果下级(右侧)选的'其他'，则表示下级(右侧)图层为除上级(左侧)图层的所有图层
        afterLayers = this.swipe.getLayers(this.swipe.aboveLayer.id)
      }
      return this.getLayerIds(afterLayers)
    },

    // 是否展示卷帘
    showCompare() {
      return this.beforeLayers.length && this.afterLayers.length
    },

    // 刷新标志
    refreshFlag() {
      return () => this.swipe.refreshCesiumCompare
    },
  },
  methods: {
    /**
     * 获取图层ID列表
     */
    getLayerIds(layers) {
      const ids = []
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        if (layer.id) {
          ids.push(layer.id)
        }
      }
      return ids
    },
  },
}
</script>

<style lang="scss" scoped>
.swipe-cesium-compare {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mp-map-container {
  .cesium-map-wrapper .slider {
    border: 1px solid $primary-color;
    background-color: $border-color;
    width: 3px;
  }
}
</style>
