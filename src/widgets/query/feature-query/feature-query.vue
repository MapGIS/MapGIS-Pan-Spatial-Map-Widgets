<template>
  <div class="mp-widget-feature-query">
    <mapgis-ui-checkbox
      v-model="remainDrawArea"
      style="margin-bottom: 15px; width: 150px"
    >
      保留绘制区域
    </mapgis-ui-checkbox>
    <mp-draw-pro
      v-if="is2DMapMode && hasMapDisplay"
      ref="draw"
      :clearDrawMode="clearDrawMode"
      :featureConfig="featureConfig"
      @start="onDrawStart"
      @finished="onDrawFinished"
    />
    <mp-3d-draw-pro
      v-if="!is2DMapMode && hasGlobeDisplay"
      ref="draw3d"
      :clearDrawMode="clearDrawMode"
      :featureConfig="featureConfig"
      @start="onDrawStart"
      @finished="onDrawFinished"
    >
    </mp-3d-draw-pro>
    <mapgis-ui-toolbar>
      <mapgis-ui-toolbar-command-group>
        <mapgis-ui-toolbar-command
          v-for="type in queryTypes"
          :key="type.id"
          :title="type.label"
          :icon="type.icon"
          :active="queryType === type.id"
          @click="onOpenDraw(type.id)"
        />
        <mapgis-ui-toolbar-command
          title="删除"
          icon="delete"
          @click="onClearDraw"
        />
      </mapgis-ui-toolbar-command-group>
      <mapgis-ui-toolbar-space />
      <mapgis-ui-toolbar-command-group>
        <mapgis-ui-divider type="vertical" />
        <mapgis-ui-toolbar-command
          v-if="isShowLayerList"
          title="图层列表"
          icon="profile"
          :active="showLayerList"
          @click="showLayerListInfo"
        />
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-toolbar>
    <div v-show="showNearDistancePanel">
      <mapgis-ui-setting-form
        layout="horizontal"
        style="padding-top: 8px"
        size="default"
      >
        <mapgis-ui-form-item label="缓冲半径(像素)" :labelCol="{ span: 4 }">
          <mapgis-ui-slider
            v-model="sliderIndex"
            :marks="marks"
            :min="0"
            :max="limitsArray.length - 1"
            :tipFormatter="() => `${limits}像素`"
            :disabled="showNearDistanceInput"
          />
        </mapgis-ui-form-item>
        <mapgis-ui-switch-panel
          label="手动输入"
          v-model="showNearDistanceInput"
          size="small"
        >
          <mapgis-ui-form-item
            label="缓冲半径"
            v-show="showNearDistanceInput"
            style="margin-bottom: 10px"
          >
            <mapgis-ui-input-number
              class="mp-widget-near-radius-input"
              v-model="nearDistance"
              :min="1"
              :step="1"
            />
          </mapgis-ui-form-item>
          <mapgis-ui-form-item label="半径单位" v-show="showNearDistanceInput">
            <mapgis-ui-select
              class="mp-widget-near-radius-input"
              v-model="nearDistanceUnit"
            >
              <mapgis-ui-select-option
                :key="index"
                v-for="(unit, index) in nearDistanceUnitArray"
                :value="unit.value"
              >
                {{ unit.key }}
              </mapgis-ui-select-option>
            </mapgis-ui-select>
          </mapgis-ui-form-item>
        </mapgis-ui-switch-panel>
      </mapgis-ui-setting-form>
    </div>
    <div v-if="showLayerList">
      <mapgis-ui-layer-check-list
        :layers="operateLayerData"
        @on-check="onCheckLayer"
        :isSingleCheck="isSingleCheck"
        :isExpandAll="isExpandAll"
        :checkedKeys="checkedKeys"
        :isCheckAll="isCheckAll"
      />
      <!-- <mapgis-ui-layer-select-list
        :layers="operateLayerData"
        @on-select="onCheckLayer"
      /> -->
    </div>
    <mp-geo-json-input-draw
      :is2DMapMode="is2DMapMode"
      v-show="queryType === 'MyInputString'"
      @close="queryType = ''"
      @draw-shape="onDrawShape"
      @draw-shape-3d="onDrawShape3D"
    />
    <mp-polygon-input-draw
      :is2DMapMode="is2DMapMode"
      v-show="queryType === 'MyInputPolygon'"
      @close="queryType = ''"
      @draw-shape="onDrawShape"
      @draw-shape-3d="onDrawShape3D"
    />
    <mp-upload-file-draw
      :is2DMapMode="is2DMapMode"
      v-show="queryType === 'MyUpload'"
      @close="queryType = ''"
      @draw-shape="onDrawShape"
      @draw-shape-3d="onDrawShape3D"
    />
    <mp-region-draw
      v-show="queryType === 'MyRegion'"
      :is2DMapMode="is2DMapMode"
      :baseUrl="baseUrl"
      :regionsUrl="widget.config.regions"
      @draw-shape="onDrawShape"
      @draw-shape-3d="onDrawShape3D"
      @close="queryType = ''"
    ></mp-region-draw>
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  ExhibitionControllerMixin,
  LayerType,
  IGSMapImageLayer,
  IGSVectorLayer,
  OGCWMTSLayer,
  Sublayer,
  Rectangle3D,
  Point3D,
  Objects,
  Exhibition,
  Feature,
  baseConfigInstance,
  dataCatalogManagerInstance,
  ActiveResultSet,
  DataStoreCatalog,
  Overlay,
  events,
  eventBus,
  DisplayModeMixin,
  ModelPickController,
} from '@mapgis/web-app-framework'
import * as Zondy from '@mapgis/webclient-es6-service'
import { lineString, polygon, point, multiPolygon } from '@turf/helpers'
import booleanDisjoint from '@turf/boolean-disjoint'
import booleanContains from '@turf/boolean-contains'
import MpGeoJsonInputDraw from './components/MpGeoJsonInputDraw/MpGeoJsonInputDraw.vue'
import MpPolygonInputDraw from './components/MpPolygonInputDraw/MpPolygonInputDraw.vue'
import MpUploadFileDraw from './components/MpUploadFileDraw/MpUploadFileDraw.vue'
import MpRegionDraw from './components/MpRegionDraw/MpRegionDraw.vue'
import { Style } from '@mapgis/webclient-es6-service'
import featureQueryMixin from '../../../components/mixin/feature-query-mixin'
import QueryType from '../../../components/mixin/query-type'

