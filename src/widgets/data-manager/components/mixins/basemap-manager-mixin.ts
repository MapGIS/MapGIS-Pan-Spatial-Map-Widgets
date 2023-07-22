import {
  WidgetMixin,
  UUID,
  LayerType,
  LoadStatus,
  FitBound,
  DataCatalogManager,
} from '@mapgis/web-app-framework'
import MpBasemapItem from '../BasemapItem/BasemapItem.vue'

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
        return this.baseUrl + image
      }
    },
    /**
     * 获取默认选中的底图
     */
    defaultSelect() {
      return this.basemaps.filter((basemap) => {
        const { select = false } = basemap
        return select
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
    clearBasemap() {
      this.basemaps.forEach((basemap) => {
        basemap.children.forEach((layer) => {
          const maplayer = this.document.baseLayerMap.findLayerById(layer.guid)
          this.document.baseLayerMap.remove(maplayer)
        })
        if (basemap.select) {
          basemap.select = false
        }
      })
      this.basemapNames = []
    },
    isShowChange(val) {
      if (!val) {
        this.basemapNamesCopy = [...this.basemapNames]
        this.clearBasemap()
      } else {
        this.basemapNames = [...this.basemapNamesCopy]
        this.basemapNames.forEach((name) => {
          this.renderMaps(name)
        })
      }
    },
    fitBounds(item, init) {
      const { Cesium, map, vueCesium, viewer } = this
      const isOutOfRange = FitBound.fitBoundByLayer(
        item,
        {
          Cesium,
          map,
          viewer,
          vueCesium,
        },
        this.is2DMapMode === true,
        undefined,
        init
      )
      if (isOutOfRange) {
        this.$message.error('初始底图范围有误，已调整为经纬度最大范围')
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
    mapDataTransfromation(mapData, check, indexBaseMapGUID) {
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

              if (basemap.guid == indexBaseMapGUID && i == 0) {
                description = '索引底图'
              } else {
                if (description === '索引底图') {
                  description = ''
                }
              }
            }

            const layerConfig = {
              name: layer.name,
              guid: UUID.uuid(),
              description,
              serverURL: layer.url,
              serverType: this.parseLayerType(layer.type),
              commonData: layer.commonData,
              serviceType: layer.serviceType,
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
            name: layer.name,
            description,
            url: layer.serverURL,
            type: layer.commonData.layerServiceType,
            commonData: layer.commonData,
            serviceType: layer.serviceType,
          }
          if (layer.tokenValue) {
            layerConfig.token = layer.tokenValue
            layerConfig.tokenKey = layer.tokenKey ? layer.tokenKey : 'token'
          }
          return layerConfig
        })
        return {
          ...basemap,
          children: layers,
        }
      })
    },

    // 渲染底图到页面
    renderMaps(name, isZoomTo, init) {
      for (let i = 0; i < this.basemaps.length; i++) {
        const basemap = this.basemaps[i]
        if (basemap.name === name) {
          basemap.children.forEach(async (layer) => {
            const mapLayer = DataCatalogManager.generateLayerByConfig(layer)
            mapLayer.description = layer.description
            if (mapLayer.loadStatus === LoadStatus.notLoaded) {
              await mapLayer.load()
              this.document.baseLayerMap.add(mapLayer)
              if (isZoomTo || mapLayer.type === LayerType.STKTerrain) {
                this.fitBounds(mapLayer, init)
              } else if (mapLayer.type === LayerType.IGSScene) {
                setTimeout(() => {
                  this.fitBounds(mapLayer, init)
                }, 500)
              }
            } else {
              this.document.baseLayerMap.add(mapLayer)
            }
          })
          if (!basemap.select) {
            basemap.select = true
          }
          break
        }
      }
    },

    onUnSelect(name) {
      this.basemapNames.splice(
        this.basemapNames.findIndex((basemapName) => basemapName === name),
        1
      )
      for (let i = 0; i < this.basemaps.length; i++) {
        const basemap = this.basemaps[i]
        if (basemap.name === name) {
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
              newLayer.url = `${protocol}//${serverip}:${serverport}/igs/rest/mrms/tile/${layerName}`
            }
            break
          case 'doc':
            newLayer.type = 'IGSMapImage'
            if (!serverUrl) {
              newLayer.url = `${protocol}//${serverip}:${serverport}/igs/rest/mrms/docs/${layerName}`
            }
            break
          case 'layer':
            newLayer.type = 'IGSVector'
            if (!serverUrl) {
              newLayer.url = `${protocol}//${serverip}:${serverport}/igs/rest/mrms/layers?gdbps=${layerName}`
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
