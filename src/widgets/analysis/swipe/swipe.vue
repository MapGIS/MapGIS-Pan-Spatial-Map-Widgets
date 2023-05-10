<template>
  <div class="mp-widget-swipe" v-if="isOpen">
    <mapbox-compare v-if="is2DMapMode" />
    <cesium-compare v-else />
  </div>
</template>

<script lang="ts">
import { WidgetMixin, AppMixin, Layer } from '@mapgis/web-app-framework'
import MapboxCompare from './components/MapboxCompare'
import CesiumCompare from './components/CesiumCompare'

type Direction = 'vertical' | 'horizontal'

export default {
  name: 'MpSwipe',
  components: {
    MapboxCompare,
    CesiumCompare,
  },
  mixins: [WidgetMixin, AppMixin],
  provide() {
    return {
      swipe: this,
    }
  },
  data() {
    return {
      // 卷帘功能弹框开关
      isOpen: false,

      // 强制刷新三维卷帘
      refreshCesiumCompare: false,

      // 卷帘方向
      direction: 'vertical',

      // 上级(左侧)图层
      aboveLayer: {},

      // 下级(右侧)图层
      belowLayer: {},

      // 目录树勾选的图层
      layers: [],
    }
  },
  computed: {
    // 上级(左侧)图层列表
    aboveLayers() {
      return this.getLayers(this.belowLayer.id)
    },
    // 下级(右侧)图层列表
    belowLayers() {
      return this.getLayers(this.aboveLayer.id)
    },
  },
  methods: {
    /**
     * 获取对应的图层
     */
    getLayer(layerId: string) {
      return this.layers.find(({ id }: Layer) => id === layerId) || {}
    },

    /**
     * 上下图层选择变化时获取对应的图层列表
     */
    getLayers(layerId: string) {
      return this.layers.filter((l: Layer) => l.id !== layerId)
    },

    /**
     * todo 强制刷新三维卷帘，解决切换二三维，不触发三维卷帘的更新的问题
     */
    onForceRefreshCesiumCompare() {
      if (!this.is2DMapMode) {
        this.refreshCesiumCompare = false
        const timer = setTimeout(() => {
          this.refreshCesiumCompare = true
          clearTimeout(timer)
        })
      }
    },

    /**
     * 重置图层信息
     */
    resetLayer() {
      this.layers = []
      this.aboveLayer = {}
      this.belowLayer = {}
      this.refreshCesiumCompare = false
    },

    /**
     * 图层初始化和重置操作
     */
    initLayer(success: (l: layer[]) => void) {
      const _layers = this.document.defaultMap
        .clone()
        .getFlatLayers()
        .filter((v) => {
          // 目录树节点上extend中roll可设置图层是否参与卷帘，默认为true
          let roll = true
          if (v.extend && v.extend.roll !== undefined) {
            roll = v.extend.roll
          }
          return !!v.isVisible && roll
        })
      if (_layers && _layers.length > 1) {
        success(_layers)
        this.onForceRefreshCesiumCompare()
      } else {
        this.resetLayer()
      }
    },

    /**
     * 上层(左侧)图层变化
     */
    onAboveChange(layerId: string) {
      if (this.aboveLayer.id !== layerId) {
        this.aboveLayer = this.getLayer(layerId)
      }
    },

    /**
     * 下层(右侧)图层变化
     */
    onBelowChange(layerId: string) {
      if (this.belowLayer.id !== layerId) {
        this.belowLayer = this.getLayer(layerId)
      }
    },

    /**
     * 卷帘方向变化
     */
    onDirectChange(direct: Direction) {
      this.direction = direct
    },

    /**
     * 卷帘弹框打开操作
     */
    onOpen() {
      this.isOpen = true
      this.initLayer((layers: Layer[]) => {
        this.aboveLayer = layers[1]
        this.belowLayer = layers[0]
        this.layers = layers
      })
    },

    /**
     * 卷帘弹框关闭操作
     */
    onClose() {
      this.isOpen = false
      this.onDirectChange('vertical')
      this.resetLayer()
    },
  },
  watch: {
    /**
     * 监听: is2DMapMode变化
     */
    is2DMapMode: {
      immediate: true,
      handler(nV) {
        this.refreshCesiumCompare = !nV
        this.$set(
          this.widget.manifest.properties,
          'windowSize',
          !nV ? 'normal' : 'max'
        )
      },
    },
    /**
     * 监听: defaultMap变化
     */
    'document.defaultMap': {
      immediate: true,
      deep: true,
      handler() {
        if (this.isOpen) {
          this.initLayer((layers: Layer[]) => {
            this.layers = layers
            this.aboveLayer = this.aboveLayers[0]
            this.belowLayer = this.belowLayers[0]
          })
        }
      },
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-swipe {
  // 有穿透
  .mapboxgl-compare {
    border: 1px solid $primary-color;
    background-color: $border-color;
    .compare-swiper-vertical,
    .compare-swiper-horizontal {
      background-color: $primary-color;
    }
  }
}
</style>

<style lang="less" scoped>
@import './swipe.less';
</style>
