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
      return this.getLayerIds(this.swipe.aboveLayer)
    },

    // 下级(右侧)图层列表
    afterLayers() {
      return this.getLayerIds(this.swipe.belowLayer)
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
    getLayerIds({ id }: Layer) {
      return id ? [id] : []
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
