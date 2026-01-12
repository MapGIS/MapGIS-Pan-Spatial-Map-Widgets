import {
  WidgetMixin,
  UUID,
  LayerType,
  LoadStatus,
  DataCatalogManager,
  UrlUtil,
  baseConfigInstance,
  LayerPropertyEdit,
} from '@mapgis/web-app-framework'
import MpBasemapItem from '../BasemapItem/BasemapItem.vue'
import { inOrderPromise } from '@mapgis/webclient-common'

export default {
  components: {
    MpBasemapItem,
  },
  mixins: [WidgetMixin],
  computed: {
    isShow: {
      get() {
        // 配置文件未更新时兼容旧版，默认显示为true
        if (this.widgetInfo.config.isShow === undefined) {
          this.$set(this.widgetInfo.config, 'isShow', true)
        }
        return this.widgetInfo.config.isShow
      },
      set(val) {
        this.widgetInfo.config.isShow = val
      },
    },
    imageUrl() {
      return function (image) {
        if (image.startsWith('http') || image.startsWith('https')) {
          return image
        }
        let targetUrl
        if (image.startsWith('/file')) {
          targetUrl = `${this.baseUrl}/${this.appProductName}${image}`
        } else {
          targetUrl = `${this.baseUrl}${image}`
        }
        return targetUrl
      }
    },
    /**
     * 获取默认选中的底图
     */
    defaultSelect() {
      return this.basemaps.filter((basemap) => {
        const { select = false, visible = false } = basemap
        return select && JSON.parse(visible)
      })
    },
  },
  data() {
    return {
      basemapNames: [],
      basemapNamesCopy: [],
      isInitMapRange: false, // 是否已初始化地图范围,只有初次进入程序，才会初始化地图范围
    }
  },
  methods: {
    // 清空底图
    clearBasemap(clearSelect = true) {
      this.basemaps.forEach((basemap) => {
        basemap.children.forEach((layer) => {
          const maplayer = this.document.baseLayerMap.findLayerById(layer.guid)
          this.document.baseLayerMap.remove(maplayer)
        })
        if (basemap.select) {
          basemap.select = false
        }
      })
      if (clearSelect) {
        this.basemapNames = []
      }
    },
    isShowChange(val) {
      if (!val) {
        this.basemapNamesCopy = [...this.basemapNames]
        this.clearBasemap()
      } else {
        this.basemapNames = [...this.basemapNamesCopy]
        this.basemapNames.forEach((guid) => {
          this.renderMaps(guid)
        })
      }
    },
    parseLayerType(typeString: string): LayerType {
      if (typeString === 'TILE3D') {
        return LayerType.ModelCache
      }
      const type = LayerType[typeString]
      if (type === undefined) {
        return LayerType.Unknown
      }

      return type
    },
    parseServerURL(url: string) {
      let newUrl
      if (this.designTime || this.previewTime) {
        // 门户的相对路径服务进行地址拼接
        if (url && url.startsWith('/')) {
          const { origin } = window.location
          newUrl = decodeURIComponent(origin + url)
        } else {
          newUrl = url
        }
      } else {
        if (url && url.startsWith('/')) {
          const { ip, port } = baseConfigInstance.config
          // 如果没有ip则不进行组装
          if (ip) {
            newUrl = port
              ? decodeURIComponent(`http://${ip}:${port}${url}`)
              : decodeURIComponent(`http://${ip}${url}`)
          } else {
            newUrl = url
          }
        } else {
          newUrl = url
        }
      }
      return newUrl
    },
    getLayerTypeString(type: number) {
      return LayerType[type]
    },

    // 微件失活时
    onDeActive() {
      // 微件失活时自动保存配置到后台
      this.saveConfig()
    },
    // 微件关闭时
    onClose() {
      // 微件失活时自动保存配置到后台
      this.saveConfig()
    },

    getBasemapMarginStyle(index) {
      const isMarginTop = index / 2 >= 1
      if (index % 2 === 0) {
        return {
          width: 'calc(50% - 5px)',
          marginRight: '10px',
          marginTop: isMarginTop ? '10px' : 0,
        }
      }
      return {
        width: 'calc(50% - 5px)',
        marginRigh: '10px',
        marginTop: isMarginTop ? '10px' : 0,
      }
    },

    // 将配置转换成可用于添加到map中的配置
    mapDataTransfromation(mapData, check) {
      return mapData
        .map((basemap) => {
          const { children } = basemap
          const layers = []
          for (let i = 0; i < children.length; i++) {
            let layer = children[i]
            // 索引底图只有一个图层，图层的描述必须为 "索引底图"，不然不会显示在其他底图上层
            let description = layer.description || ''
            if (check) {
              // 如果要兼容老版格式，可以在这里进行升级，转换成新的数据结构（数据与添加数据配置一致）
              layer = this.updateLayer(layer)
            }

            const layerConfig: any = {
              name: layer.name,
              guid: layer.guid || UUID.uuid(),
              description,
              serverURL: this.parseServerURL(layer.url),
              serverType: this.parseLayerType(layer.type),
              commonData: layer.commonData,
              serviceType: layer.serviceType,
            }
            if (layer.type === 'IGSVector') {
              if (!layer.url.includes('?') && layer.url.includes('gdbp')) {
                layerConfig.gdbps = layer.url
              }
            }
            if (layer.type === 'TILE3D') {
              layerConfig.customParameters = [
                {
                  format: 'cesium3dTileset',
                },
              ]
            }
            if (layer.token) {
              layerConfig.tokenValue = layer.token
              layerConfig.tokenKey = layer.tokenKey ? layer.tokenKey : 'token'
            } else {
              // 门户的服务加上token
              if (
                layerConfig.serverURL &&
                layerConfig.serverURL.startsWith(window.location.origin) &&
                (this.designTime || this.previewTime)
              ) {
                layerConfig.tokenValue =
                  'Bearer ' +
                  JSON.parse(localStorage.getItem('app_builder_token'))
                layerConfig.tokenKey = 'Authorization'
              }
            }

            layers.push(layerConfig)
          }
          return {
            ...basemap,
            children: layers,
          }
        })
        .filter((basemap) => {
          const { visible = 'true' } = basemap
          return visible === 'true'
        })
    },

    // 将配置转换成保存到服务器的格式
    transfromationMapData() {
      return this.basemaps.map((basemap) => {
        const { children } = basemap
        const layers = children.map((layer) => {
          const description = layer.description || ''
          const layerConfig = {
            guid: layer.guid,
            name: layer.name,
            description,
            url: this.getServerUrl(layer.serverURL),
            type:
              layer.commonData?.layerServiceType ||
              this.getLayerTypeString(layer.serverType),
            commonData: layer.commonData,
            serviceType: layer.serviceType,
          }
          if (layer.tokenValue) {
            if (
              layerConfig.url &&
              layerConfig.url.startsWith(window.location.origin) &&
              (this.designTime || this.previewTime)
            ) {
              // 门户服务不保存token信息，初始化时自动组装
            } else {
              layerConfig.token = layer.tokenValue
              layerConfig.tokenKey = layer.tokenKey ? layer.tokenKey : 'token'
            }
          }
          return layerConfig
        })
        return {
          ...basemap,
          children: layers,
        }
      })
    },
    getServerUrl(url) {
      let newUrl
      if (
        url &&
        url.startsWith(window.location.origin) &&
        (this.designTime || this.previewTime)
      ) {
        newUrl = url.replace(window.location.origin, '')
      } else {
        newUrl = url
      }
      return newUrl
    },

    /**
     * 初始化加载底图，按顺序加载底图
     * @param defaultSelectedBasemaps 默认选中的底图
     */
    initRenderMaps(defaultSelectedBasemaps) {
      const self = this
      let funcs = []
      for (let i = 0; i < defaultSelectedBasemaps.length; i++) {
        const guid = defaultSelectedBasemaps[i]
        for (let j = 0; j < self.basemaps.length; j++) {
          const basemap = self.basemaps[j]
          if (basemap.guid === guid) {
            funcs = [...funcs, ...self._getOrderPromise(basemap)]
            break
          }
        }
      }
      // 修改说明：引用@mapgis/webclient-common里的inOrderPromise,确保在同时加多个图层时，能按顺序加载
      // 修改人：龚跃健
      // 修改时间；2024-11-21
      inOrderPromise(funcs).then(() => {
        if (self.baseLayerMap && self.baseLayerMap.length > 0) {
          for (let i = 0; i < self.baseLayerMap.length; i++) {
            self.document.baseLayerMap.add(self.baseLayerMap[i])
          }
        }
      })
    },

    _getOrderPromise(basemap) {
      const self = this
      const funcs = []
      // 修改说明：克隆拿到document原有底图数组，避免重复加载
      // 修改人：龚跃健
      // 修改时间；2026-1-12
      self.baseLayerMap = self.document.baseLayerMap.clone().getFlatLayers()
      const { children } = basemap
      for (let k = 0; k < children.length; k++) {
        const layer = children[k]
        // 判断图层是否已加载
        const isAddMap = self.document.baseLayerMap.findLayerById(layer.guid)
        if (!isAddMap) {
          funcs.push(() => {
            return new Promise<void>((reslove) => {
              const mapLayer = DataCatalogManager.generateLayerByConfig(layer)
              mapLayer.description = layer.description
              if (mapLayer.loadStatus === LoadStatus.notLoaded) {
                mapLayer.load().then(() => {
                  if (
                    [
                      LayerType.IGSTile,
                      LayerType.VectorTile,
                      LayerType.ArcGISTile,
                      LayerType.OGCWMTS,
                      LayerType.WebTile,
                    ].includes(mapLayer.type)
                  ) {
                    // 瓦片图层计算第0级瓦片数量，判断是否需要关闭瓦片拉伸显示
                    const selfLayerPropertyEdit = LayerPropertyEdit
                    const { isStretchImage, firstTilesNum } =
                      selfLayerPropertyEdit.setExtension(mapLayer)
                    if (firstTilesNum > 9) {
                      this.$message.info(
                        `${mapLayer.title}瓦片第0级张数大于9，为了显示性能，已关闭瓦片拉伸（缩小）显示`
                      )
                    }
                    if (mapLayer.layerProperty) {
                      mapLayer.layerProperty.extensions = JSON.stringify({
                        isStretchImage,
                      })
                    } else {
                      mapLayer.layerProperty = {
                        extensions: JSON.stringify({
                          isStretchImage,
                        }),
                      }
                    }
                  }
                  self.baseLayerMap.push(mapLayer)
                  reslove()
                })
              } else {
                self.baseLayerMap.push(mapLayer)
                reslove()
              }
            })
          })
        }
      }
      return funcs
    },

    // 渲染底图到页面
    renderMaps(guid) {
      const self = this
      for (let i = 0; i < self.basemaps.length; i++) {
        const basemap = self.basemaps[i]
        if (basemap.guid === guid) {
          const funcs = [...this._getOrderPromise(basemap)]

          // 修改说明：引用@mapgis/webclient-common里的inOrderPromise,确保在同时加多个图层时，能按顺序加载
          // 修改人：龚跃健
          // 修改时间；2024-11-21
          inOrderPromise(funcs).then(() => {
            // 修改说明：排序后，将底图数组重新赋值给document.baseLayerMap
            // 修改人：龚跃健
            // 修改时间；2026-1-12
            if (self.baseLayerMap && self.baseLayerMap.length > 0) {
              for (let i = 0; i < self.baseLayerMap.length; i++) {
                const maplayer = this.document.baseLayerMap.findLayerById(
                  self.baseLayerMap[i].id
                )
                if (!maplayer) {
                  self.document.baseLayerMap.add(self.baseLayerMap[i])
                }
              }
            }
          })

          if (!basemap.select) {
            basemap.select = true
          }
          break
        }
      }
    },

    onUnSelect(id) {
      this.basemapNames.splice(
        this.basemapNames.findIndex((guid) => guid === id),
        1
      )
      for (let i = 0; i < this.basemaps.length; i++) {
        const basemap = this.basemaps[i]
        if (basemap.guid === id) {
          basemap.children.forEach((layer) => {
            const maplayer = this.document.baseLayerMap.findLayerById(
              layer.guid
            )
            this.document.baseLayerMap.remove(maplayer)
          })
          if (basemap.select) {
            basemap.select = false
          }
          break
        }
      }
      this.updateCurrentBaseMapConfig()
    },

    updateLayer(layer) {
      if (!layer.serverType) {
        return layer
      } else {
        const {
          serverType,
          serverUrl,
          layerType,
          serverip,
          serverport,
          layerName,
          projection,
          tokenKey,
          token,
        } = layer
        let protocol = window.location.protocol
        if (!!serverUrl && serverUrl.length > 0) {
          const tempUrl = new URL(serverUrl)
          protocol = tempUrl.protocol
        }
        const newLayer = { name: layerName, url: serverUrl }
        const ip = serverip
        const port = serverport
        // 类型映射表
        let map: Record<string, string>
        switch (serverType) {
          case 'tdt':
            newLayer.type = 'OGCWMTS'
            if (!serverUrl) {
              map = {
                // 天地图影像底图
                'Zondy.Enum.Map.TiandituType.IMG': 'img',
                // 天地图影像注记
                'Zondy.Enum.Map.TiandituType.CIA': 'cia',
                // 天地图矢量底图
                'Zondy.Enum.Map.TiandituType.VEC': 'vec',
                // 天地图矢量注记
                'Zondy.Enum.Map.TiandituType.CVA': 'cia',
              }
              const type = map[layerType] || layerType
              const tilematrixSet = projection.includes('EPSG:4326') ? 'c' : 'w'
              newLayer.url = `${protocol}//t${Math.round(
                Math.random() * 7
              )}.tianditu.gov.cn/${type}_${tilematrixSet}/wmts`
            }
            newLayer.tokenKey = 'tk'
            newLayer.token = '2ddaabf906d4b5418aed0078e1657029'
            break
          case 'arcgis':
            // 目前只支持ArcGISTile类型
            newLayer.type = 'ArcGISTile'
            if (!serverUrl) {
              map = {
                // ArcGIS影像图
                'Zondy.Enum.Map.ArcGISLayerType.ImageryWorld2D':
                  'ESRI_Imagery_World_2D',
                // ArcGIS街道图
                'Zondy.Enum.Map.ArcGISLayerType.StreetMapWorld2D':
                  'ESRI_StreetMap_World_2D',
                // ArcGIS地形图
                'Zondy.Enum.Map.ArcGISLayerType.TopoUS2D': 'NGS_Topo_US_2D',
              }
              const type = map[layerType] || layerType
              newLayer.url = `${protocol}//services.arcgisonline.com/ArcGIS/rest/services/${type}/MapServer`
            }
            break
          case 'WMS':
            newLayer.type = 'OGCWMS'
            break
          case 'WMTS':
            newLayer.type = 'OGCWMTS'
            break
          case 'tile':
            newLayer.type = 'IGSTile'
            if (!serverUrl) {
              newLayer.url = `${UrlUtil.getOrigin({
                ip,
                port,
              })}/igs/rest/mrms/tile/${layerName}`
            }
            break
          case 'doc':
            newLayer.type = 'IGSMapImage'
            if (!serverUrl) {
              newLayer.url = `${UrlUtil.getOrigin({
                ip,
                port,
              })}/igs/rest/mrms/docs/${layerName}`
            }
            break
          case 'layer':
            newLayer.type = 'IGSVector'
            if (!serverUrl) {
              newLayer.url = `${UrlUtil.getOrigin({
                ip,
                port,
              })}/igs/rest/mrms/layers?gdbps=${layerName}`
            }
            break
          default:
            break
        }

        if (token) {
          newLayer.tokenKey = tokenKey
          newLayer.token = token
        }

        return newLayer
      }
    },
  },
}
