import {
  ExhibitionControllerMixin,
  LayerType,
  IGSMapImageLayer,
  IGSVectorLayer,
  Rectangle3D,
  Point3D,
  Objects,
  Exhibition,
  Feature,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import * as Zondy from '@mapgis/webclient-es6-service'
import { lineString, polygon, point, multiPolygon } from '@turf/helpers'
import booleanDisjoint from '@turf/boolean-disjoint'
import booleanContains from '@turf/boolean-contains'
import QueryType from './query-type'

const { IAttributeTableListExhibition, AttributeTableListExhibition } =
  Exhibition

const { FeatureQuery, ArcGISFeatureQuery } = Feature

export default {
  mixins: [ExhibitionControllerMixin],
  data() {
    return {}
  },
  computed: {},
  methods: {
    /**
     * 图层与查询范围是否有交集
     * @param layer 图层对象
     * @param shape 查询范围
     * @param queryType 查询类型
     * @returns
     */
    isCrossWithLayer(layer, shape, queryType): boolean {
      const { type } = layer
      let { fullExtent } = layer
      let { ymax, ymin, xmax, xmin } = fullExtent
      if (type === LayerType.IGSScene || type === LayerType.ModelCache) {
        if (
          xmax > 180 ||
          xmin < -180 ||
          ymax > 90 ||
          ymin < -90 ||
          (xmax === 0 && xmin === 0 && ymax === 0 && ymin === 0)
        ) {
          // 在TreeLayer/index.vue里会定义window.layers3D，并设置三维模型的fullExtent和boundingSphere
          if (window.layers3D && window.layers3D[layer.id]) {
            fullExtent = window.layers3D[layer.id].fullExtent
            xmin = fullExtent.xmin
            ymin = fullExtent.ymin
            xmax = fullExtent.xmax
            ymax = fullExtent.ymax
          }
        }
      }

      let geometry
      const extentPolygon = polygon([
        [
          [Number(xmin), Number(ymin)],
          [Number(xmax), Number(ymin)],
          [Number(xmax), Number(ymax)],
          [Number(xmin), Number(ymax)],
          [Number(xmin), Number(ymin)],
        ],
      ])
      switch (queryType) {
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
      if (
        geometry.geometry.type === 'Point' ||
        geometry.geometry.type === 'LineString'
      ) {
        return (
          // 交叉或者包含都会继续查询
          !booleanDisjoint(extentPolygon, geometry) ||
          booleanContains(extentPolygon, geometry)
        )
      }
      return (
        // 交叉或者包含都会继续查询
        !booleanDisjoint(extentPolygon, geometry) ||
        booleanContains(extentPolygon, geometry) ||
        booleanContains(geometry, extentPolygon)
      )
    },
    /**
     * 根据坐标计算缓冲半径
     * @param {Object} shape 点坐标
     * @param {Object} layer 图层对象
     * @param {Number} nearDistance 设置的缓冲半径，换算前
     * @return {Number} 缓冲半径
     * */
    getNearDistance(shape: Record<string, number>, layer, nearDistance) {
      // 默认缓冲半径，单位和图层的坐标系挂钩
      let nearDis = 0.0001
      // 当前的级数和分辨率
      let zoomAndResolution

      // 1 图层是经纬度坐标系
      if (layer && layer.spatialReference && layer.spatialReference.isWGS84()) {
        // 1.1 设置一度代表多少米，纬度不同，数值也不同，此处取武汉附近的纬度
        const distanceUnits = 103133.845
        // 1.2 开启了手动输入缓冲半径的面板
        if (this.showNearDistanceInput) {
          // 根据不同单位进行处理
          switch (this.nearDistanceUnit) {
            case 'pixel':
            default:
              // 根据分辨率计算缓冲半径
              nearDis = this.getNearDistanceByResolution(
                shape,
                distanceUnits,
                nearDistance
              )
              break
            case 'kilometer':
              // 将千米转为米，之后计算缓冲半径
              nearDis = (nearDistance * 1000) / distanceUnits
              break
            case 'meter':
              nearDis = nearDistance / distanceUnits
              break
            case 'centimeter':
              // 将厘米转为米，之后计算缓冲半径
              nearDis = nearDistance / 100 / distanceUnits
              break
          }
        }
        // 1.3 通过滑动条选择缓冲半径
        else {
          // 根据分辨率计算缓冲半径
          nearDis = this.getNearDistanceByResolution(
            shape,
            distanceUnits,
            nearDistance
          )
        }
      }
      return nearDis
    },
    /**
     * 根据分辨率计算缓冲半径
     * @param {Object} shape 点坐标
     * @param {Number} distanceUnits 一度代表多少米，纬度不同，数值也不同，没有直接返回默认缓冲半径
     * @param {Number} nearDistance 设置的缓冲半径，换算前
     * @return {Number} 缓冲半径
     * */
    getNearDistanceByResolution(
      shape: Record<string, number>,
      distanceUnits,
      nearDistance
    ) {
      // 1 设置默认缓冲半径，单位和图层的坐标系挂钩
      let nearDis = 0.0001

      // 2 如果没有distanceUnits，则直接返回
      if (!distanceUnits) {
        return nearDis
      }
      // 3 根据分辨率计算缓冲半径
      else {
        if (this.is2DMapMode) {
          // 获取地图中心点经纬度
          const { map } = this
          const coord = {
            lng: shape.x,
            lat: shape.y,
          }

          // 将坐标点转换为屏幕像素坐标
          const pixel = map.project(coord)

          // 向右偏移1像素并转换回地理坐标
          const pixelRight = [pixel.x + 1, pixel.y]
          const coordRight = map.unproject(pixelRight)
          const resolutionX = coordRight.lng - coord.lng // 经度方向分辨率（度/像素）

          // 向上偏移1像素并转换回地理坐标（纬度方向）
          const pixelUp = [pixel.x, pixel.y + 1]
          const coordUp = map.unproject(pixelUp)
          const resolutionY = coord.lat - coordUp.lat // 纬度方向分辨率（度/像素）
          nearDis = ((resolutionX + resolutionY) / 2) * nearDistance
        } else {
          const zoomAndResolution = this.sceneController.getZoomAndResolution({
            lng: shape.x,
            lat: shape.y,
          })
          nearDis =
            (zoomAndResolution.resolution * nearDistance) / distanceUnits
        }
        return nearDis
      }
    },

    /**
     * 构造几何查询对象
     * @param layer 图层对象
     * @param shape 查询范围
     * @param nearDis 缓冲半径
     * @param queryType 查询类型
     * @returns
     */
    toQueryGeometry(
      layer,
      shape: Record<string, number> | Array<Record<string, number>>,
      nearDis,
      queryType
    ) {
      let geometry
      let pointArray

      switch (queryType) {
        case QueryType.Point:
          if (
            !this.is2DMapMode &&
            (layer.type === LayerType.IGSScene ||
              layer.type === LayerType.ModelCache)
          ) {
            let pointNearDis = nearDis
            const { x, y, z } = shape
            if (!pointNearDis) {
              // 如果nearDis为0，需要重置nearDis为0.0000001之类的，小数位数与坐标位数保持一致。igs接口这个参数不能直接设置为0
              const xStr = x.toString().split('.')[1]
              pointNearDis = 0.0001 || Number(`0.${xStr}`) / Number(xStr)
            }

            geometry = new Point3D(shape.x, shape.y, shape.z, {
              nearDis: pointNearDis,
            })
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
          let lineNearDis = nearDis
          pointArray = shape.map((item: Record<string, number>) => {
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
          break
        case QueryType.Polygon:
          let polyNearDis = nearDis
          pointArray = shape.map((item: Record<string, number>) => {
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
          break
        case QueryType.Cube:
        case QueryType.Circle:
        case QueryType.Rectangle:
          if (
            !this.is2DMapMode &&
            (layer.type === LayerType.IGSScene ||
              layer.type === LayerType.ModelCache)
          ) {
            const { xmin, ymin, xmax, ymax, zmin, zmax } = shape
            const tempZmin = zmin !== undefined ? zmin : -10000
            const tempZmax = zmax !== undefined ? zmax : 10000
            geometry = new Rectangle3D(
              xmin,
              ymin,
              tempZmin,
              xmax,
              ymax,
              tempZmax
            )
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
    /**
     * 查询IGS地图服务和IGS图层地图服务(简单要素类)
     * @param layer 图层对象
     * @param geometry 查询几何条件
     * @returns
     */
    async queryFeaturesByDoc(
      layer: IGSMapImageLayer | IGSVectorLayer,
      geometry
    ) {
      if (!layer.isVisible) {
        return
      }
      const { extend, tokenKey, tokenValue } = layer

      const { domain, docName } = layer._parseUrl(layer.url)

      const exhibition: IAttributeTableListExhibition = {
        id: `${layer.id}`,
        name: `${layer.title} 查询结果`,
        description: '',
        options: [],
        popupOption: extend.popupOption,
      }

      const sublayers = this.isShowLayerList
        ? this.getSublayers(layer.id)
        : layer.allSublayers

      let activeOptionId = ''

      for (let index = 0; index < sublayers.length; index++) {
        const sublayer = sublayers[index]
        if (
          !sublayer.visible ||
          (sublayer.sublayers && sublayer.sublayers.length > 0)
        ) {
          continue
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

        const option = {
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
          token: {
            tokenKey,
            tokenValue,
          },
        }

        exhibition.options.push(option)
        /**
         * 修改说明：先查询图层在当前范围内是否有数据，如果没有数据，则不在当前面板展示。确保当面面板展示有数据的图层
         * 修改人：龚跃健
         * 修改时间：2023/1/31
         */
        /**
         * fix(6188): 调用了额外的查询要素数目的接口
         * 修改人：杨琨 2024/9/3
         * 修改说明：查询到有符合要求的子图层后，就停止要素数目的查询，单纯要素查数目比查询要素数据要快
         */
        if (!activeOptionId) {
          const { TotalCount } = await this.queryCount(option)
          if (TotalCount > 0) {
            activeOptionId = sublayer.id
          }
        }
      }
      if (activeOptionId) {
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
      this.isQueryFeatures = true
    },
    /**
     * 获取要素查询中选中的子图层，(这个方法只有要素查询微件中使用)
     * @param id 图层id
     * @returns
     */
    getSublayers(id) {
      const relationKeys = this.layerKeyRelation[id]
      const checkList = this.checkList.filter((item) =>
        relationKeys.includes(item.key)
      )
      return checkList
    },
    /**
     * 获取图层服务的服务器信息
     * @param param
     * @returns
     */
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
    /**
     * IGSMapImage、IGSVector图层获取总页数,关联二维地图文档的三维服务也调用这个函数获取总页数
     * @param optionVal 查询参数
     * @param isScence 是否为场景服务
     * @returns
     */
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
        token,
      } = optionVal
      if (isScence) {
        const json = await FeatureQuery.igsQueryResourceServer({
          ip,
          port: port.toString(),
          domain,
          geometry,
          url: gdbp,
          returnCountOnly: true,
          tokenKey: token?.tokenKey,
          tokenValue: token?.tokenValue,
        })
        return { TotalCount: json.count }
      }
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
          tokenKey: token?.tokenKey,
          tokenValue: token?.tokenValue,
        },
        false,
        isScence
      )
      return featureSet
    },
  },
}
