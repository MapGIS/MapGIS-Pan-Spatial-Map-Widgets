import {
  AppMixin,
  LayerType,
  Feature,
  baseConfigInstance,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'

const { FeatureQuery } = Feature

// LayerTypeUtil
export default {
  mixins: [AppMixin],
  data() {
    return {
      layers: [],
    }
  },
  methods: {
    /**
     * 判断是否是子图层
     * @param item layer图层
     * @returns boolean
     */
    isSubLayer(item) {
      const { key, sublayers, activeScene } = item
      if (this.isIGSScene(item) && activeScene) {
        return !activeScene.sublayers || activeScene.sublayers.length === 0
      }
      return !sublayers || sublayers.length === 0
    },
    /**
     * 判断是否是父级图层
     * @param item layer图层
     * @returns boolean
     */
    isParentLayer({ key }) {
      return key.split('-').length === 1
    },
    /**
     * 判断是否是IGS图层
     * @param item layer图层
     * @returns boolean
     */
    isIgsVectorLayer({ type }) {
      return type === LayerType.IGSVector
    },
    /**
     * 判断是否是三维图层
     * @param item layer图层
     * @returns boolean
     */
    isIGSScene({ type, layer }) {
      let layerType = type
      if (layer) {
        layerType = layer.type
      }
      return layerType === LayerType.IGSScene
    },
    /**
     * 判断是否是瓦片图层
     * @param item layer图层
     * @returns boolean
     */
    isIgsTileLayer({ type }) {
      return type === LayerType.IGSTile
    },
    /**
     * 判断是否是ModelCache图层
     * @param item layer图层
     * @returns boolean
     */
    isModelCacheLayer({ type }) {
      return type === LayerType.ModelCache
    },
    /**
     * 判断是否是矢量瓦片
     * @param item layer图层
     * @returns boolean
     */
    isVectorTile({ type, key }) {
      // 矢量文档子图层没有type属性，需要找到他的父级查看他是什么类型的属性
      if (
        key !== undefined &&
        key !== null &&
        key !== '' &&
        key.indexOf('-') > -1
      ) {
        const index = key.split('-')[0]
        return this.layers[index]?.type === LayerType.VectorTile
      }
      return type === LayerType.VectorTile
    },
    /**
     * 判断是否是矢量瓦片的子图层（针对矢量瓦片制图）
     * @param item 图层
     * @returns
     */
    isVectorTileSubLayer(item) {
      return (
        this.$scopedSlots['vector-tile-sublayer-popover'] &&
        this.isSubLayer(item) &&
        this.isVectorTile(item)
      )
    },
    /**
     * 判断是否是矢量文档
     * @param item layer图层
     * @returns boolean
     */
    isIgsDocLayer({ type, layer }) {
      let layerType = type
      if (layer) {
        layerType = layer.type
      }
      return layerType === LayerType.IGSMapImage
    },
    /**
     * 判断是否是wmts选中图层
     * @param item layer图层
     * @returns boolean
     */
    isActiveWMTSLayer({ layer: { activeLayer }, id }) {
      return activeLayer && activeLayer.id === id
    },
    /**
     * 判断是否是wmts图层
     * @param item layer图层
     * @returns boolean
     */
    isWMTSLayer({ type }) {
      return type === LayerType.OGCWMTS
    },
    /**
     * 判断是否是wms图层
     * @param item layer图层
     * @returns boolean
     */
    isWMSLayer({ type }) {
      return type === LayerType.OGCWMS
    },
    /**
     * 判断是否展示列表右侧操作菜单（在在线制图组件中需要打开左侧弹框组件）
     * @param item 图层
     * @returns
     */
    showPopover(item) {
      if (
        (this.isParentLayer(item) && this.isMetaData(item)) ||
        this.isAttributes(item) ||
        this.isParentLayer(item) ||
        this.isIGSScene(item) ||
        (this.isParentLayer(item) && this.isWMTSLayer(item)) ||
        (this.isParentLayer(item) && !this.isIGSScene(item)) ||
        (item.layer &&
          this.isWMTSLayer(item.layer) &&
          this.isActiveWMTSLayer(item)) ||
        this.isVectorTileSubLayer(item)
      ) {
        return true
      }
      return false
    },
    /**
     * 判断是否是展示属性表按钮
     * @param item layer图层
     * @returns boolean
     */
    isAttributes(item) {
      const bool =
        (this.isSubLayer(item) && this.isIgsDocLayer(item)) ||
        (this.isSubLayer(item) &&
          this.isIGSScene(item) &&
          this.includeBindData(item)) ||
        (this.isSubLayer(item) && this.isArcGISMapImage(item)) ||
        this.isIgsVectorLayer(item) ||
        this.isDataFlow(item) ||
        (this.isModelCacheLayer(item) && this.includeBindData(item))

      return bool
    },
    /**
     * 判断是否是绑定BindData
     * @param item layer图层
     * @returns boolean
     */
    includeBindData(item) {
      const layer = item.layer || item
      if (layer) {
        const { id } = layer
        const layerConfig = dataCatalogManagerInstance.getLayerConfigByID(id)
        if (layerConfig && layerConfig.bindData) {
          return true
        } else {
          return false
        }
      }
      return false
    },
    /**
     * 判断是否是展示元数据按钮
     * @param item layer图层
     * @returns boolean
     */
    isMetaData(item) {
      const bool =
        // this.isParentLayer(item) &&
        this.isIGSScene(item) ||
        this.isIgsDocLayer(item) ||
        this.isIgsVectorLayer(item) ||
        this.isIgsTileLayer(item) ||
        this.isWMTSLayer(item) ||
        this.isWMSLayer(item) ||
        this.isArcGISMapImage(item) ||
        this.isArcGISTile(item) ||
        this.isVectorTile(item)
      return bool
    },
    /**
     * 判断是否是ArcGISMapImage
     * @param item layer图层
     * @returns boolean
     */
    isArcGISMapImage({ layer, type }) {
      let layerType = type
      if (layer) {
        layerType = layer.type
        return layerType === LayerType.ArcGISMapImage
      }
      return layerType === LayerType.ArcGISMapImage
    },
    /**
     * 判断是否是ArcGISTile
     * @param item layer图层
     * @returns boolean
     */
    isArcGISTile({ layer, type }) {
      let layerType = type
      if (layer) {
        layerType = layer.type
        return layerType === LayerType.ArcGISTile
      }
      return layerType === LayerType.ArcGISTile
    },
    /**
     * 判断是否是DataFlow
     * @param item layer图层
     * @returns boolean
     */
    isDataFlow({ layer, type }) {
      let layerType = type
      if (layer) {
        layerType = layer.type
        return layerType === LayerType.DataFlow
      }
      return layerType === LayerType.DataFlow
    },

    isFitbound(layer) {
      if (this.isParentLayer(layer)) {
        // if (this.isIGSScene(layer) && this.is2DMapMode === false) {
        //   return true
        // } else if (!this.isIGSScene(layer)) {
        //   return true
        // }
        return true
      }
      return false
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

    /**
     * 获取结果集查询参数
     */
    getExhibition(layer, titleType, queryType) {
      debugger
      const parent = layer.layer
      let exhibition: Record<string, any> | null = null
      const arr: Array<Record<string, any>> = [
        {
          type: parent && this.isIgsDocLayer(parent),
          setValue: () => {
            const { domain, docName } = parent._parseUrl(parent.url)
            // const {
            //   isDataStoreQuery,
            //   DNSName
            // } = await FeatureQuery.isDataStoreQuery({
            //   ip,
            //   port,
            //   gdbp: layer.url
            // })
            /**
             * 修改说明：IGS地图文档和图层服务全部都走IGS的接口，不再判断是否为pg数据
             * 修改人：龚跃健
             * 日期：2022-5-10
             */
            const isDataStoreQuery = false
            const DNSName = undefined
            const ipPortObj = this.getIpPort({ isDataStoreQuery })
            exhibition = {
              id: `${parent.title} ${layer.title} ${layer.id}`,
              name: `${layer.title} ${titleType}`,
              description: `${parent.title} ${layer.title}`,
              option: {
                id: layer.id,
                name: layer.title,
                isDataStoreQuery,
                DNSName,
                domain,
                ...ipPortObj,
                serverType: parent.type,
                layerIndex: layer.id,
                gdbp: layer.url,
                serverName: docName,
                serverUrl: parent.url,
                f: queryType || '',
              },
              popupOption: parent.extend?.popupOption,
            }
          },
        },
        {
          type: this.isIgsVectorLayer(layer),
          setValue: () => {
            const igsVectorLayer = layer.dataRef
            const { domain, docName } = igsVectorLayer._parseUrl(layer.url)
            // const { isDataStoreQuery, DNSName } =
            //   await FeatureQuery.isDataStoreQuery({
            //     ip,
            //     port,
            //     gdbp: igsVectorLayer.gdbps,
            //   })
            const isDataStoreQuery = false
            const DNSName = undefined
            const ipPortObj = this.getIpPort({ isDataStoreQuery })
            exhibition = {
              id: `${igsVectorLayer.title} ${igsVectorLayer.id}`,
              name: `${igsVectorLayer.title} ${titleType}`,
              option: {
                id: igsVectorLayer.id,
                domain,
                // ip: ip || baseConfigInstance.config.ip,
                // port: Number(port || baseConfigInstance.config.port),
                ...ipPortObj,
                isDataStoreQuery,
                DNSName,
                serverType: igsVectorLayer.type,
                gdbp: igsVectorLayer.gdbps,
                f: queryType || '',
              },
              popupOption: parent
                ? parent.extend?.popupOption
                : layer.extend?.popupOption,
            }
          },
        },
        {
          type: this.isArcGISMapImage(layer),
          setValue: () => {
            exhibition = {
              id: `${parent.title} ${layer.title} ${layer.id}`,
              name: `${layer.title} ${titleType}`,
              description: `${parent.title} ${layer.title}`,
              option: {
                id: layer.id,
                name: layer.title,
                serverType: parent.type,
                layerIndex: layer.id,
                serverUrl: parent.url,
                f: queryType || '',
              },
              popupOption: parent.extend?.popupOption,
            }
          },
        },
        {
          type: this.isIGSScene(layer),
          setValue: () => {
            const sceneLayer = layer.dataRef
            const { domain, docName } = parent._parseUrl(parent.url)
            const { id, name, title } = sceneLayer
            const layerConfig = dataCatalogManagerInstance.getLayerConfigByID(
              parent.id
            )
            console.log(
              'serverType',
              parent.type,
              layerConfig.bindData.serverType
            )
            if (layerConfig && layerConfig.bindData) {
              exhibition = {
                id: `${title} ${id}`,
                name: `${title} ${titleType}`,
                option: {
                  id: `${id}`,
                  domain,
                  ip: baseConfigInstance.config.ip,
                  port: Number(baseConfigInstance.config.port),
                  serverType: parent.type,
                  searchServiceType: layerConfig.bindData.serverType,
                  gdbp: layerConfig.bindData.gdbps,
                  f: queryType || '',
                },
                popupOption: parent.extend?.popupOption,
              }
            }
          },
        },
        {
          type: this.isModelCacheLayer(layer),
          setValue: () => {
            const sceneLayer = layer.dataRef
            const url = new URL(layer.url)
            const domain = url.origin
            const { id, name, title } = sceneLayer
            const layerConfig = dataCatalogManagerInstance.getLayerConfigByID(
              layer.id
            )
            if (layerConfig && layerConfig.bindData) {
              exhibition = {
                id: `${title} ${id}`,
                name: `${title} ${titleType}`,
                option: {
                  id: `${id}`,
                  domain,
                  ip: baseConfigInstance.config.ip,
                  port: Number(baseConfigInstance.config.port),
                  serverType: layer.type,
                  searchServiceType: layerConfig.bindData.serverType,
                  gdbp: layerConfig.bindData.gdbps,
                  f: queryType || '',
                },
              }
            }
          },
        },
        {
          type: this.isDataFlow(layer),
          setValue: () => {
            exhibition = {
              id: `${layer.title} ${layer.title} ${layer.id}`,
              name: `${layer.title} ${titleType}`,
              option: {
                id: layer.id,
                name: layer.title,
                serverType: layer.type,
                f: queryType || '',
              },
              popupOption: parent.extend?.popupOption,
            }
          },
        },
      ]
      // arr.forEach(item => {
      //   if (item.type) {
      //     item.setValue()
      //   }
      // })

      for (let index = 0; index < arr.length; index++) {
        const item = arr[index]
        if (item.type) {
          item.setValue()
        }
      }
      return exhibition
    },
  },
}
