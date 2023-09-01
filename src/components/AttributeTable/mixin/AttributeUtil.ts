import * as turf from '@turf/turf'
import {
  DomUtil,
  AppMixin,
  ExhibitionMixin,
  LayerType,
  UUID,
  MapMixin,
  Rectangle3D,
  Feature,
  Objects,
  Exhibition,
  ProjectorManager,
} from '@mapgis/web-app-framework'
import moment from 'moment'

const { GFeature, FeatureQuery, ArcGISFeatureQuery, FeatureConvert } = Feature

const { IAttributeTableOption, IAttributeTableExhibition } = Exhibition

const Json2csvParser = require('json2csv').Parser

export default {
  mixins: [AppMixin, MapMixin, ExhibitionMixin],
  // // 下载包以时间命名
  // private datetime: any = Date.now()
  data() {
    return {
      // csv对象
      Json2csvParser: Json2csvParser,
      // 表格数据
      tableData: [],
      // 表头数据
      tableColumns: [],
      markers: [],
      fitBound: {},
      selectionBound: {},
      // 是否正在加载
      loading: false,
      currentTableParams: {},
      showFilter: false,
      showAttrStatistics: false,
      statisticAndFilterParamas: {},
      // 是否随地图范围过滤
      filterWithMap: false,
      // 地图范围
      geometry: undefined,
      geometry3D: undefined,
      // 高亮已选择
      hightlightSelection: false,
      // 选中的行
      selection: [],
      selectIcon: '',
      unSelectIcon: '',
      // 分页信息
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: ['5', '10', '20', '30', '50'], // 这里注意只能是字符串，不能是数字
      },
      id: `${new Date().getTime()}-${Math.floor(
        Math.random() * 10
      )}-table-wrapper`,
      tableId: `${new Date().getTime()}-${Math.floor(
        Math.random() * 10
      )}-table`,
      filterId: `${new Date().getTime()}-${Math.floor(
        Math.random() * 10
      )}-filter`,
      statisticsId: `${new Date().getTime()}-${Math.floor(
        Math.random() * 10
      )}-statistics`,
      /* 属性表数据转为json数据的暂存属性 */
      attrTableToJsonData: null,
      fullScreen: false,
      useScrollX: false,
      scrollY: 0,
      isActive: true,
      rowKey: 'fid',
      currentId: '',
      // 被选中行对应的markers集合
      selectedMarkers: [],
    }
  },
  computed: {
    optionVal() {
      return {}
    },
  },
  methods: {
    setRowKey() {
      const { serverType, isDataStoreQuery } = this.optionVal

      switch (serverType) {
        case LayerType.IGSVector:
        case LayerType.IGSMapImage:
          return isDataStoreQuery ? 'mpoid' : 'fid'
        case LayerType.ArcGISMapImage:
          return 'ID'
        case LayerType.IGSScene:
        case LayerType.ModelCache:
          return 'FID'
        case LayerType.EsGeoCode:
          return 'customerId'
        // case LayerType.DataFlowLayer:
        //   return 'imei'

        default:
          return 'fid'
      }
    },
    /**
     * 投屏操作
     * @param file
     * {
     *  url: 视频地址,
     *  type: 视频类型,
     *  name: 视频名称
     * }
     */
    projectScreen(file) {
      if (!this.getProjectorStatus(file.name)) {
        const {
          vFOV,
          orientationHeading,
          orientationRoll,
          positionX,
          positionY,
          positionZ,
          hFOV,
          orientationPitch,
        } = file
        const cameraPosition = {
          x: positionX,
          y: positionY,
          z: positionZ,
        }
        const Orientation = {
          heading: orientationHeading,
          pitch: orientationPitch,
          roll: orientationRoll,
        }
        ProjectorManager.addProjector(
          this.exhibition.id,
          this.exhibition.name,
          file.name,
          file.url,
          'video',
          file.type,
          file.url,
          '',
          '',
          true,
          cameraPosition,
          Orientation,
          hFOV,
          vFOV
        )
        this.setProjectorStatus(file.name, true)
      } else {
        this.setProjectorStatus(file.name)
      }
    },
    getProjectorStatus(projectorId) {
      return ProjectorManager.getProjectorStatus(
        projectorId,
        this.exhibition.id
      )
    },
    setProjectorStatus(projectorId, isProjected = false) {
      return ProjectorManager.setProjectorStatus(
        projectorId,
        this.exhibition.id,
        isProjected
      )
    },
    /**
     * 当为dataStore查询时并且keyword为空，采用逆地理编码查询，获取中心点与查询范围
     */
    getLonLatDis(geoJSONExtent) {
      if (geoJSONExtent) {
        const { geometry } = geoJSONExtent
        const { coordinates } = geometry
        const from = turf.point(coordinates[0][0])
        const to = turf.point(coordinates[0][3])
        const options = { units: 'kilometers' }

        const distance = turf.rhumbDistance(from, to, options)

        const center = turf.centerOfMass(geoJSONExtent)
        return {
          lon: center.geometry.coordinates[0],
          lat: center.geometry.coordinates[1],
          dis: distance / 2,
        }
      }
      return {}
    },
    /* val默认传参供attrTableToJsonData函数使用，传入val=“1”表示请求当前图层全部数据 */
    async queryGeoJSON(
      geometry: Record<string, unknown> | undefined,
      where: string | undefined,
      val = '0'
    ) {
      this.rowKey = this.setRowKey()
      this.currentTableParams = { ...this.optionVal }
      const {
        ip,
        port,
        serverName,
        serverType,
        serverUrl,
        layerIndex,
        gdbp,
        f,
      } = this.optionVal
      let { domain } = this.optionVal
      if (!domain && !!serverUrl && serverUrl.length > 0) {
        const url = new URL(serverUrl)
        domain = url.origin
      }
      const { current, pageSize } = this.pagination
      let geojson
      const queryWhere = where || this.optionVal.where
      let queryGeometry = geometry || this.optionVal.geometry
      let columns = []
      switch (serverType) {
        case LayerType.IGSMapImage:
        case LayerType.IGSVector:
          const { isDataStoreQuery, DNSName } = this.optionVal
          if (!isDataStoreQuery) {
            const { AttStruct, TotalCount } = await this.queryCount(
              queryGeometry,
              queryWhere
            )
            if (!(this.tableColumns && this.tableColumns.length > 0)) {
              columns = this.setTableScroll(AttStruct)
              this.tableColumns = columns
            }
            this.pagination.total = TotalCount
          }
          const page = isDataStoreQuery ? current : current - 1
          geojson = await FeatureQuery.query({
            ip,
            port: port.toString(),
            domain,
            f: f || 'geojson',
            where: queryWhere,
            geometry: queryGeometry,
            isDataStoreQuery,
            page: val === '1' ? 0 : page,
            pageCount: val === '1' ? this.pagination.total : pageSize,
            gdbp,
            DNSName,
            docName: serverName,
            layerIdxs: layerIndex,
            coordPrecision: 8,
            requestType: 'POST',
          })
          // json格式数据转成geojson格式
          if (f === 'json') {
            geojson = FeatureConvert.featureIGSToFeatureGeoJSON(geojson)
          }
          if (val === '1') {
            this.attrTableToJsonData = geojson.features
            return
          }
          this.tableData = geojson.features
          if (isDataStoreQuery) {
            this.setGeoJsonColums(geojson)
            this.pagination.total = geojson.dataCount
          }
          this.removeMarkers()
          // 如果当前是激活状态，则添加markers
          if (this.isExhibitionActive) {
            await this.addMarkers()
          }
          break

        case LayerType.ArcGISMapImage:
          const { count: totalCount } = await ArcGISFeatureQuery.getTotal({
            f: 'pjson',
            where: queryWhere,
            geometry: queryGeometry,
            serverUrl,
            layerIndex,
          })
          this.pagination.total = totalCount
          geojson = await ArcGISFeatureQuery.query({
            f: 'pjson',
            where: queryWhere,
            geometry: queryGeometry,
            page: val === '1' ? 0 : current - 1,
            pageCount: val === '1' ? this.pagination.total : pageSize,
            serverUrl,
            layerIndex,
            totalCount,
          })
          if (val === '1') {
            this.attrTableToJsonData = geojson.feature
            return
          }
          this.tableData = geojson.features

          const { properties } = geojson.features[0]
          const tags = Object.keys(properties)
          if (tags.length <= 10) {
            // 10个以内，不需要设固定宽度，且不需要启用水平滚动条
            this.useScrollX = false
          } else {
            // 10个以上，每个设固定宽度180，且启用水平滚动条
            this.useScrollX = true
          }
          if (!(this.tableColumns && this.tableColumns.length > 0)) {
            for (let index = 0; index < tags.length; index++) {
              const name = tags[index]
              const alias = tags[index] ? `${tags[index]}` : ''
              const type = 'string'
              const obj = {
                title: alias.length ? alias : name,
                key: name,
                dataIndex: `properties.${name}`,
                align: 'left',
                ellipsis: true,
              }
              if (this.useScrollX) {
                obj.width = 180
              }
              // var str = '37'
              const num = Number(properties[name])
              if (!isNaN(num)) {
                obj.sorter = (a, b) =>
                  Number(a.properties[name]) - Number(b.properties[name])
              }
              columns.push(obj)
            }
            this.tableColumns = columns
          }
          this.pagination.total = totalCount
          this.removeMarkers()
          // 如果当前是激活状态，则添加markers
          if (this.isExhibitionActive) {
            await this.addMarkers()
          }
          break

        case LayerType.IGSScene:
        case LayerType.ModelCache:
          // 查找矩阵集
          const source = this.sceneController.findSource(this.optionVal.id)
          queryGeometry = geometry
            ? this.getGeometry3D(source)
            : this.optionVal.geometry
          const json = await FeatureQuery.igsQuery3DFeatureResourceServer({
            ip,
            port: port.toString(),
            domain,
            geometry: queryGeometry,
            url: gdbp,
            inSrs: 'WGS1984_度',
            outSrs: 'WGS1984_度',
            returnCountOnly: true,
          })
          const { count } = json
          this.pagination.total = count
          let jsonData
          if (val === '1') {
            jsonData = await FeatureQuery.igsQuery3DFeatureResourceServer({
              ip,
              port: port.toString(),
              domain,
              where: queryWhere,
              geometry: queryGeometry,
              page: 0,
              pageCount: this.pagination.total,
              url: gdbp,
              geometryPrecision: 8,
              inSrs: 'WGS1984_度',
              outSrs: 'WGS1984_度',
            })
            this.attrTableToJsonData = this.setTable20(
              jsonData.features,
              source,
              jsonData.fields
            )
            return
          } else {
            jsonData = await FeatureQuery.igsQuery3DFeatureResourceServer({
              ip,
              port: port.toString(),
              domain,
              where: queryWhere,
              geometry: queryGeometry,
              page: current - 1,
              pageCount: pageSize,
              url: gdbp,
              geometryPrecision: 8,
              inSrs: 'WGS1984_度',
              outSrs: 'WGS1984_度',
            })
          }
          if (!(this.tableColumns && this.tableColumns.length > 0)) {
            columns = this.setTableScroll20(jsonData.fields)
            this.tableColumns = columns
          }
          this.tableData = this.setTable20(
            jsonData.features,
            source,
            jsonData.fields
          )
          this.removeMarkers()
          // 如果当前是激活状态，则添加markers
          if (this.isExhibitionActive) {
            await this.addMarkers()
          }
          break

        case LayerType.DataFlow:
          const { pagination } = this
          // 获取数据流图层实时返回的数据信息
          const features = this.dataFlowList.getDataFlowById(this.optionVal.id)
          this.setGeoJsonColums({ features, type: 'FeatureCollection' })
          this.pagination.total = features.length
          // 模拟分页
          this.tableData = features.slice(
            (pagination.current - 1) * pagination.pageSize,
            pagination.current * pagination.pageSize
          )
          this.removeMarkers()
          // 如果当前是激活状态，则添加markers
          if (this.isExhibitionActive) {
            await this.addMarkers()
          }
          break

        case LayerType.EsGeoCode:
          const { libName } = this.optionVal
          let lon
          let lat
          let dis
          if (!queryWhere) {
            const lonLatDis = this.getLonLatDis(this.getBounds())
            lon = lonLatDis.lon
            lat = lonLatDis.lat
            dis = lonLatDis.dis
          }
          const datastoreParams = {
            ip,
            port: port.toString(),
            domain,
            where: queryWhere,
            geometry: queryGeometry,
            page: current,
            pageCount: pageSize,
            libName,
            decode: !queryWhere,
            lon,
            lat,
            dis,
            isEsGeoCode: true,
          }
          const geoCode = await FeatureQuery.query(datastoreParams)
          // 将地理编码查询返回结果转换为GEOJSON格式
          if (geoCode) {
            const features = geoCode.result
            const markerCoords = []
            for (let j = 0; j < features.length; j += 1) {
              const feature = features[j]
              const coordinates = [feature.lon, feature.lat]
              const properties = {
                ...feature.detail,
                ...feature.areaAddr,
                // 由于没有返回唯一标识，这里自定义下标为唯一标识
                customerId: j,
              }
              markerCoords.push({
                type: 'Feature',
                properties,
                geometry: {
                  type: 'Point',
                  coordinates,
                },
              })
            }
            geojson = { type: 'FeatureCollection', features: markerCoords }
            this.tableData = geojson.features
            this.setGeoJsonColums(geojson)
            this.pagination.total = geoCode.totalCount
            this.removeMarkers()
            // 如果当前是激活状态，则添加markers
            if (this.isExhibitionActive) {
              await this.addMarkers()
            }
          }
          break

        default:
          break
      }
    },
    setTableScroll(AttStruct) {
      const columns = []
      const {
        FldNumber = 0,
        FldName = [],
        FldAlias = [],
        FldType = [],
      } = AttStruct
      // 根据字段数计算useScrollX
      if (FldNumber <= 10) {
        // 10个以内，不需要设固定宽度，且不需要启用水平滚动条
        this.useScrollX = false
      } else {
        // 10个以上，每个设固定宽度180，且启用水平滚动条
        this.useScrollX = true
      }
      for (let index = 0; index < FldNumber; index++) {
        const name = FldName[index]
        const alias = FldAlias[index] ? `${FldAlias[index]}` : ''
        const type = FldType[index]
        const sortable = !['GEOMETRY', 'STRING'].includes(type.toUpperCase())
        const obj = {
          title: alias.length ? alias : name,
          key: name,
          dataIndex: `properties.${name}`,
          align: 'left',
          // 超过宽度将自动省略
          ellipsis: true,
        }
        if (this.useScrollX) {
          obj.width = 180
        }
        columns.push(
          sortable
            ? {
                ...obj,
                sorter: (a, b) =>
                  this.sorterFunciton(
                    a.properties[name],
                    b.properties[name],
                    type
                  ),
              }
            : obj
        )
      }

      return columns
    },
    setTableScroll20(fields) {
      if (!fields) {
        return
      }
      const columns: Array = [
        {
          title: this.rowKey,
          key: this.rowKey,
          dataIndex: `properties.${this.rowKey}`,
          align: 'left',
          // 超过宽度将自动省略
          ellipsis: true,
          width: 180,
        },
      ]
      // 根据字段数计算useScrollX
      if (fields.length <= 10) {
        // 10个以内，不需要设固定宽度，且不需要启用水平滚动条
        this.useScrollX = false
      } else {
        // 10个以上，每个设固定宽度180，且启用水平滚动条
        this.useScrollX = true
      }
      for (let index = 0; index < fields.length; index++) {
        const name = fields[index].name
        const alias = fields[index].alias ? fields[index].alias : ''
        const type = fields[index].type
        const sortable = !['GEOMETRY', 'STRING'].includes(type.toUpperCase())
        const obj = {
          title: alias.length ? alias : name,
          key: name,
          dataIndex: `properties.${name}`,
          align: 'left',
          // 超过宽度将自动省略
          ellipsis: true,
        }
        if (this.useScrollX) {
          obj.width = 180
        }
        columns.push(
          sortable
            ? {
                ...obj,
                sorter: (a, b) =>
                  this.sorterFunciton(
                    a.properties[name],
                    b.properties[name],
                    type
                  ),
              }
            : obj
        )
      }

      return columns
    },
    // 只有数字类型才会添加排序功能
    sorterFunciton(a: any, b: any, type: string): boolean {
      const numberArr: Array<string> = [
        'BYTE',
        'SHORT',
        'INT',
        'LONG',
        'FLOAT',
        'DOUBLE',
        'BINARY',
      ]
      const timeArr: Array<string> = ['TIME', 'DATE', 'TIMESTAMP']
      if (numberArr.includes(type.toUpperCase())) {
        return a - b
      }
      if (timeArr.includes(type.toUpperCase())) {
        return moment(a) - moment(b)
      }
      return false
    },
    getGeometry3D(source) {
      const { xmin, ymin, xmax, ymax, zmin, zmax } = this.geometry3D
      return new Rectangle3D(xmin, ymin, zmin, xmax, ymax, zmax)
    },
    // 设置IGSScene类型的属性表table数据
    setTable(SFEleArray, source, FldName, FldNumber) {
      return (SFEleArray || []).map(({ AttValue = [], bound = {}, FID }) => {
        console.log(this.optionVal)
        const properties = {
          FID,
          specialLayerId: this.optionVal.id,
          specialLayerBound: bound,
        }
        for (let index = 0; index < FldNumber; index++) {
          const name = FldName[index]
          const value = AttValue[index]
          properties[name] = value
        }
        return {
          geometry: {
            coordinates: [],
            type: '3DPolygon',
          },
          properties,
        }
      })
    },
    setTable20(features, source, fields) {
      return (features || []).map(({ attributes = {}, bound = {} }) => {
        const properties = {
          FID: attributes.FID,
          specialLayerId: this.optionVal.id,
          specialLayerBound: bound,
        }
        return {
          geometry: {
            coordinates: [],
            type: '3DPolygon',
          },
          properties: { ...properties, ...attributes },
        }
      })
    },
    // IGSMapImage、IGSVector图层获取总页数
    async queryCount(geometry?: Record<string, any>, where?: string) {
      const { ip, port, isDataStoreQuery, serverName, serverUrl } =
        this.optionVal
      let { domain } = this.optionVal
      if (!domain && !!serverUrl && serverUrl.length > 0) {
        const url = new URL(serverUrl)
        domain = url.origin
      }
      const { layerIndex, gdbp } = this.optionVal
      const featureSet = await FeatureQuery.query({
        ip,
        port: port.toString(),
        domain,
        f: 'json',
        IncludeAttribute: false,
        IncludeGeometry: false,
        IncludeWebGraphic: false,
        isDataStoreQuery,
        geometry,
        where,
        gdbp,
        docName: serverName,
        layerIdxs: layerIndex,
        requestType: 'POST',
      })
      return featureSet
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
    // 通过geoJson设置table标题数组
    setGeoJsonColums(geojson) {
      if (!geojson.features || geojson.features.length <= 0) {
        this.tableColumns = []
        return
      }
      const columns: Array = []
      const { properties } = geojson.features[0]
      const tags = Object.keys(properties)
      if (tags.length <= 10) {
        // 10个以内，不需要设固定宽度，且不需要启用水平滚动条
        this.useScrollX = false
      } else {
        // 10个以上，每个设固定宽度180，且启用水平滚动条
        this.useScrollX = true
      }
      if (!(this.tableColumns && this.tableColumns.length > 0)) {
        for (let index = 0; index < tags.length; index++) {
          const name = tags[index]
          const alias = tags[index] ? `${tags[index]}` : ''
          const type = 'string'
          const obj = {
            title: alias.length ? alias : name,
            key: name,
            dataIndex: `properties.${name}`,
            align: 'left',
            ellipsis: true,
          }
          if (this.useScrollX) {
            obj.width = 180
          }
          // var str = '37'
          const num = Number(properties[name])
          if (!isNaN(num)) {
            obj.sorter = (a, b) =>
              Number(a.properties[name]) - Number(b.properties[name])
          }
          columns.push(obj)
        }
        this.tableColumns = columns
      }
    },
  },
}
