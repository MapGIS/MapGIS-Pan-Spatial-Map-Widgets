<template>
  <div class="mp-widget-feature-query">
    <mp-draw-pro
      ref="draw"
      :clearDrawMode="clearDrawMode"
      @start="onDrawStart"
      @finished="onDrawFinished"
    />
    <mp-3d-draw-pro
      ref="draw3d"
      :clearDrawMode="clearDrawMode"
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
        <mapgis-ui-toolbar-command
          title="设置"
          icon="setting"
          :active="showSettingPanel"
          @click="showSettingsInfo"
        />
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-toolbar>
    <div v-show="showSettingPanel">
      <mapgis-ui-setting-form layout="vertical" style="padding-top: 8px">
        <mapgis-ui-form-item label="缓冲半径(km)">
          <mapgis-ui-slider
            v-model="sliderIndex"
            :marks="marks"
            :min="0"
            :max="limitsArray.length - 1"
            :tipFormatter="() => `${limits}km`"
          />
        </mapgis-ui-form-item>
      </mapgis-ui-setting-form>
    </div>
    <div v-show="showLayerList">
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
} from '@mapgis/web-app-framework'
import * as Zondy from '@mapgis/webclient-es6-service'
import {
  lineString,
  polygon,
  point,
  multiPolygon,
  booleanCrosses,
  booleanPointInPolygon,
  booleanDisjoint,
  booleanContains,
} from '@turf/turf'
import MpGeoJsonInputDraw from './MpGeoJsonInputDraw.vue'
import MpPolygonInputDraw from './MpPolygonInputDraw.vue'
import MpUploadFileDraw from './MpUploadFileDraw.vue'
import MpRegionDraw from './MpRegionDraw.vue'

const { IAttributeTableListExhibition, AttributeTableListExhibition } =
  Exhibition

const { FeatureQuery, ArcGISFeatureQuery } = Feature

enum QueryType {
  Point = 'Point',
  Circle = 'Circle',
  Rectangle = 'Rectangle',
  Polygon = 'Polygon',
  LineString = 'LineString',
  PickModel = 'PickModel',
  Cube = 'Cube',
  MultiPolygon = 'MultiPolygon',
  MyInputString = 'MyInputString',
  MyInputPolygon = 'MyInputPolygon',
  MyUpload = 'MyUpload',
  MyRegion = 'MyRegion',
}

