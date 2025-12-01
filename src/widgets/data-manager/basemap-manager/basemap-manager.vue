<template>
  <div class="mp-widget-basemap-manager">
    <mapgis-ui-switch-row-left
      title="显示底图"
      v-model="isShow"
      @change="isShowBasemapChange"
    />
    <div class="basemap-wrapper">
      <mp-basemap-item
        v-for="basemap in basemaps"
        :key="basemap.name"
        :guid="basemap.guid"
        :name="basemap.name"
        :image="imageUrl(basemap.image)"
        :active="basemapNames.includes(basemap.guid)"
        :visible="JSON.parse(basemap.visible)"
        @select="onCheck"
        @un-select="onUnSelect"
      >
      </mp-basemap-item>
    </div>
  </div>
</template>

<script lang="ts">
import {
  api,
  BaseMapController,
  Layer3D,
  DataCatalogManager,
  LoadStatus,
  eventBus,
  LayerPropertyEdit,
} from '@mapgis/web-app-framework'
import basemapManagerMixins from '../components/mixins/basemap-manager-mixin.ts'
import { remove } from '../../../../../MapGIS-Web-App-Framework/src/utils/array-util'

export default {
  name: 'MpBasemapManager',
  mixins: [basemapManagerMixins],
  data() {
    return {
      baseMapController: BaseMapController,
    }
  },
  computed: {
    basemaps() {
      const baseMapList = this.widgetInfo.config.baseMapList

      // 将配置转换成可用于添加到map中的配置
      const maps = this.mapDataTransfromation(baseMapList, true)
      return maps
    },
    isResize() {
      return this.baseMapController.isResize
    },
  },
  watch: {
    'baseMapController.setBaseMapInfo': {
      deep: true,
      // immediate: true,
      handler(val) {
        this.clearBasemap()
        // 重置
        if (!val && this.isResize) {
          // 还原成_currentBaseMapInfo中的数据
          const baseMapInfo = { ...this.baseMapController.currentBaseMapInfo }
          this.setBaseMap(baseMapInfo)
        } else if (!val && !this.isResize) {
          // 再次点击收藏夹相同收藏，不做处理
        } else {
          this.setBaseMap(val)
        }
      },
    },
  },
  mounted() {
    // 配置文件无isShow属性时默认设置为true
    const {
      indexBaseMapGUID,
      isShow = true,
      loadOrder = [],
    } = { ...this.widgetInfo.config }
    // 获取到初始化底图信息
    const initConfig = this.baseMapConfig()
    const onSelect = this.defaultSelect.map((item) => item.guid)
    const unSelect = this.basemaps
      .filter((item) => !item.select)
      .map((item) => item.guid)
    initConfig.onSelect = onSelect
    initConfig.unSelect = unSelect
    this.baseMapController.initBaseMapInfo = initConfig
    this.baseMapController.currentBaseMapInfo = initConfig
    this.baseMapController.baseMapList = this.basemaps.map((item) => item)
    // 不开启显示时不加载底图并将底图选中全部置为false
    if (!isShow) {
      this.basemaps.forEach((basemap) => {
        if (basemap.select) {
          basemap.select = false
        }
      })
      return
    }
    const defaultSelectedBasemaps = []

    // 加载显示配置里已设置默认选中的底图
    if (this.defaultSelect && this.defaultSelect.length > 0) {
      // 应用搭建状态下恢复底图加载顺序
      if (loadOrder && loadOrder.length) {
        for (let i = 0; i < loadOrder.length; i++) {
          const isMapExsit = this.defaultSelect.find(
            (item) => item.guid === loadOrder[i]
          )
          if (isMapExsit) {
            defaultSelectedBasemaps.push(loadOrder[i])
          }
        }
      } else {
        for (let i = 0; i < this.defaultSelect.length; i++) {
          defaultSelectedBasemaps.push(this.defaultSelect[i].guid)
        }
      }
      this.initSelectedBasemap(defaultSelectedBasemaps)
    }
  },
  methods: {
    onWidgetConfigChange(config, preConfig) {
      // 处理变化的底图
      const baseMapList = config.baseMapList
      const preBaseMapList = preConfig.baseMapList
      // 判断是否有移除的底图，记录移除的底图，在底图管理微件中进行移除操作，需要考虑已加载的底图
      const removeBaseMapList = preBaseMapList.filter((layer) => {
        return !baseMapList.find((item) => item.guid === layer.guid)
      })

      // 除了要考虑底图是否被选中，还需要考虑底图是否显示
      const loadBaseMapList = baseMapList.filter(
        (layer) => layer.select && JSON.parse(layer.visible)
      )

      const hasLoadBaseMap = this.onBaseMapListChange(
        baseMapList,
        removeBaseMapList,
        loadBaseMapList
      )

      // 如果是单底图模式只加载最后一个底图
      if (config.isSingleMode) {
        this.basemapNames = this.basemapNames.slice(-1)
        // 如果是单底图模式先移除所有底图再添加
        this.clearBasemap(false)
      }

      // 判断是否显示底图选项是否变化
      if (config.isShow !== preConfig.isShow) {
        // 如果是由不显示底图到显示底图则直接加载所有
        if (config.isShow) {
          // 如果是单底图模式只加载最后一个底图
          this.initRenderMaps(this.basemapNames)
        } else {
          this.clearBasemap()
        }
        // 微件配置改变后，清空用于开启/关闭底图显示时记录上一次加载的底图信息
        this.basemapNamesCopy = []
      } else {
        // 如果是否显示底图选项不变则直接加载已选中未加载的底图
        if (hasLoadBaseMap.length) {
          this.initRenderMaps(
            config.isSingleMode ? hasLoadBaseMap.slice(-1) : hasLoadBaseMap
          )
        } else {
          // 没有需要加载的底图使用已经加载的底图
          this.initRenderMaps(this.basemapNames)
        }
      }

      this.changeBaseMap(config.isShow)
      this.updateCurrentBaseMapConfig()
    },
    onBaseMapListChange(baseMapList, removeBaseMapList, loadBaseMapList) {
      // basemapNames中移除地图视图已加载底图但被删除的底图
      removeBaseMapList.forEach((basemap) => {
        if (this.basemapNames.includes(basemap.guid)) {
          this.basemapNames = this.basemapNames.filter(
            (item) => item !== basemap.guid
          )
          basemap.children.forEach((layer) => {
            const maplayer = this.document.baseLayerMap.findLayerById(
              layer.guid
            )
            this.document.baseLayerMap.remove(maplayer)
          })
        }
      })

      // 移除未删除但取消加载的底图
      const hasRemoveLoadBaseMap = []
      this.basemapNames = this.basemapNames.filter((item) => {
        const target = loadBaseMapList.find((layer) => layer.guid === item)
        if (!target) {
          hasRemoveLoadBaseMap.push(item)
        }
        return target
      })

      hasRemoveLoadBaseMap.forEach((item) => {
        const basemap = baseMapList.find((basemap) => basemap.guid === item)
        basemap.children.forEach((layer) => {
          const maplayer = this.document.baseLayerMap.findLayerById(layer.guid)
          this.document.baseLayerMap.remove(maplayer)
        })
      })

      // 当前未删除但加载的底图
      const hasLoadBaseMap = loadBaseMapList
        .filter((item) => !this.basemapNames.includes(item.guid))
        .map((item) => item.guid)

      this.basemapNames = [...this.basemapNames, ...hasLoadBaseMap]
      return hasLoadBaseMap
    },
    /**
     * 默认选中底图加载
     * @param {Array} defaultSelectedBasemaps
     */
    initSelectedBasemap(defaultSelectedBasemaps) {
      let selectedBasemaps = [...defaultSelectedBasemaps]
      if (!this.isShow) return
      if (this.widgetInfo.config.isSingleMode) {
        // 单底图模式，只加载最后一个底图
        selectedBasemaps = [
          defaultSelectedBasemaps[defaultSelectedBasemaps.length - 1],
        ]
      }
      for (let i = 0; i < selectedBasemaps.length; i++) {
        this.basemapNames.push(selectedBasemaps[i])
      }
      this.updateCurrentBaseMapConfig()
      this.initRenderMaps(selectedBasemaps)
    },
    isShowBasemapChange(val) {
      this.changeBaseMap(val)
      this.isShowChange(val)
    },
    changeBaseMap(val) {
      const baseMapInfo = { ...this.baseMapController.currentBaseMapInfo }
      // 直接设置isShow即可
      baseMapInfo.baseMapShow = val
      if (val) {
        baseMapInfo.onSelect = [...this.basemapNames]
        baseMapInfo.unSelect = this.basemaps.filter(
          (item) => !this.basemapNames.includes(item)
        )
      }
      this.baseMapController.currentBaseMapInfo = baseMapInfo
    },
    setBaseMap(val) {
      if (!val.baseMapShow) {
        this.isShow = false
        return
      }
      // 收藏夹地图数据显示, 当前未开启底图显示则开启，底图单选不做处理
      if (!this.isShow && val.baseMapShow) {
        this.isShow = !this.isShow
      }
      const { onSelect, zoomArr } = val
      this.basemapNames = []
      // 通过baseMapController控制的地图设置信息不同步到_currentBaseMapInfo中，直接存放在_setBaseMapInfo
      // this.updateCurrentBaseMapConfig()
      if (onSelect && onSelect.length > 0) {
        const promiseAll = []
        onSelect.forEach((item) => {
          this.onSelect(item, zoomArr.includes(item))
        })
      }
    },
    generateLayer(guid) {
      return new Promise((resolve, reject) => {
        const basemap = this.basemaps.find((item) => item.guid === guid)
        if (basemap) {
          const allLayers = []
          basemap.children.forEach(async (layer, index) => {
            const mapLayer = DataCatalogManager.generateLayerByConfig(layer)
            mapLayer.description = layer.description
            if (mapLayer.loadStatus === LoadStatus.notLoaded) {
              await mapLayer.load()
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
            }
            allLayers.push(mapLayer)
            // 最后一个图层
            if (basemap.children.length === index + 1) {
              resolve(allLayers)
            }
          })
          if (!basemap.select) {
            basemap.select = true
          }
        } else {
          reject(null)
        }
      })
    },
    // 判断是不是三维图层类型
    is3DLayer(layer) {
      if (layer instanceof Layer3D) {
        return true
      }
      return false
    },
    // 初始化配置信息记录到BaseMapController
    baseMapConfig() {
      const {
        indexBaseMapGUID,
        isShow,
        isSingleMode,
        baseMapList = [],
      } = {
        ...this.widgetInfo.config,
      }
      const config = {
        baseMapShow: isShow,
        isSingleMode,
        indexBaseMapGUID,
        baseMapZoomTo: false,
        zoomArr: [],
      }
      return config
    },
    onSelect(guid) {
      if (!this.isShow) return
      if (this.widgetInfo.config.isSingleMode) {
        this.clearBasemap()
      }
      this.basemapNames.push(guid)
      this.updateCurrentBaseMapConfig()
      this.renderMaps(guid)
    },
    // 通过点击底图进行勾选使用onCheck方法，用于区分是否为点击底图进行勾选
    onCheck(guid) {
      if (!this.isShow) return
      if (this.widgetInfo.config.isSingleMode) {
        this.clearBasemap()
      }
      this.basemapNames.push(guid)
      this.updateCurrentBaseMapConfig()
      this.renderMaps(guid)
    },
    updateCurrentBaseMapConfig() {
      const config = this.baseMapConfig()
      const onSelect = this.basemapNames.map((item) => item)
      const unSelect = this.basemaps
        .filter((item) => !onSelect.includes(item.guid))
        .map((item) => item.guid)
      config.onSelect = onSelect
      config.unSelect = unSelect
      this.baseMapController.currentBaseMapInfo = config
    },
    getSaveConfig() {
      const baseMapList = this.transfromationMapData()
      const { indexBaseMapGUID, isSingleMode } = { ...this.widgetInfo.config }
      const isShow = this.isShow
      const config = {
        baseMapList,
        indexBaseMapGUID,
        isSingleMode,
        isShow,
      }
      return config
    },
    saveConfig() {
      if (this.designTime) {
        this.updateWidgetConfig()
      } else if (this.previewTime) {
      } else {
        const config = this.getSaveConfig(this.basemaps)
        api
          .saveWidgetConfig({
            name: 'basemap-manager',
            config: JSON.stringify(config),
          })
          .then(() => {
            console.log('更新底图配置成功')
          })
          .catch(() => {
            console.log('更新底图配置失败')
          })
      }
    },
    // 应用搭建状态下直接修改widgeConfig
    updateWidgetConfig() {
      if (this.designTime) {
        const config = this.getSaveConfig(this.basemaps)
        // 记录加载顺序
        config.loadOrder = this.basemapNames
        // 更新数据
        this.setWidgetData(config)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-basemap-manager {
  padding: 8px;
  .basemap-wrapper {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
