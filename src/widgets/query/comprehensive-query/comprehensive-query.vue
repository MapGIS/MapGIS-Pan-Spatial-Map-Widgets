<template>
  <div>
    <mapgis-ui-comprehensive-query
      :geoJSONExtent="extent"
      :logo="logo"
      :districtName="locationType === 'district' ? districtName : ''"
      :widgetInfo="config"
      :defaultMarkerIcon="defaultMarkerIcon"
      :selectedMarkerIcon="selectedMarkerIcon"
      @onClose="onClose"
      @onSearch="onSearch"
      @current-result="currentResult"
      @select-markers="selectMarkers"
      @click-item="clickItem"
      @change-cluster="changeCluster"
      @open-attribute-table="openAttributeTable"
      @remove-attribute-table="removeAttributeTable"
      @color-cluster="setColorCluster"
      @close-popup="closePopup"
      @select-item="selectItem"
    >
      <div class="query-section panel-container">
        <mapgis-ui-tabs v-model="locationType" size="small" type="card">
          <mapgis-ui-tab-pane
            v-for="item in locationTypes"
            :key="item"
            :tab="tab(item)"
          >
            <zone
              ref="zone"
              v-if="district && item === 'district'"
              :district="district"
              :active="item === locationType"
              @change="change"
            />
            <coordinate
              ref="coordinate"
              v-if="item === 'coordinate'"
              :active="item === locationType"
              @change="change"
            />
            <frame
              ref="map-sheet"
              v-if="item === 'map-sheet'"
              @change="change"
              :active="item === locationType"
            />
          </mapgis-ui-tab-pane>
        </mapgis-ui-tabs>
      </div>
    </mapgis-ui-comprehensive-query>
    <place-name-mapbox
      v-if="is2DMapMode"
      :defaultMarkerIcon="defaultMarkerIcon"
      :selectedMarkerIcon="selectedMarkerIcon"
      :hoverMarker="hoverMarker"
      :cluster="cluster"
      :geojson="current"
      :colorCluster="colorCluster"
    />
    <place-name-cesium
      v-else
      :defaultMarkerIcon="defaultMarkerIcon"
      :selectedMarkerIcon="selectedMarkerIcon"
      :hoverMarker="hoverMarker"
      :cluster="cluster"
      :geojson="current"
      :colorCluster="colorCluster"
    />
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  AppMixin,
  MapMixin,
  ExhibitionControllerMixin,
  Feature,
  Exhibition,
  WidgetMixin,
  PopupOverlay,
  api,
  markerIconInstance,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import Zone from './components/ZoneFrame/Zone.vue'
import Coordinate from './components/Coordinate/Coordinate.vue'
import Frame from './components/ZoneFrame/Frame.vue'
import PlaceNameMapbox from './components/PlaceName/PlaceNameMapbox.vue'
import PlaceNameCesium from './components/PlaceName/PlaceNameCesium.vue'
import * as turf from '@turf/turf'

const { IAttributeTableExhibition, AttributeTableExhibition } = Exhibition

