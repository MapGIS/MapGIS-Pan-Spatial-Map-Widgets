<template>
  <div class="mapbox-view">
    <!-- 二维地图组件 -->
    <mp-web-map-pro
      @map-load="onMapLoad"
      :document="document"
      :splitScreen="splitScreen"
      :crs="crs"
    />
    <!-- 二维地图绘制组件 -->
    <mp-draw-pro
      v-if="isMapLoaded"
      ref="draw"
      @finished="onDrawFinished"
      clearDrawMode
    />
  </div>
</template>
<script lang="ts">
import { Document, Layer, LayerType, Objects } from '@mapgis/web-app-framework'

export default {
  name: 'MapboxView',
  props: {
    document: Document,
    layer: {
      type: Layer,
      default: () => ({}),
    },
  },
  data() {
    return {
      isMapLoaded: false,

      /**
       * 是否处于分屏状态
       */
      splitScreen: true,
    }
  },
  computed: {
    drawComponent() {
      return this.$refs.draw
    },
    crs() {
      if (this.layer.type === LayerType.OSM) {
        return `EPSG:${this.layer.spatialReference.wkid}`
      }
      return 'EPSG:4326'
    },
  },

  beforeDestroy() {
    this.isMapLoaded = false
  },
  methods: {
    /**
     * 供父组件调用
     * 二维默认画矩形
     * @param {string} [mode = 'draw-rectangle'] 参考MpDrawPro组件内定义的mode类型
     */
    openDraw(mode = 'draw-rectangle') {
      this.drawComponent.openDraw(mode)
    },

    /**
     * 供父组件调用
     */
    closeDraw() {
      this.drawComponent.closeDraw()
    },

    /**
     * 获取经纬度范围
     */
    getRect({ xmin, ymin, xmax, ymax }) {
      return Objects.GeometryExp.creatRectByMinMax(xmin, ymin, xmax, ymax)
    },

    /**
     * 绘制完成的回调
     */
    onDrawFinished({ mode, feature, shape, center }) {
      if (this.isMapLoaded) {
        const rect = this.getRect(shape)
        this.$emit('draw-finished', { geometry: rect, rect })
      }
    },

    /**
     * 地图加载成功回调
     * @param payload { map, mapbox }
     */
    onMapLoad(payload) {
      this.isMapLoaded = true
      this.$emit('load', payload)
      // 禁用鼠标右键事件
      this.$nextTick(() => {
        const elements = document.getElementsByClassName('mapbox-view')
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i]
          element.oncontextmenu = () => false
        }
      })
    },
  },
}
</script>

<style lang="less" scoped>
.mapbox-view {
  flex: 1;
  overflow: hidden;
}
</style>