export default {
  name: 'MpFeatureQuery',
  mixins: [WidgetMixin, ExhibitionControllerMixin],
  components: {
    MpGeoJsonInputDraw,
    MpPolygonInputDraw,
    MpUploadFileDraw,
    MpRegionDraw,
  },
  data() {
    return {
      showLayerList: false,
      limitsArray: [0, 0.1, 0.5, 1, 5],
      showSettingPanel: false,
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
    clearDrawMode() {
      return this.widgetInfo.config.clearDrawMode || true
    },
    isContinuous() {
      return this.widgetInfo.config.isContinuous || true
    },
  },

  // 二三维地图模式切换时
  watch: {
    mapRender() {
      this.onClearDraw()
    },
    'document.defaultMap': {
      deep: true,
      handler() {
        this.dealwithLayers()
      },
    },
    currentId(newVal, oldVal) {
      if (oldVal) {
        if (this.map.getLayer(`${oldVal}fill`)) {
          this.map.removeLayer(`${oldVal}fill`)
        }
        if (this.map.getLayer(`${oldVal}line`)) {
          this.map.removeLayer(`${oldVal}line`)
        }
        if (this.map.getSource(oldVal)) {
          this.map.removeSource(oldVal)
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
  },

  methods: {
    onDrawShape3D(shapeInfo) {
      this.currentId = shapeInfo.id
      const fillColor = new this.Cesium.Color.fromCssColorString('#ff0000')
      const { xmin, ymin, xmax, ymax } =
        Feature.getGeoJSONFeatureBound(shapeInfo)
      const { type, coordinates } = shapeInfo.geometry
      if (type === 'LineString') {
        // 将查询类型置为LineString
        this.queryType = 'LineString'
        this.sceneOverlays.addLine(
          shapeInfo.id,
          coordinates.join(',').split(',').map(Number),
          3,
          fillColor
        )
      } else {
        this.sceneOverlays.addPolygon(
          shapeInfo.id,
          coordinates.join(',').split(',').map(Number),
          fillColor
        )
      }
      this.viewer.camera.flyTo({
        destination: this.Cesium.Rectangle.fromDegrees(xmin, ymin, xmax, ymax),
      })
      this.doQuery({ type, coordinates })
    },
    onDrawShape(shapeInfo) {
      this.currentId = shapeInfo.id
      this.map.addSource(shapeInfo.id, {
        type: 'geojson',
        data: shapeInfo.geometry,
      })
      const { coordinates, type } = shapeInfo.geometry
      if (type === 'MultiPolygon' || type === 'Polygon') {
        this.map.addLayer({
          id: `${shapeInfo.id}fill`,
          type: 'fill',
          source: shapeInfo.id,
          paint: {
            'fill-color': '#1890ff',
            'fill-outline-color': '#1890ff',
            'fill-opacity': 0.3,
          },
        })
      }

      this.map.addLayer({
        id: `${shapeInfo.id}line`,
        type: 'line',
        source: shapeInfo.id,
        paint: {
          'line-color': '#1890ff',
          'line-width': 3,
        },
      })
      const { xmin, ymin, xmax, ymax } =
        Feature.getGeoJSONFeatureBound(shapeInfo)
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
      this.map.getCanvas().style.cursor = this.widgetInfo.config.cursorType
      this.doDeActive = false
    },

    // 微件关闭时
    onClose() {
      this.onClearDraw()
      if (!this.doDeActive) {
        this.map.getCanvas().style.cursor = 'grab'
      }
    },

    // 微件失活时
    onDeActive() {
      this.clearDrawMode && this.onClearDraw()
      this.doDeActive = true
      this.map.getCanvas().style.cursor = 'grab'
    },

    // 打开绘制，点击图标激活对应类型的绘制功能
    onOpenDraw(type) {
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
      this.drawComponent && this.drawComponent.closeDraw()
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
            this.drawComponent && this.drawComponent.closeDraw()
            if (this.currentId) {
              this.currentId = '' // 清空当前id用于清除页面已绘制图形
            }
            this.drawComponent &&
              this.drawComponent.openDraw(
                this.queryTypes2DrawModes[this.queryType]
              )
          }, 1000)
        }
      }
      if (this.isContinuous) {
        this.queryType = ''
      }
    },

    queryLayers(shape: Record<string, number>) {
      if (!this.document) {
        return
      }

      let nearDis = this.limits * 1000
      const { projectionName } = baseConfigInstance.config

      if (
        projectionName.indexOf('度') !== -1 ||
        projectionName.indexOf('分') !== -1 ||
        projectionName.indexOf('秒') !== -1
      ) {
        const distanceUnits = 103133.845
        nearDis /= distanceUnits
      }

      const layers = this.isShowLayerList
        ? this.checkLayer
        : this.document.defaultMap.layers()

      layers.forEach((layer) => {
        if (!this.isCrossWithLayer(layer, shape)) {
          return
        }

        const geometry = this.toQueryGeometry(layer, shape, nearDis)

        switch (layer.type) {
          case LayerType.IGSVector:
            this.quertFeatruesByVector(layer, geometry)
            break
          case LayerType.IGSMapImage:
            this.queryFeaturesByDoc(layer, geometry)
            break
          case LayerType.IGSScene:
            this.queryFeaturesByIGSScene(layer, geometry)
            break
          case LayerType.ArcGISMapImage:
            this.queryFeaturesByArcgis(layer, geometry)
            break
          default:
            break
        }
      })
    },

    async queryFeaturesByIGSScene(layer, geometry) {
      if (!layer.isVisible) {
        return
      }
      const { domain, docName } = layer._parseUrl(layer.url)

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        description: '',
        options: [],
      }
      let activeOptionId = ''
      const sublayers = this.isShowLayerList
        ? this.getSublayers(layer.id)
        : layer.activeScene?.sublayers

      // const {
      //   activeScene: { sublayers },
      // } = layer
      const layerConfig = dataCatalogManagerInstance.getLayerConfigByID(
        layer.id
      )
      if (layerConfig && layerConfig.bindData) {
        for (let index = 0; index < sublayers.length; index++) {
          const item = sublayers[index]
          if (!item.visible) {
            return
          }
          exhibition.options.push({
            id: item.id,
            name: item.title || item.name,
            ip: baseConfigInstance.config.ip,
            port: Number(baseConfigInstance.config.port),
            domain,
            serverType: layer.type,
            gdbp: layerConfig.bindData.gdbps,
            geometry: geometry,
          })
          const { TotalCount } = await this.queryCount(
            exhibition.options[index],
            true
          )
          if (TotalCount > 0) {
            activeOptionId = item.id
          }
        }
        this.setActiveExhibitionIdAndOptionId(exhibition, activeOptionId)
      }
    },

    /**
     * 设置activeExhibitionId和activeOptionId
     * @param exhibition 展示面板对象
     * @param activeOptionId 展示面板中激活的图层Id
     * @param totalCount 查询数据总数
     */
    setActiveExhibitionIdAndOptionId(
      exhibition: IAttributeTableListExhibition,
      activeOptionId?: string,
      totalCount?: number
    ) {
      const attributeTableListExhibition = new AttributeTableListExhibition(
        exhibition
      )
      if (activeOptionId && activeOptionId !== '') {
        // 查询图层超过9个换一种展示方式
        attributeTableListExhibition.activeOptionId =
          attributeTableListExhibition.options.length > 9
            ? attributeTableListExhibition.options[0].id
            : activeOptionId
      }
      this.addExhibition(attributeTableListExhibition)
      /**
       * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
       * 修改人：龚跃健
       * 修改时间：2023/1/31
       */
      if ((activeOptionId && activeOptionId !== '') || totalCount) {
        this.tempActiveExhibitionId = exhibition.id
      }
      if (this.tempActiveExhibitionId !== '') {
        this.activeExhibitionId = this.tempActiveExhibitionId
      }
      this.openExhibitionPanel()
    },

    getIpPort({ isDataStoreQuery }) {
      const ipPortObj = isDataStoreQuery
        ? {
            ip: baseConfigInstance.config.DataStoreIp,
            port: Number(baseConfigInstance.config.DataStorePort),
          }
        : {
            ip: baseConfigInstance.config.ip,
            port: Number(baseConfigInstance.config.port),
          }

      return ipPortObj
    },

    async queryFeaturesByDoc(layer: IGSMapImageLayer, geometry) {
      if (!layer.isVisible) {
        return
      }
      const { domain, docName } = layer._parseUrl(layer.url)

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        description: '',
        options: [],
      }

      const sublayers = this.isShowLayerList
        ? this.getSublayers(layer.id)
        : layer.allSublayers

      let activeOptionId = ''

      for (let index = 0; index < sublayers.length; index++) {
        const sublayer = sublayers[index]
        if (
          !sublayer.visible &&
          sublayer.sublayers &&
          sublayer.sublayers.length > 0
        ) {
          return
        }
        /**
         * 修改说明：IGS地图文档和图层服务全部都走IGS的接口，不再判断是否为pg数据
         * 修改人：龚跃健
         * 日期：2022-5-10
         */
        const isDataStoreQuery = false
        const DNSName = undefined
        const ipPortObj = this.getIpPort({
          isDataStoreQuery,
        })
        exhibition.options.push({
          id: sublayer.id,
          name: sublayer.title,
          DNSName,
          isDataStoreQuery,
          domain,
          ...ipPortObj,
          serverType: layer.type,
          gdbp: sublayer.url,
          layerIndex: sublayer.id,
          serverName: docName,
          serverUrl: layer.url,
          geometry: geometry,
        })
        /**
         * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
         * 修改人：龚跃健
         * 修改时间：2023/1/31
         */
        const { TotalCount } = await this.queryCount(exhibition.options[index])
        if (TotalCount > 0) {
          activeOptionId = sublayer.id
        }
      }
      this.setActiveExhibitionIdAndOptionId(exhibition, activeOptionId)
    },

    async quertFeatruesByVector(layer: IGSVectorLayer, geometry) {
      if (!layer.isVisible) {
        return
      }
      const { domain, docName } = layer._parseUrl(layer.url)
      const isDataStoreQuery = false
      const DNSName = undefined
      const ipPortObj = this.getIpPort({
        isDataStoreQuery,
      })

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        options: [
          {
            id: layer.id,
            DNSName,
            isDataStoreQuery,
            domain,
            ...ipPortObj,
            serverType: layer.type,
            gdbp: layer.gdbps,
            geometry: geometry,
          },
        ],
      }
      /**
       * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
       * 修改人：龚跃健
       * 修改时间：2023/1/31
       */
      const { TotalCount } = await this.queryCount(exhibition.options[0])
      this.setActiveExhibitionIdAndOptionId(exhibition, null, TotalCount)
    },

    // IGSMapImage、IGSVector图层获取总页数
    async queryCount(optionVal, isScence = false) {
      const {
        ip,
        port,
        domain,
        isDataStoreQuery,
        serverName,
        layerIndex,
        gdbp,
        geometry,
      } = optionVal
      const featureSet = await FeatureQuery.query(
        {
          ip,
          port: port.toString(),
          domain,
          f: 'json',
          IncludeAttribute: false,
          IncludeGeometry: false,
          IncludeWebGraphic: false,
          isDataStoreQuery,
          geometry,
          where: null,
          gdbp,
          docName: serverName,
          layerIdxs: layerIndex,
          rtnLabel: false,
          requestType: 'POST',
        },
        false,
        isScence
      )
      return featureSet
    },

    async queryFeaturesByArcgis(layer, geometry) {
      if (!layer.isVisible) {
        return
      }

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        description: '',
        options: [],
      }
      let activeOptionId = ''

      const sublayers = this.isShowLayerList
        ? this.getSublayers(layer.id)
        : layer.allSublayers
      for (let index = 0; index < sublayers.length; index++) {
        const sublayer = sublayers[index]
        if (!sublayer.visible) {
          return
        }
        exhibition.options.push({
          id: sublayer.id,
          name: sublayer.title,
          serverType: layer.type,
          layerIndex: sublayer.id,
          serverUrl: layer.url,
          geometry: geometry,
        })
        /**
         * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
         * 修改人：龚跃健
         * 修改时间：2023/1/31
         */
        const { count } = await ArcGISFeatureQuery.getTotal({
          f: 'pjson',
          where: null,
          geometry,
          serverUrl: layer.url,
          layerIndex: sublayer.id,
        })

        if (count > 0) {
          activeOptionId = sublayer.id
        }
      }
      this.setActiveExhibitionIdAndOptionId(exhibition, activeOptionId)
    },

    toQueryGeometry(
      layer,
      shape: Record<string, number> | Array<Record<string, number>>,
      nearDis
    ) {
      let geometry

      switch (this.queryType) {
        case QueryType.Point:
          if (!this.is2DMapMode && layer.type === LayerType.IGSScene) {
            // 三维查询需要用到局部坐标，这里把经纬度转换成局部坐标,这里z轴不做转换
            const transform = this.getLayerTranform(layer)
            const offset = this.getLayerOffset(layer)
            if (transform) {
              const { x, y, z } =
                this.sceneController.globelPositionToLocalPosition(
                  shape,
                  transform,
                  offset
                )
              geometry = new Point3D(x, y, shape.z)
            }
          } else {
            let pointNearDis = nearDis
            if (!pointNearDis) {
              // 如果nearDis为0，需要重置nearDis为0.0000001之类的，小数位数与坐标位数保持一致。igs接口这个参数不能直接设置为0
              const xStr = shape.x.toString().split('.')[1]
              pointNearDis = 0.0001 || Number(`0.${xStr}`) / Number(xStr)
            }
            geometry = new Zondy.Common.Point2D(shape.x, shape.y, {
              nearDis: pointNearDis,
            })
          }
          break
        case QueryType.LineString:
          if (!this.is2DMapMode && layer.type === LayerType.IGSScene) {
            // 三维查询需要用到局部坐标，这里把经纬度转换成局部坐标,这里z轴不做转换
            const transform = this.getLayerTranform(layer)
            const offset = this.getLayerOffset(layer)
            if (transform) {
              const { xmin, ymin, xmax, ymax, zmin, zmax } = this.toQueryRect3D(
                shape,
                transform,
                offset
              )

              geometry = new Rectangle3D(xmin, ymin, zmin, xmax, ymax, zmax)
            }
          } else {
            let lineNearDis = nearDis
            const pointArray = shape.map((item: Record<string, number>) => {
              if (!lineNearDis) {
                // 如果nearDis为0，需要重置nearDis为0.0000001之类的，小数位数与坐标位数保持一致。igs接口这个参数不能直接设置为0
                const xStr = item.x.toString().split('.')[1]
                lineNearDis = Number(`0.${xStr}`) / Number(xStr)
              }
              return new Zondy.Common.Point2D(item.x, item.y, {
                nearDis: lineNearDis,
              })
            })

            geometry = new Zondy.Common.PolyLine(pointArray, {
              nearDis: lineNearDis,
            })
          }
          break
        case QueryType.Polygon:
          if (!this.is2DMapMode && layer.type === LayerType.IGSScene) {
            // 三维查询需要用到局部坐标，这里把经纬度转换成局部坐标,这里z轴不做转换
            const transform = this.getLayerTranform(layer)
            const offset = this.getLayerOffset(layer)
            if (transform) {
              const { xmin, ymin, xmax, ymax, zmin, zmax } = this.toQueryRect3D(
                shape,
                transform,
                offset
              )

              geometry = new Rectangle3D(xmin, ymin, zmin, xmax, ymax, zmax)
            }
          } else {
            let polyNearDis = nearDis
            const pointArray = shape.map((item: Record<string, number>) => {
              if (!polyNearDis) {
                // 如果nearDis为0，需要重置nearDis为0.0000001之类的，小数位数与坐标位数保持一致。igs接口这个参数不能直接设置为0
                const xStr = item.x.toString().split('.')[1]
                polyNearDis = Number(`0.${xStr}`) / Number(xStr)
              }
              return new Zondy.Common.Point2D(item.x, item.y, {
                nearDis: polyNearDis,
              })
            })

            geometry = new Zondy.Common.Polygon(pointArray)
          }
          break
        case QueryType.Cube:
        case QueryType.Circle:
        case QueryType.Rectangle:
          if (!this.is2DMapMode && layer.type === LayerType.IGSScene) {
            // 三维查询需要用到局部坐标，这里把经纬度转换成局部坐标,这里z轴不做转换
            const transform = this.getLayerTranform(layer)
            const offset = this.getLayerOffset(layer)
            if (transform) {
              const { xmin, ymin, xmax, ymax, zmin, zmax } = shape

              geometry = this.transQueryRect3D(
                { xmin, ymin, xmax, ymax, zmin, zmax },
                transform,
                offset
              )
            }
          } else {
            const { xmin, ymin, xmax, ymax } = shape
            geometry = new Zondy.Common.Rectangle(xmin, ymin, xmax, ymax)
          }
          break
        case QueryType.MultiPolygon:
          geometry = new Zondy.Common.MultiPolygon(shape)
          break
        default:
          break
      }

      return geometry
    },

    transQueryRect3D(
      { xmin, ymin, xmax, ymax, zmin, zmax },
      transform,
      offset
    ) {
      if (transform) {
        const minPosition = this.sceneController.globelPositionToLocalPosition(
          { x: xmin, y: ymin, z: zmin },
          transform,
          offset
        )
        const maxPosition = this.sceneController.globelPositionToLocalPosition(
          { x: xmax, y: ymax, z: zmax },
          transform,
          offset
        )
        return new Rectangle3D(
          minPosition.x,
          minPosition.y,
          zmin,
          maxPosition.x,
          maxPosition.y,
          zmax
        )
      }
      return undefined
    },

    toQueryRect3D(shape, transform, offset) {
      const positions = shape.map((item) => {
        const { x, y, z } = this.sceneController.globelPositionToLocalPosition(
          item,
          transform,
          offset
        )
        return {
          x,
          y,
          z: item.z,
        }
      })
      let xmin = 0
      let ymin = 0
      let zmin = 0
      let xmax = 0
      let ymax = 0
      let zmax = 0
      positions.forEach(({ x, y, z }, index) => {
        if (index === 0) {
          xmin = x
          ymin = y
          zmin = z
          xmax = x
          ymax = y
          zmax = z
        } else {
          xmin = xmin - x < 0 ? xmin : x
          ymin = ymin - y < 0 ? ymin : y
          zmin = zmin - z < 0 ? zmin : z
          xmax = xmax - x > 0 ? xmax : x
          ymax = ymax - y > 0 ? ymax : y
          zmax = zmax - z > 0 ? zmax : z
        }
      })
      return {
        xmin,
        ymin,
        xmax,
        ymax,
        zmin,
        zmax,
      }
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

    isCrossWithLayer(layer, shape): boolean {
      const { fullExtent, type } = layer
      const { ymax, ymin, xmax, xmin } = fullExtent
      let geometry
      let extentPolygon

      if (!this.is2DMapMode && type === LayerType.IGSScene) {
        const tranform = this.getLayerTranform(layer)
        if (tranform) {
          const extent = this.sceneController.localExtentToGlobelExtent(
            fullExtent,
            tranform
          )
          extentPolygon = polygon([
            [
              [Number(extent.xmin), Number(extent.ymin)],
              [Number(extent.xmax), Number(extent.ymin)],
              [Number(extent.xmax), Number(extent.ymax)],
              [Number(extent.xmin), Number(extent.ymax)],
              [Number(extent.xmin), Number(extent.ymin)],
            ],
          ])
        }
      } else {
        extentPolygon = polygon([
          [
            [Number(xmin), Number(ymin)],
            [Number(xmax), Number(ymin)],
            [Number(xmax), Number(ymax)],
            [Number(xmin), Number(ymax)],
            [Number(xmin), Number(ymin)],
          ],
        ])
      }
      switch (this.queryType) {
        case QueryType.Point:
          geometry = point([shape.x, shape.y])
          break
        case QueryType.LineString:
          geometry = lineString(shape.map((point) => [point.x, point.y]))
          break
        case QueryType.Polygon:
          geometry = polygon([shape.map((point) => [point.x, point.y])])
          break
        case QueryType.Cube:
        case QueryType.Circle:
        case QueryType.Rectangle:
          const { ymax, ymin, xmax, xmin } = shape
          geometry = polygon([
            [
              [xmin, ymin],
              [xmax, ymin],
              [xmax, ymax],
              [xmin, ymax],
              [xmin, ymin],
            ],
          ])
          break
        case QueryType.MultiPolygon:
          geometry = multiPolygon(shape)
          break
        default:
          return false
      }
      return (
        // 交叉或者包含都会继续查询
        !booleanDisjoint(extentPolygon, geometry) ||
        booleanContains(extentPolygon, geometry) ||
        booleanContains(geometry, extentPolygon)
      )
    },
    onCheckLayer(keys, keysInfo) {
      // 图层与子图层的对应关系
      this.layerKeyRelation = {}
      this.checkList = keysInfo
      this.checkLayer = []
      keysInfo.forEach((item) => {
        if (this.layerKeyRelation[item.layer.id]) {
          this.layerKeyRelation[item.layer.id].push(item.key)
        } else {
          this.layerKeyRelation[item.layer.id] = []
          this.layerKeyRelation[item.layer.id].push(item.key)
          this.checkLayer.push(item.layer)
        }
      })
    },
    getSublayers(id) {
      const relationKeys = this.layerKeyRelation[id]
      const checkList = this.checkList.filter((item) =>
        relationKeys.includes(item.key)
      )
      return checkList
    },
    showLayerListInfo() {
      this.showLayerList = !this.showLayerList
      this.showSettingPanel = false
    },
    showSettingsInfo() {
      this.showSettingPanel = !this.showSettingPanel
      this.showLayerList = false
    },
    dealwithLayers() {
      const layers = this.document.clone().defaultMap.layers()
      layers.forEach((item) => {
        if (item.type === LayerType.IGSScene) {
          item.sublayers = item.activeScene?.sublayers
        } else if (item.type === LayerType.IGSVector) {
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
}
</script>

<style lang="less" scoped>
.mp-widget-feature-query {
  display: flex;
  flex-direction: column;
}
</style>