export default {
  name: 'MpComprehensiveQuery',
  components: { Zone, Coordinate, Frame, PlaceNameMapbox, PlaceNameCesium },
  mixins: [WidgetMixin, ExhibitionControllerMixin, AppMixin, MapMixin],
  data() {
    return {
      /**
       * 查询范围
       */
      extent: null,

      /**
       * 是否开启聚合标注
       */
      cluster: false,

      colorCluster: '',

      /**
       * 控制面板回传回来的范围
       */
      geoJSONExtent: null,

      /**
       * 查询的结果
       */
      current: { type: 'FeatureCollection', features: [] },

      districtName: '',

      /**
       * 鼠标移入的marker
       */
      hoverMarker: [],

      /**
       * 行政区范围
       */
      district: null,

      /**
       * 默认图标
       */
      defaultMarkerIcon: '',

      /**
       * 上一id，用于清除之前的高亮区域
       */
      preId: '',

      entityNames: [],

      currentLayer: null,

      /**
       * 选中图标
       */
      selectedMarkerIcon: '',

      // 可选district：行政区划定位；coordinate：坐标定位；map-sheet：图幅号定位
      locationType: 'district',

      selectShowProperty: null,
    }
  },
  computed: {
    highlightStyle() {
      return baseConfigInstance.config.colorConfig
    },

    logoType() {
      return this.locationType || 'district'
    },

    /**
     * logo地址
     */
    logo() {
      return `${this.appAssetsUrl}${this.widgetInfo.uri}/images/${this.logoType}.png`
    },

    /**
     * 微件配置信息
     */
    config() {
      return this.widgetInfo.config
    },

    locationTypes() {
      return (
        this.config.placeName?.locationMode ||
        this.config.dataStore.locationMode
      )
    },
  },
  methods: {
    tab(item) {
      if (item === 'district') {
        return '行政区划定位'
      } else if (item === 'coordinate') {
        return '坐标定位'
      } else if (item === 'map-sheet') {
        return '图幅定位'
      }
    },

    /**
     * 点击关闭的回调函数
     */
    onClose() {
      this.$refs.zone &&
        this.$refs.zone.length > 0 &&
        this.$refs.zone[0].clear()
      this.$refs.coordinate &&
        this.$refs.coordinate.length > 0 &&
        this.$refs.coordinate[0].clear()
      this.$refs['map-sheet'] &&
        this.$refs['map-sheet'].length > 0 &&
        this.$refs['map-sheet'][0].clear()
      this.closePopup()
      this.analysisManager = null
      if (this.sceneController) {
        this.sceneController.removeCameraChangedEvent(this.changeFilterWithMap)
      }
    },

    /**
     * 查询时的回调函数（在没有查询范围时，采用当前屏幕的范围）
     */
    onSearch(isDataStoreQuery, val) {
      if (this.geoJSONExtent && Object.keys(this.geoJSONExtent).length > 0) {
        this.extent = this.geoJSONExtent
      } else {
        this.extent = this.getBounds()
      }
      // if (
      //   this.geoJSONExtent === null ||
      //   JSON.stringify(this.geoJSONExtent) === '{}' ||
      //   (isDataStoreQuery && !val)
      // ) {
      //   this.extent = this.getBounds()
      // } else {
      //   this.extent = this.geoJSONExtent
      // }
    },

    /**
     * 设置聚合图标的颜色
     */
    setColorCluster(color: string) {
      this.colorCluster = color
    },

    /**
     * 手动选择范围的时候回调函数
     */
    change(val) {
      this.geoJSONExtent = val
    },

    /**
     * 获取屏幕范围
     */
    getBounds() {
      let polygon
      if (this.is2DMapMode) {
        const { _ne, _sw } = this.map.getBounds()
        const { lng: xmax, lat: ymax } = _ne
        const { lng: xmin, lat: ymin } = _sw
        polygon = turf.polygon(
          [
            [
              [xmin, ymax],
              [xmax, ymax],
              [xmax, ymin],
              [xmin, ymin],
              [xmin, ymax],
            ],
          ],
          { name: 'bounds' }
        )
      } else {
        const Rectangle = this.viewer.camera.computeViewRectangle()
        const xmin = (Rectangle.west / Math.PI) * 180
        const ymax = (Rectangle.north / Math.PI) * 180
        const xmax = (Rectangle.east / Math.PI) * 180
        const ymin = (Rectangle.south / Math.PI) * 180
        polygon = turf.polygon(
          [
            [
              [xmin, ymax],
              [xmax, ymax],
              [xmax, ymin],
              [xmin, ymin],
              [xmin, ymax],
            ],
          ],
          { name: 'bounds' }
        )
      }
      return polygon
    },

    /**
     * 当前展示的结果回调函数（将查询结果展示至地图上）
     */
    currentResult(geojson) {
      // igs查询时设置字段别名在此处处理
      this.current = this.config.placeName
        ? this.setAliasKeys(geojson)
        : geojson
    },

    /**
     * 当前点击的条目的回调函数（实现点击后跳转中心点）
     */
    clickItem(feature) {
      const center = Feature.getGeoJSONFeatureCenter(feature)
      if (this.is2DMapMode) {
        this.map.flyTo({
          center: center,
          curve: 1,
          easing(t) {
            return t
          },
        })
      } else {
        const { viewer, Cesium } = this
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(center[0], center[1]),
          duration: 1000,
          orientation: {
            heading: Cesium.Math.toRadians(0), // 0 // 绕垂直于地心的轴旋转 ,相当于头部左右转
            pitch: Cesium.Math.toRadians(-90), // -90  //绕经度线旋转， 相当于头部上下
            roll: Cesium.Math.toRadians(0), // 0         //绕纬度线旋转 ，面对的一面瞬时针转
          },
        })
      }
    },

    /**
     * 当前选中的坐标
     */
    selectMarkers(selectMarkers) {
      this.hoverMarker = selectMarkers
    },

    /**
     * 聚合按钮改变时的回调
     */
    changeCluster(val) {
      this.current = { type: 'FeatureCollection', features: [] }
      this.cluster = val
    },

    /**
     * 打开属性表回调函数
     */
    openAttributeTable(exhibition) {
      this.addExhibition(new AttributeTableExhibition(exhibition))
      this.openExhibitionPanel()
    },

    /**
     * 关闭属性表回调函数
     */
    removeAttributeTable(exhibitionId) {
      this.removeExhibition(exhibitionId)
    },

    /**
     * 关闭右侧展示气泡框
     */
    closePopup() {
      this.popupOverlayInstance.setContent(null)
    },

    /**
     * 获取当前综合查询tab页key别名配置
     */
    selectItem(data) {
      // 先关闭气泡框
      this.closePopup()
      let showProperty
      if (data) {
        if (this.config.placeName) {
          showProperty = this.config.placeName.queryTable.find(
            (item) => item.placeName === data
          )
        } else {
          showProperty = this.config.dataStore.queryTable.find(
            (item) => item.placeName === data
          )
        }
      }
      // 如果配置为空采用默认配置
      this.selectShowProperty =
        showProperty && showProperty.showField.length > 0
          ? showProperty.showField
          : this.config.placeName?.defaultShowField ||
            this.config.dataStore.defaultShowField
    },

    /**
     * 设置别名key
     */
    setAliasKeys(data) {
      if (data && data.features.length > 0) {
        const dataCopy = JSON.parse(JSON.stringify(data))
        dataCopy.features.forEach((item) => {
          const property = {}
          const properties = item.properties
          Object.keys(properties).forEach((key) => {
            const info = this.selectShowProperty.find(
              (itemKey) => itemKey.fieldName === key
            )
            info
              ? (property[info.showName] = properties[key])
              : (property[key] = properties[key])
          })
          item.properties = property
        })
        return dataCopy
      }
      return data
    },
  },

  created() {
    this.popupOverlayInstance = PopupOverlay.getInstance()
  },

  async mounted() {
    try {
      const districtConfig = await api.getConfig('district')
      if (districtConfig && districtConfig.length > 0) {
        this.district = districtConfig[0]

        this.districtName = this.district?.defaults.text
      }
    } catch (error) {
      console.log(error)
    }

    try {
      this.defaultMarkerIcon = await markerIconInstance.unSelectIcon()
      this.selectedMarkerIcon = await markerIconInstance.selectIcon()
    } catch (error) {
      console.log(error)
    }
  },
}
</script>
