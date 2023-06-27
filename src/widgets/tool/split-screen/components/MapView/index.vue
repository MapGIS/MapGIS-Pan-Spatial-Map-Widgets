<template>
  <div class="map-view-wrap">
    <!-- 标题/工具栏 -->
    <tools
      v-show="isMapLoaded"
      @on-click="onOperationAttached"
      :title="mapViewLayer.title"
    />
    <!-- 二维地图 -->
    <mapbox-view
      v-if="is2dLayer"
      ref="mapboxView"
      @load="onMapboxLoaded"
      @draw-finished="onDrawFinished"
      :layer="mapViewLayer"
      :document="mapViewDocument"
    />
    <!-- 三维地图 -->
    <cesium-view
      v-else
      ref="cesiumView"
      @load="onCesiumLoaded"
      @draw-finished="onDrawFinished"
      @link-changed="onLinkChanged"
      :vue-key="mapViewId"
      :height="mapViewHeight"
      :layer="mapViewLayer"
      :document="mapViewDocument"
      :isAll3d="isAll3d"
    />
    <!-- 高亮查询的要素 -->
    <feature-highlight
      v-if="queryVisible"
      :vue-key="mapViewId"
      :is2d-layer="is2dLayer"
      :features="queryFeatures"
      :selected-keys="querySelection"
    />
    <!-- 结果树 -->
    <mp-window
      title="查询结果"
      :width="200"
      :height="200"
      :vertical-offset="32"
      :full-screen-action="false"
      :has-padding="false"
      :visible.sync="queryVisible"
    >
      <mp-query-result-tree
        v-if="queryVisible"
        @on-loaded="onQueryLoaded"
        @on-select="onQuerySelected"
        :geometry="queryGeometry"
        :layer="mapViewLayer"
        :vue-key="mapViewId"
      />
    </mp-window>
  </div>
</template>
<script lang="ts">
import { Rectangle } from '@mapgis/webclient-es6-service/common/Rectangle'
import {
  Document,
  Layer,
  Layer3D,
  Rectangle3D,
  Objects,
  LayerSublayersManager,
} from '@mapgis/web-app-framework'
import MpQueryResultTree from '../../../../../components/QueryResultsTree/QueryResultsTree.vue'
import MapViewMixin from './mixins/map-view'
import { OperationType } from './store/map-view-state'
import MapboxView from './components/MapboxView'
import CesiumView from './components/CesiumView'
import Tools from './components/Tools'
import FeatureHighlight from './components/FeatureHighlight'

