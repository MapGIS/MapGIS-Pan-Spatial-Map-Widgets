<template>
  <div class="split-screen-map">
    <transition name="fade">
      <mapgis-ui-empty
        v-if="!layerIds.length"
        description="请在数据目录中选择需要分屏的数据"
      />
      <mapgis-ui-row v-else :gutter="[5, 5]">
        <mapgis-ui-col
          v-for="(id, i) in layerIds"
          :key="`screen${i}-${id}`"
          :span="mapSpan"
          :style="mapSpanStyle"
        >
          <map-view
            :is-all3d="isAll3d"
            :init-bound="initBound"
            :map-view-id="`split-screen-map-${i}`"
            :map-view-layer="mapViewLayer(id)"
            :resize="resize"
            :map-view-num="mapViewNum"
          />
        </mapgis-ui-col>
      </mapgis-ui-row>
    </transition>
  </div>
</template>
<script lang="ts">
import { Rectangle } from '@mapgis/webclient-es6-service/common/Rectangle'
import {
  MapMixin,
  Layer,
  Layer3D,
  Objects,
  Rectangle3D,
  CoordinateTransformation,
  CoordinateSystemType,
} from '@mapgis/web-app-framework'
import MapView from '../MapView'

export default {
  name: 'SplitScreenMap',
  components: {
    MapView,
  },
  mixins: [MapMixin],
  props: {
    resize: String,
    mapSpan: {
      type: Number,
      default: 12,
    },
    layerIds: {
      type: Array,
      default: () => [],
    },
    layers: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    layerIds(nIds, oIds = []) {
      if (nIds.length && nIds[0] !== oIds[0]) {
        this.setInitBound()
      }
    },
  },
  data() {
    return {
      // 获取初始地图视图的复位范围
      initBound: new Rectangle(0.0, 0.0, 0.0, 0.0),
    }
  },
  computed: {
    // 每个屏的高度设置
    mapSpanStyle() {
      const height = this.layerIds.length > 2 ? '50%' : '100%'
      return { height }
    },

    // 每屏的图层
    mapViewLayer() {
      return (layerId) => this.layers.find(({ id }) => layerId === id)
    },

    // 是否全部是三维
    isAll3d() {
      return this.layers.every((layer) => layer instanceof Layer3D)
    },
    // 分屏数量
    mapViewNum() {
      return this.layerIds.length > 1 ? 2 : 1
    },
  },
  methods: {
    /**
     * 获取初始经纬度坐标范围
     */
    setInitBound() {
      const layer = this.layers[0]
      const { fullExtent, activeScene = {} } = layer
      let _initBound = fullExtent
      if (layer instanceof Layer3D) {
        const loadedLayer = window.layers3D[layer.id]
        // 如果存在已加载的三维图层，则直接使用已加载三维图层里的范围，这个范围比较准确
        if (loadedLayer) {
          const { xmin, ymin, xmax, ymax } = loadedLayer.fullExtent
          _initBound = { xmin, ymin, xmax, ymax }
        } else {
          const sceneController = Objects.SceneController.getInstance(
            this.Cesium,
            this.vueCesium,
            this.viewer
          )
          if (activeScene.sublayers) {
            _initBound = sceneController.layerExtentToGlobelExtent(
              activeScene.sublayers.find(({ visible }) => !!visible) ||
                activeScene.sublayers[0],
              activeScene.sceneMode
            )
          }
        }
      }
      // 将全图范围统一转换为经纬度
      if (
        layer.spatialReference &&
        layer.spatialReference.wkid === CoordinateSystemType.webMercator
      ) {
        const xminYminConverted = CoordinateTransformation.mercatorToWGS84([
          _initBound.xmin,
          _initBound.ymin,
        ])
        const xmaxYmaxConverted = CoordinateTransformation.mercatorToWGS84([
          _initBound.xmax,
          _initBound.ymax,
        ])
        this.initBound = {
          xmin: xminYminConverted[0],
          ymin: xminYminConverted[1],
          xmax: xmaxYmaxConverted[0],
          ymax: xmaxYmaxConverted[1],
        }
      } else {
        this.initBound = _initBound
      }
    },
  },

  created() {
    if (this.layerIds.length) {
      this.setInitBound()
    }
  },
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