const { LineStyle, PointStyle, FillStyle } = Style

const { IAttributeTableListExhibition, AttributeTableListExhibition } =
  Exhibition

const { FeatureQuery, ArcGISFeatureQuery } = Feature

export default {
  name: 'MpFeatureQuery',
  mixins: [
    WidgetMixin,
    ExhibitionControllerMixin,
    DisplayModeMixin,
    featureQueryMixin,
  ],
  components: {
    MpGeoJsonInputDraw,
    MpPolygonInputDraw,
    MpUploadFileDraw,
    MpRegionDraw,
  },
  data() {
    return {
      showLayerList: false,
      // 默认提供的缓冲半径(像素)可选值
      limitsArray: [1, 2, 5, 10, 20],
      // 是否显示缓冲半径面板，仅有绘制点和线时，才显示缓冲半径面板
      showNearDistancePanel: false,
      // 是否显示缓冲半径输入框
      showNearDistanceInput: false,
      // 缓冲半径初始值
      nearDistance: 1,
      // 缓冲半径单位
      nearDistanceUnit: 'pixel',
      // 可选的缓冲半径单位
      nearDistanceUnitArray: [
        { key: '像素', value: 'pixel' },
        { key: '厘米', value: 'centimeter' },
        { key: '米', value: 'meter' },
        { key: '千米', value: 'kilometer' },
      ],
      sliderIndex: 0,
      queryType: '',
      tempActiveExhibitionId: '',
      // 判断微件是否执行了失活onDeActive函数
      doDeActive: false,
      defaultQueryTypes2d: [
        QueryType.Point,
        QueryType.Circle,
        QueryType.Rectangle,
        QueryType.Polygon,
        QueryType.LineString,
        QueryType.MyInputString,
        QueryType.MyInputPolygon,
        QueryType.MyUpload,
        QueryType.MyRegion,
      ],
      defaultQueryTypes3d: [
        QueryType.Point,
        QueryType.Circle,
        QueryType.Polygon,
        QueryType.LineString,
        QueryType.Rectangle,
        QueryType.Cube,
        QueryType.MyInputString,
        QueryType.MyInputPolygon,
        QueryType.MyUpload,
        QueryType.MyRegion,
      ],
      queryTypes2DrawModes: {
        Point: 'draw-point',
        Circle: 'draw-circle',
        Rectangle: 'draw-rectangle',
        Polygon: 'draw-polygon',
        LineString: 'draw-polyline',
        Cube: 'draw-cube',
      },
      checkedTreeKeys: [],
      selectedKeys: [],
      layerListArr: [],
      showTree: false, // 确保tree保持展开状态
      isSingleCheck: false,
      isExpandAll: true,
      checkedKeys: [],
      isCheckAll: true,
      checkList: [],
      layerKeyRelation: {},
      checkLayer: [],
      operateLayerData: [],
      currentId: '',
      isDrawStart: false,
      isQueryFeatures: false, // 是否在查询要素，并显示结果集，显示结果集会触发onDeActive事件，防止取消连续查询事件
      remainDrawArea: false, // 是否保留绘制区域
    }
  },
  computed: {
    marks() {
      return {
        ...this.limitsArray,
      }
    },
    limits() {
      return this.limitsArray[this.sliderIndex]
    },
    queryTypes2d() {
      return this.widgetInfo.config.queryType.filter((type) => {
        return this.defaultQueryTypes2d.includes(type.id)
      })
    },
    queryTypes3d() {
      return this.widgetInfo.config.queryType.filter((type) => {
        return this.defaultQueryTypes3d.includes(type.id)
      })
    },
    queryTypes() {
      return this.is2DMapMode ? this.queryTypes2d : this.queryTypes3d
    },
    drawComponent() {
      return this.is2DMapMode ? this.$refs.draw : this.$refs.draw3d
    },
    isShowLayerList() {
      return this.widgetInfo.config.isShowLayerList
    },
    clearDrawMode: {
      get() {
        return !this.remainDrawArea
      },
    },
    isContinuous() {
      return this.widgetInfo.config.isContinuous
    },
    featureConfig() {
      return baseConfigInstance.config.colorConfig.feature
    },
    fillColor() {
      return this.featureConfig && this.featureConfig.reg
        ? this.featureConfig.reg.color
        : '#1890ff'
    },
    fillOutlineColor() {
      return this.featureConfig && this.featureConfig.line
        ? this.featureConfig.line.color
        : '#1890ff'
    },
    lineWidth() {
      return this.featureConfig && this.featureConfig.line
        ? Number(this.featureConfig.line.size)
        : 3
    },
  },

  // 二三维地图模式切换时
  watch: {
    mapRender() {
      this.onClearDraw()
      if (!this.is2DMapMode) {
        // 在切到三维视图后，销毁mapboxgl的绘制组件，每次切回二维，maoboxgl的绘制组件都会初始化。
        this.$refs.draw && this.$refs.draw.removeDraw()
      }
    },
    'document.defaultMap': {
      deep: true,
      immediate: true,
      handler() {
        this.dealwithLayers()
      },
    },
    currentId(newVal, oldVal) {
      if (oldVal) {
        if (this.map) {
          if (this.map.getLayer(`${oldVal}fill`)) {
            this.map.removeLayer(`${oldVal}fill`)
          }
          if (this.map.getLayer(`${oldVal}line`)) {
            this.map.removeLayer(`${oldVal}line`)
          }
          if (this.map.getSource(oldVal)) {
            this.map.removeSource(oldVal)
          }
        }
        this.sceneOverlays.removeEntityByName(oldVal)
      }
    },
  },

  created() {
    this.widgetInfo.config.queryType.forEach((type) => {
      if (type.id === '') {
        type.id = QueryType.Rectangle
      }
    })
    if (this.hasGlobeDisplay) {
      this.sceneController = Objects.SceneController.getInstance(
        this.Cesium,
        this.vueCesium,
        this.viewer
      )
      this.sceneOverlays = Overlay.SceneOverlays.getInstance(
        this.Cesium,
        this.vueCesium,
        this.viewer
      )
    }
  },
  mounted() {
    eventBus.$on(events.MARKER_CLICK, this.markerClick)
  },
  methods: {
    getFullExtentByBoundingSphere(center, radius) {
      const { Cesium, viewer } = this

      const centerCartographic = Cesium.Cartographic.fromCartesian(center)
      const earthRadius = 6371000.0 // 地球半径，单位米
      const angularDistance = radius / earthRadius // 角度距离
      const lat = centerCartographic.latitude
      const lon = centerCartographic.longitude
      const dLat = angularDistance / Math.cos(lon)
      const dLon = angularDistance

      const northLat = lat + dLat
      const southLat = lat - dLat
      const eastLon = lon + dLon
      const westLon = lon - dLon

      const northEast = Cesium.Cartesian3.fromRadians(eastLon, northLat, 0)
      const southWest = Cesium.Cartesian3.fromRadians(westLon, southLat, 0)

      const northEastCoordinate = Cesium.Cartographic.fromCartesian(northEast)
      const southwestCoordinate = Cesium.Cartographic.fromCartesian(southWest)
      const fullExtent = {}
      if (northEastCoordinate.longitude > southwestCoordinate.longitude) {
        fullExtent.xmin = Cesium.Math.toDegrees(southwestCoordinate.longitude)
        fullExtent.xmax = Cesium.Math.toDegrees(northEastCoordinate.longitude)
      } else {
        fullExtent.xmin = Cesium.Math.toDegrees(northEastCoordinate.longitude)
        fullExtent.xmax = Cesium.Math.toDegrees(southwestCoordinate.longitude)
      }

      if (northEastCoordinate.latitude > southwestCoordinate.latitude) {
        fullExtent.ymin = Cesium.Math.toDegrees(southwestCoordinate.latitude)
        fullExtent.ymax = Cesium.Math.toDegrees(northEastCoordinate.latitude)
      } else {
        fullExtent.ymin = Cesium.Math.toDegrees(northEastCoordinate.latitude)
        fullExtent.ymax = Cesium.Math.toDegrees(southwestCoordinate.latitude)
      }

      return fullExtent
    },
    markerClick(marker) {
      if (this.isContinuous && this.drawComponent) {
        this.drawComponent.closeDraw()
        setTimeout(() => {
          this.drawComponent.openDraw(this.queryTypes2DrawModes[this.queryType])
        }, 100)
      }
    },
    onDrawShape3D(shapeInfo) {
      this.currentId = shapeInfo.id
      const fillColor = new this.Cesium.Color.fromCssColorString(this.fillColor)
      const lineColor = new this.Cesium.Color.fromCssColorString(
        this.fillOutlineColor
      )
      const { xmin, ymin, xmax, ymax } =
        Feature.getGeoJSONFeatureBound(shapeInfo)
      const { type, coordinates } = shapeInfo.geometry
      if (type === 'LineString') {
        // 将查询类型置为LineString
        this.queryType = 'LineString'
        this.sceneOverlays.addLine(
          shapeInfo.id,
          coordinates.join(',').split(',').map(Number),
          this.lineWidth,
          lineColor
        )
      } else {
        coordinates.forEach((coordinate) => {
          this.sceneOverlays.addPolygon(
            shapeInfo.id,
            coordinate.join(',').split(',').map(Number),
            fillColor
          )
        })
      }
      this.viewer.camera.flyTo({
        destination: this.Cesium.Rectangle.fromDegrees(xmin, ymin, xmax, ymax),
      })
      this.doQuery({ type, coordinates })
    },
    onDrawShape(shapeInfo) {
      this.currentId = shapeInfo.id
      this.map &&
        this.map.addSource(shapeInfo.id, {
          type: 'geojson',
          data: shapeInfo.geometry,
        })
      let style
      const { coordinates, type } = shapeInfo.geometry
      if (type === 'MultiPolygon' || type === 'Polygon') {
        const fillStyle = new FillStyle({
          color: this.fillColor,
          outlineColor: this.fillOutlineColor,
        })
        style = {
          type: 'fill',
          ...fillStyle.toMapboxStyle(),
        }
        this.map &&
          this.map.addLayer({
            id: `${shapeInfo.id}fill`,
            source: shapeInfo.id,
            ...style,
          })
      }

      const lineStyle = new LineStyle({
        color: this.fillOutlineColor,
        width: this.lineWidth,
      })
      style = {
        type: 'line',
        ...lineStyle.toMapboxStyle(),
      }
      this.map &&
        this.map.addLayer({
          id: `${shapeInfo.id}line`,
          source: shapeInfo.id,
          ...style,
        })
      const { xmin, ymin, xmax, ymax } =
        Feature.getGeoJSONFeatureBound(shapeInfo)
      this.map &&
        this.map.fitBounds(
          [
            [xmin, ymin],
            [xmax, ymax],
          ],
          {
            padding: { top: 100, bottom: 100, left: 200, right: 200 },
          }
        )
      this.doQuery({ type, coordinates })
    },
    doQuery(obj) {
      const { type, coordinates } = obj
      let shape
      switch (type) {
        case QueryType.MultiPolygon:
          shape = coordinates
          break
        case QueryType.Polygon:
          shape = coordinates[0].map((item) => {
            return {
              x: item[0],
              y: item[1],
            }
          })
          break
        case QueryType.LineString:
          shape = coordinates.map((item) => {
            return {
              x: item[0],
              y: item[1],
            }
          })
          break
        default:
          return
      }
      this.queryType = type
      this.queryLayers(shape)
    },
    // 微件激活时
    onActive() {
      if (this.map) {
        this.map.getCanvas().style.cursor = this.widgetInfo.config.cursorType
      }

      this.doDeActive = false
      // 禁用拾取功能
      ModelPickController.unablePick = true
    },

    // 微件关闭时
    onClose() {
      this.onClearDraw()
      // 恢复拾取功能
      ModelPickController.unablePick = false
      if (!this.doDeActive && this.map) {
        this.map.getCanvas().style.cursor = 'grab'
      }
    },

    // 微件失活时
    onDeActive() {
      // 如果在查询要素，并显示结果集，显示结果集会触发onDeActive事件，防止取消连续查询事件
      if (this.isQueryFeatures) {
        return
      }
      this.isQueryFeatures = false
      this.clearDrawMode && this.onClearDraw()
      this.doDeActive = true
      // 恢复拾取功能
      ModelPickController.unablePick = false
      if (this.map) {
        this.map.getCanvas().style.cursor = 'grab'
      }
    },

    // 打开绘制，点击图标激活对应类型的绘制功能
    onOpenDraw(type) {
      // 绘制点和线时，才显示缓冲半径面板
      if (type === 'Point' || type === 'LineString') {
        this.showNearDistancePanel = true
      } else {
        this.showNearDistancePanel = false
      }
      this.drawComponent && this.drawComponent.closeDraw()
      // this.sceneOverlays.removeAllEntities()
      if (this.currentId) {
        this.currentId = '' // 清空当前id用于清除页面已绘制图形
      }
      this.queryType = type
      this.drawComponent &&
        this.drawComponent.openDraw(this.queryTypes2DrawModes[type])
    },

    // 移除绘制
    onClearDraw() {
      this.currentId = ''
      this.queryType = ''
      const drawComponent = this.is2DMapMode
        ? this.$refs.draw
        : this.$refs.draw3d
      drawComponent && drawComponent.closeDraw()
    },

    // 'start'响应事件(开始绘制)
    onDrawStart() {
      this.isDrawStart = true
    },

    // 'finished'响应事件(结束绘制)
    onDrawFinished({ mode, feature, shape, center }) {
      if (shape && this.isDrawStart) {
        this.queryLayers(shape)
        this.isDrawStart = false
        if (this.isContinuous) {
          setTimeout(() => {
            if (this.clearDrawMode) {
              this.drawComponent && this.drawComponent.closeDraw()
              if (this.currentId) {
                this.currentId = '' // 清空当前id用于清除页面已绘制图形
              }
            } else {
              this.drawComponent && this.drawComponent.removeLastDraw()
            }
            this.drawComponent &&
              this.drawComponent.openDraw(
                this.queryTypes2DrawModes[this.queryType]
              )
          }, 1000)
        }
      }
      if (!this.isContinuous) {
        this.queryType = ''
      }
    },

    queryLayers(shape: Record<string, number>) {
      if (!this.document) {
        return
      }

      // 如果图层列表处于打开状态则使用图层列表，如果配置显示但未打开依然使用document中的图层列表
      const layers = this.showLayerList
        ? this.checkLayer
        : this.document.defaultMap.layers()

      layers.forEach((layer) => {
        if (
          ![
            LayerType.IGSScene,
            LayerType.ModelCache,
            LayerType.IGSTile,
          ].includes(layer.type)
        ) {
          // 通过绑定查询服务的图层不再进行图层与绘制区域是否有交集的判断，改为绑定的查询服务与绘制区域是否有交集判断
          const isCrossWithLayer = this.isCrossWithRange(
            layer.fullExtent,
            shape,
            this.queryType,
            layer.spatialReference?.wkid
          )

          if (!isCrossWithLayer) {
            return
          }
        }

        // fix(6188): 三维视图倾斜一定角度，绘制交互异常
        // 修改人: 杨琨 2024-9-2
        // 修改说明: 重构计算缓冲半径的逻辑，
        // 通过缓冲半径单位，将用户设置的缓冲半径值，转化为服务需要的缓冲半径值
        // 默认单位为像素，根据分辨率计算一像素代表多少米，之后换算为服务端需要的缓冲半径值
        // 其他可选单位为千米、米、厘米，当前仅支持经纬度坐标系图层的要素查询
        let nearDis
        if ([QueryType.Point, QueryType.LineString].includes(this.queryType)) {
          // 线类型取第一个点算缓冲半径
          nearDis = this.getNearDistance(
            QueryType.Point === this.queryType ? shape : shape[0],
            layer,
            this.nearDistance
          )
        }

        const geometry = this.toQueryGeometry(
          layer,
          shape,
          nearDis,
          this.queryType
        )

        switch (layer.type) {
          // IGSVector跟IGSMapImage走相同逻辑
          case LayerType.IGSVector:
          case LayerType.IGSMapImage:
            this.queryFeaturesByDoc(layer, geometry)
            break
          case LayerType.IGSScene:
          case LayerType.ModelCache:
            if (
              layer.searchParams &&
              layer.searchParams.mapList &&
              layer.searchParams.mapList.length > 0
            ) {
              this.queryFeaturesByBindDoc(
                layer,
                geometry,
                shape,
                this.queryType
              )
            } else {
              this.queryFeaturesByIGSScene(
                layer,
                geometry,
                shape,
                this.queryType
              )
            }

            break
          case LayerType.ArcGISMapImage:
            this.queryFeaturesByArcgis(layer, geometry)
            break
          case LayerType.IGSTile:
            if (!layer.searchParams || !layer.searchParams.searchName) {
              return
            }
            if (layer.sublayers && layer.sublayers.length > 0) {
              this.queryFeaturesByBindDoc(
                layer,
                geometry,
                shape,
                this.queryType
              )
            } else {
              this.quertFeatruesByVector(layer, geometry, shape, this.queryType)
            }
            break
          default:
            break
        }
      })
    },

    // 关联二维地图文档的三维服务或瓦片服务走这个查询
    async queryFeaturesByBindDoc(layer, geometry, shape, queryType) {
      if (!layer.isVisible) {
        return
      }
      const url = new URL(layer.url)
      let domain = url.origin
      const {
        extend,
        searchParams: {
          searchFullExtent,
          searchName,
          searchServiceType,
          searchIp,
          searchPort,
          searchTokenKey,
          searchTokenValue,
          _innerLayer,
        },
      } = layer
      const queryPrefix = extend.queryPrefix || ''
      const querySuffix = extend.querySuffix || ''

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        description: '',
        options: [],
        popupOption: extend.popupOption,
      }
      let activeOptionId = ''
      const allSublayers = []
      switch (layer.type) {
        case LayerType.IGSScene:
          this.getAllSublayer(allSublayers, layer.activeScene.sublayers)
          break

        case LayerType.ModelCache:
          allSublayers.push({
            title: layer.serviceName,
            id: layer.id,
          })
          break
        case LayerType.IGSTile:
          this.getAllSublayer(allSublayers, layer.sublayers)
          break
        default:
          break
      }

      for (let index = 0; index < allSublayers.length; index++) {
        const sublayer = allSublayers[index]
        let map = {}
        switch (layer.type) {
          case LayerType.IGSScene:
          case LayerType.ModelCache:
            map = layer.searchParams.mapList.find(
              (mapDoc) =>
                `${queryPrefix}${mapDoc.LayerName}${querySuffix}` ===
                sublayer.title
            )
            break
          case LayerType.IGSTile:
            map.Range = searchFullExtent
            map.URL = sublayer.url
            map.ID = sublayer.id
            break
          default:
            break
        }

        if (map) {
          // 如果匹配到了绑定的查询服务子图层，再进行绘制区域与子图层是否有交集判断
          let isExecuteQuery = false
          if (map.Range) {
            isExecuteQuery = this.isCrossWithRange(
              map.Range,
              shape,
              queryType,
              layer.spatialReference?.wkid
            )
          }

          if (!isExecuteQuery) {
            continue
          }
          const isDataStoreQuery = false
          const ipPortObj = this.getIpPort({
            isDataStoreQuery,
          })

          // 如果查询服务设置了ip和端口则使用设置的ip和端口
          if (searchIp) {
            ipPortObj.ip = searchIp
          }

          if (searchPort) {
            ipPortObj.port = searchPort
          }

          if (searchIp && searchPort) {
            domain = `${url.protocol}//${searchIp}:${searchPort}`
          }

          let fields
          if (_innerLayer) {
            fields = this.getLayerFields(_innerLayer, map.ID)
          }

          const options = {
            id: sublayer.id,
            name: sublayer.title,
            domain,
            ...ipPortObj,
            serverType: layer.type,
            gdbp: map.URL,
            geometry,
            is3dBind2dData: true,
            serverName: searchName,
            serverUrl: layer.url,
            layerIndex: map.ID,
            searchServiceType,
            token: {
              tokenKey: searchTokenKey,
              tokenValue: searchTokenValue,
            },
            originalUrl: layer.layer
              ? layer.layer.originalUrl
              : layer.originalUrl,
            fields,
          }
          exhibition.options.push(options)
          /**
           * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
           * 修改人：龚跃健
           * 修改时间：2023/1/31
           */
          /**
           * fix(6188): 调用了额外的查询要素数目的接口
           * 修改人：杨琨 2024/9/3
           * 修改说明：查询到第一个要素数目大于0的子图层后，就停止要素数目的查询，单纯要素查数目比查询要素数据要快
           */
          if (!activeOptionId) {
            const { TotalCount } = await this.queryCount(
              options,
              layer.type === LayerType.IGSVector3D
            )
            if (TotalCount > 0) {
              activeOptionId = sublayer.id
            }
          }
        }
      }
      if (activeOptionId) {
        this.setActiveExhibitionIdAndOptionId(exhibition, activeOptionId)
      }
    },

    getAllSublayer(allSublayers, sublayers) {
      sublayers.forEach((sublayer) => {
        if (sublayer.sublayers && sublayer.sublayers.length === 0) {
          allSublayers.push(sublayer)
        } else {
          this.getAllSublayer(allSublayers, sublayer.sublayers)
        }
      })
    },

    async queryFeaturesByIGSScene(layer, geometry, shape, queryType) {
      if (!layer.isVisible) {
        return
      }

      let ip, port, domain, tokenKey, tokenValue

      const url = new URL(layer.url)
      domain = url.origin
      ip = url.hostname
      port = url.port
      const { extend } = layer

      if (layer.tokenKey && layer.tokenValue) {
        tokenKey = layer.tokenKey
        tokenValue = layer.tokenValue
      }

      const { searchParams } = layer
      if (searchParams) {
        const {
          searchFullExtent,
          searchIp,
          searchPort,
          searchTokenKey,
          searchTokenValue,
        } = searchParams

        let isExecuteQuery = false
        if (searchFullExtent) {
          isExecuteQuery = this.isCrossWithRange(
            searchFullExtent,
            shape,
            queryType,
            layer.spatialReference?.wkid
          )
        }

        if (!isExecuteQuery) {
          return
        }

        if (searchIp) {
          ip = searchIp
        }

        if (searchPort) {
          port = searchPort
        }

        if (searchIp && searchPort) {
          domain = `${url.protocol}//${searchIp}:${searchPort}`
        }

        if (searchTokenKey && searchTokenValue) {
          tokenKey = searchTokenKey
          tokenValue = searchTokenValue
        }
      }

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        description: '',
        options: [],
        popupOption: extend.popupOption,
      }
      let activeOptionId = ''
      const sublayers = this.showLayerList
        ? this.getSublayers(layer.id)
        : layer.activeScene?.sublayers
      if (
        layer.searchParams &&
        layer.searchParams.searchName?.includes('gdbp')
      ) {
        let fields
        const _innerLayer = layer.searchParams?._innerLayer
        if (_innerLayer) {
          fields = this.getLayerFields(_innerLayer)
        }
        exhibition.options.push({
          id: `${layer.id}:0`,
          name: layer.title,
          ip: ip || baseConfigInstance.config.ip,
          port: port || Number(baseConfigInstance.config.port),
          domain,
          serverType: layer.type,
          gdbp: layer.searchParams.searchName,
          geometry: geometry,
          is3dBind2dData: true,
          token: {
            tokenKey,
            tokenValue,
          },
          originalUrl: layer.layer
            ? layer.layer.originalUrl
            : layer.originalUrl,
          fields,
        })
        // const { xmin, ymin, xmax, ymax, zmin, zmax } = geometry
        // const queryGeometry = new Rectangle3D(
        //   xmin,
        //   ymin,
        //   zmin,
        //   xmax,
        //   ymax,
        //   zmax
        // )

        const options = {
          ip: ip || baseConfigInstance.config.ip,
          port: port || Number(baseConfigInstance.config.port),
          domain,
          geometry,
          url: layer.searchParams.searchName,
          returnCountOnly: true,
          tokenKey,
          tokenValue,
        }
        const json = await FeatureQuery.igsQueryResourceServer(options)
        const TotalCount = json.count
        if (TotalCount > 0) {
          activeOptionId = `${layer.id}:0`
        }
        this.setActiveExhibitionIdAndOptionId(exhibition, activeOptionId)
      }
    },

    async quertFeatruesByVector(
      layer: IGSVectorLayer,
      geometry,
      shape,
      queryType
    ) {
      if (!layer.isVisible) {
        return
      }
      // const { extend } = layer
      // const url = new URL(layer.url)
      // const domain = url.origin

      let ip, port, domain, tokenKey, tokenValue, fields

      const url = new URL(layer.url)
      domain = url.origin
      ip = url.hostname
      port = url.port
      const { extend } = layer

      if (layer.tokenKey && layer.tokenValue) {
        tokenKey = layer.tokenKey
        tokenValue = layer.tokenValue
      }

      const { searchParams } = layer
      if (searchParams && searchParams.searchName) {
        const {
          searchFullExtent,
          searchIp,
          searchPort,
          searchTokenKey,
          searchTokenValue,
          _innerLayer,
        } = searchParams

        let isExecuteQuery = false
        if (searchFullExtent) {
          isExecuteQuery = this.isCrossWithRange(
            searchFullExtent,
            shape,
            queryType,
            layer.spatialReference?.wkid
          )
        }

        if (!isExecuteQuery) {
          return
        }

        if (searchIp) {
          ip = searchIp
        }

        if (searchPort) {
          port = searchPort
        }

        if (searchIp && searchPort) {
          domain = `${url.protocol}//${searchIp}:${searchPort}`
        }

        if (searchTokenKey && searchTokenValue) {
          tokenKey = searchTokenKey
          tokenValue = searchTokenValue
        }

        if (_innerLayer) {
          fields = this.getLayerFields(_innerLayer)
        }
      }

      const isDataStoreQuery = false
      const DNSName = undefined
      const ipPortObj = this.getIpPort({
        isDataStoreQuery,
      })
      if (ip && port) {
        ipPortObj.ip = ip
        ipPortObj.port = port
      }

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        options: [
          {
            id: layer.id,
            DNSName,
            name: layer.title,
            isDataStoreQuery,
            domain,
            ...ipPortObj,
            serverType: layer.type,
            gdbp: layer.gdbps || layer.searchParams.searchName,
            geometry: geometry,
            token: {
              tokenKey,
              tokenValue,
            },
            fields,
          },
        ],
        popupOption: extend.popupOption,
      }
      /**
       * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
       * 修改人：龚跃健
       * 修改时间：2023/1/31
       */
      const { TotalCount } = await this.queryCount(exhibition.options[0])
      this.setActiveExhibitionIdAndOptionId(exhibition, null, TotalCount)
    },

    async queryFeaturesByArcgis(layer, geometry) {
      if (!layer.isVisible) {
        return
      }
      const { extend, _innerLayer } = layer
      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        description: '',
        options: [],
        popupOption: extend.popupOption,
      }
      let activeOptionId = ''

      const sublayers = this.showLayerList
        ? this.getSublayers(layer.id)
        : layer.allSublayers
      for (let index = 0; index < sublayers.length; index++) {
        const sublayer = sublayers[index]
        if (!sublayer.visible) {
          continue
        }
        let fields
        if (_innerLayer) {
          fields = this.getLayerFields(_innerLayer, sublayer.id)
        }

        // ArcGIS地图服务中sublayer.id为Number类型，转为字符串类型，保持属性表逻辑一致
        exhibition.options.push({
          id: sublayer.id + '',
          name: sublayer.title,
          serverType: layer.type,
          layerIndex: sublayer.id,
          serverUrl: layer.url,
          geometry: geometry,
          fields,
        })
        /**
         * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
         * 修改人：龚跃健
         * 修改时间：2023/1/31
         */
        if (!activeOptionId) {
          const { count } = await ArcGISFeatureQuery.getTotal({
            f: 'pjson',
            where: null,
            geometry,
            serverUrl: layer.url,
            layerIndex: sublayer.id,
          })

          if (count > 0) {
            activeOptionId = sublayer.id + ''
          }
        }
      }
      this.setActiveExhibitionIdAndOptionId(exhibition, activeOptionId)
    },

    getLayerTranform(layer) {
      let tranform = null
      const {
        activeScene: { sublayers },
      } = layer
      let visibleSublayerId = ''

      if (sublayers) {
        sublayers.forEach((sublayer) => {
          if (sublayer.visible) {
            visibleSublayerId = sublayer.id
          }
        })
      }

      if (visibleSublayerId !== '') {
        const source = this.sceneController.findSource(visibleSublayerId)
        if (source) {
          tranform = source.root.transform
        }
      }
      return tranform
    },

    getLayerOffset(layer) {
      let offset = null
      const {
        activeScene: { sublayers },
      } = layer
      let visibleSublayerId = ''

      if (sublayers) {
        sublayers.forEach((sublayer) => {
          if (sublayer.visible) {
            visibleSublayerId = sublayer.id
          }
        })
      }

      if (visibleSublayerId !== '') {
        const source = this.sceneController.findSource(visibleSublayerId)
        if (source) {
          offset = source._asset.offset
        }
      }
      return offset
    },

    onCheckLayer(keys, keysInfo) {
      // 图层与子图层的对应关系
      this.layerKeyRelation = {}
      this.checkList = keysInfo
      this.checkLayer = []
      keysInfo.forEach((item) => {
        // 单图层
        if (!item.layer?.id) {
          this.layerKeyRelation[item.id] = []
          this.layerKeyRelation[item.id].push(item.key)
          this.checkLayer.push(item)
          return
        }
        if (this.layerKeyRelation[item.layer.id]) {
          this.layerKeyRelation[item.layer.id].push(item.key)
        } else {
          this.layerKeyRelation[item.layer.id] = []
          this.layerKeyRelation[item.layer.id].push(item.key)
          this.checkLayer.push(item.layer)
        }
      })
    },

    showLayerListInfo() {
      this.showLayerList = !this.showLayerList
    },
    dealwithLayers() {
      const layers = this.document.clone().defaultMap.layers()
      layers.forEach((item) => {
        if (
          item.type === LayerType.IGSScene ||
          item.type === LayerType.ModelCache
        ) {
          item.sublayers = item.activeScene?.sublayers
        } else if (item.type === LayerType.VectorTile) {
          item.sublayers = item.currentStyle.layers.map((row) => ({
            ...row,
            visible:
              row.layout === undefined ||
              row.layout.visibility === undefined ||
              row.layout.visibility === 'visible',
            id: row.id,
            title: row.description || row.id,
          }))
        } else if (item.type === LayerType.ArcGISMapImage) {
          item.sublayers = item.allSublayers
        }
      })
      this.operateLayerData = layers
    },
  },
  beforeDestroy() {
    eventBus.$off(events.MARKER_CLICK)
  },
}
</script>

<style scoped>
.mp-widget-feature-query {
  display: flex;
  flex-direction: column;
}
.mp-widget-near-radius-input {
  margin-left: 170px;
  width: 170px;
}
</style>