export default {
  name: 'MapView',
  components: {
    Tools,
    MapboxView,
    CesiumView,
    FeatureHighlight,
    MpQueryResultTree,
  },
  mixins: [MapViewMixin],
  inject: ['map', 'mapbox'],
  provide() {
    const self = this
    return {
      get mapbox() {
        return self.ssMapbox
      },
      get map() {
        return self.ssMap
      },
    }
  },

  props: {
    // 是否全部三维屏
    isAll3d: {
      type: Boolean,
      default: false,
    },
    // 获取地图视图的复位范围
    initBound: {
      type: Rectangle,
    },
    // 需要resize
    resize: {
      type: [String, Boolean],
    },
    // 当前活动的窗口ID
    mapViewId: String,
    // 当前活动的窗口的图层
    mapViewLayer: {
      type: Layer,
      default: () => ({}),
    },
    mapViewNum: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      // document
      mapViewDocument: null,

      // 地图高度
      mapViewHeight: 0,

      // 分屏二维地图
      ssMap: this.map,

      // 分屏二维mapbox
      ssMapbox: this.mapbox,

      // 地图是否加载完成
      isMapLoaded: false,

      // 操作按钮类型
      operationType: OperationType.UNKNOWN,

      // 结果树弹框开关
      queryVisible: false,

      // 结果树中展开的节点的所有子节点
      queryFeatures: [],

      // 结果树选中的节点
      querySelection: [],
    }
  },
  computed: {
    // 是否是二维图层
    is2dLayer() {
      return !(this.mapViewLayer instanceof Layer3D)
    },

    // 二维或三维地图组件
    mapComponent() {
      return this.$refs[`${this.is2dLayer ? 'mapboxView' : 'cesiumView'}`]
    },
  },
  methods: {
    /**
     * 分屏窗口变化
     */
    onResize() {
      this.$nextTick(() => {
        if (!this.is2dLayer) {
          this.mapViewHeight = this.$el.clientHeight - 32
        } else if (this.ssMap) {
          this.ssMap.resize()
        }
      })
    },

    /**
     * 二维地图初始化
     * @param payload
     */
    onMapboxLoaded({ map, mapbox }) {
      this.ssMap = map
      this.ssMapbox = mapbox
      this.ssMap.on('mousemove', () => {
        this.setActiveMapView(OperationType.MAPDRAG)
      })
      this.ssMap.on('move', () => {
        const { _sw, _ne } = this.ssMap.getBounds()
        this.setActiveBound({
          xmin: _sw.lng,
          ymin: _sw.lat,
          xmax: _ne.lng,
          ymax: _ne.lat,
        })
      })
      this.isMapLoaded = true
      this.zoomTo({ ...this.initBound })
    },

    /**
     * 三维地图初始化
     */
    onCesiumLoaded(viewer, sceneController) {
      this.sceneController = sceneController
      setTimeout(() => {
        this.setSublayersConfig(sceneController)
      }, 2000)
      this.isMapLoaded = true
      this.zoomTo({ ...this.initBound })
      // 当分屏大于2个时，初始缩放级别下，部分瓦片不显示，稍微放大一点正常
      this.ssMap.setZoom(Math.ceil(this.ssMap.getZoom()))
    },

    /**
     * 地图联动变化
     * @param {object} param 范围
     */
    onLinkChanged({ west, east, north, south }) {
      this.setActiveMapView(OperationType.CESIUMDRAG)
      this.setActiveBound({
        xmin: west,
        xmax: east,
        ymax: north,
        ymin: south,
      })
    },

    /**
     * 二三维绘制结束操作
     * @param {object} geometry 绘制几何
     * @param {object} rect 绘制经纬度范围
     */
    onDrawFinished({
      geometry,
      rect,
    }: {
      geometry: Rectangle | Rectangle3D
      rect: Rectangle
    }) {
      switch (this.operationType) {
        case OperationType.QUERY:
          this.query(geometry)
          break
        case OperationType.ZOOMIN:
        case OperationType.ZOOMOUT:
          this.setActiveBound(rect)
          this.zoomTo(rect, this.operationType)
          break
        default:
          break
      }
    },

    /*
     * 地图操作按钮触发
     * @param type 按钮类型
     */
    onOperationAttached(type: keyof OperationType) {
      this.operationType = type
      this.setActiveMapView(type)
      switch (type) {
        case OperationType.QUERY:
          this.mapComponent.openDraw()
          break
        case OperationType.ZOOMIN:
        case OperationType.ZOOMOUT:
          this.mapComponent.openDraw('draw-rectangle')
          break
        case OperationType.RESTORE:
          this.restore({ ...this.initBound })
          break
        case OperationType.CLEAR:
          this.clear()
          break
        default:
          break
      }
    },

    /**
     * 结果树加载的要素集合
     * @param {array} loadedKeys 已经加载的父节点key
     * @param {array} loadedChildNodes 已经加载的所有子节点
     */
    onQueryLoaded(
      loadedKeys: Array<string>,
      loadedData: Array<Record<string, unknown>>
    ) {
      this.queryFeatures = loadedData
    },

    /**
     * 结果树选中
     * @param {array} selectedKeys 选中的要素id集合
     */
    onQuerySelected(selectedKeys: Array<string>) {
      this.querySelection = selectedKeys
    },

    /**
     * 清除结果树
     */
    onQueryClear() {
      this.queryFeatures = []
      this.querySelection = []
    },

    setSublayersConfig(sceneController) {
      const layerSublayersManager = LayerSublayersManager.sublayersConfig

      window.sceneController = this.sceneController
      if (layerSublayersManager && layerSublayersManager.length > 0) {
        layerSublayersManager.forEach((item) => {
          const sublayer = sceneController.findSource(item.id)
          if (
            sublayer &&
            sublayer.maximumScreenSpaceError !==
              Math.floor(
                item.layerProperty.maximumScreenSpaceError /
                  (2 * this.mapViewNum)
              )
          ) {
            sublayer.maximumScreenSpaceError = Math.floor(
              item.layerProperty.maximumScreenSpaceError / (2 * this.mapViewNum)
            )
          }
        })
      }
    },
  },
  watch: {
    /**
     * 监听: 图层变化
     */
    'mapViewLayer.id': {
      immediate: true,
      handler(id) {
        if (id) {
          if (!this.mapViewDocument) {
            this.mapViewDocument = new Document()
          }
          const { defaultMap } = this.mapViewDocument
          defaultMap.removeAll()
          defaultMap.add(this.mapViewLayer)
        }
      },
    },
    /**
     * 监听:  窗口变化
     */
    resize: {
      immediate: true,
      handler() {
        this.onResize()
      },
    },
  },

  mounted() {
    window.onresize = this.onResize
  },

  beforeDestroy() {
    this.isMapLoaded = false
    this.onOperationAttached('clear')
  },
}
</script>
<style lang="scss" scoped>
.map-view-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  border: 1px solid $border-color-base;
  border-radius: $border-radius-base;
}
</style>
