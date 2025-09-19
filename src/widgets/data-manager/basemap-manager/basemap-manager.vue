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
  baseConfigInstance,
  BaseMapController,
  Layer3D,
  DataCatalogManager,
  LoadStatus,
  eventBus,
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
      const indexBaseMapGUID = this.widgetInfo.config.indexBaseMapGUID
      let defaultBasemap
      for (let i = 0; i < baseMapList.length; i++) {
        const basemap = baseMapList[i]
        if (basemap.guid == indexBaseMapGUID) {
          baseMapList.splice(i, 1)
          defaultBasemap = basemap
          break
        }
      }
      if (defaultBasemap) {
        baseMapList.push(defaultBasemap)
      }

      // 将配置转换成可用于添加到map中的配置
      const maps = this.mapDataTransfromation(
        baseMapList,
        true,
        indexBaseMapGUID
      )
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
    const { initPositionMode } = baseConfigInstance.config
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

    // 加载显示配置里已设置默认选中的底图
    if (this.defaultSelect && this.defaultSelect.length > 0) {
      // 应用搭建状态下恢复底图加载顺序
      if (loadOrder && loadOrder.length) {
        for (let i = 0; i < loadOrder.length; i++) {
          const isMapExsit = this.defaultSelect.find(
            (item) => item.guid === loadOrder[i]
          )
          if (isMapExsit) {
            let isZoomTo = false
            let init = false
            // 以索引底图的范围为初始范围
            if (
              initPositionMode === 'basemapExtent' &&
              loadOrder[i] === indexBaseMapGUID
            ) {
              isZoomTo = true
              init = true
            }
            this.onSelect(loadOrder[i], isZoomTo, init)
          }
        }
      } else {
        for (let i = 0; i < this.defaultSelect.length; i++) {
          let isZoomTo = false
          let init = false
          // 以索引底图的范围为初始范围
          if (
            initPositionMode === 'basemapExtent' &&
            this.defaultSelect[i].guid === indexBaseMapGUID
          ) {
            isZoomTo = true
            init = true
          }
          this.onSelect(this.defaultSelect[i].guid, isZoomTo, init)
        }
      }
    }

    eventBus.$on('basemap-manager-change', this.updateBaseMap)
  },
  methods: {
    isShowBasemapChange(val) {
      this.changeBaseMap(val)
      this.isShowChange(val)
      this.updateWidgetConfig()
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
    generateLayer(guid, isZoomTo = false) {
      return new Promise((resolve, reject) => {
        const basemap = this.basemaps.find((item) => item.guid === guid)
        if (basemap) {
          const allLayers = []
          basemap.children.forEach(async (layer, index) => {
            const mapLayer = DataCatalogManager.generateLayerByConfig(layer)
            mapLayer.description = layer.description
            if (mapLayer.loadStatus === LoadStatus.notLoaded) {
              await mapLayer.load()
              // 正常来说收藏夹不会走此逻辑
              if (isZoomTo) {
                if (this.is3DLayer(mapLayer)) {
                  setTimeout(() => {
                    // this.fitBounds(mapLayer, false)
                  }, 500)
                } else {
                  this.fitBounds(mapLayer, false)
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
      const baseMapZoomTo =
        this.defaultSelect.includes(indexBaseMapGUID) ||
        this.basemapNames.includes(indexBaseMapGUID)
      // onSelect和unSelect根据场景不同自己组装
      // const onSelect = this.defaultSelect
      //   .filter((item) => item.guid !== indexBaseMapGUID)
      //   .map((item) => item.guid)
      // const unSelect = baseMapList
      //   .filter((item) => !item.select)
      //   .map((item) => item.guid)
      const config = {
        baseMapShow: isShow,
        isSingleMode,
        indexBaseMapGUID,
        baseMapZoomTo,
        zoomArr: [],
      }
      return config
    },
    onSelect(guid, isZoomTo = false, init = false) {
      if (!this.isShow) return
      if (this.widgetInfo.config.isSingleMode) {
        this.clearBasemap()
      }
      this.basemapNames.push(guid)
      this.updateCurrentBaseMapConfig()
      this.renderMaps(guid, isZoomTo, init)
    },
    // 通过点击底图进行勾选使用onCheck方法，用于区分是否为点击底图进行勾选
    onCheck(guid, isZoomTo = false, init = false) {
      if (!this.isShow) return
      if (this.widgetInfo.config.isSingleMode) {
        this.clearBasemap()
      }
      this.basemapNames.push(guid)
      this.updateCurrentBaseMapConfig()
      this.renderMaps(guid, isZoomTo, init)
      this.updateWidgetConfig()
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
    updateBaseMap({ removeBaseMapList, addBaseMapList, isShow }) {
      // 更新是否显示底图
      if (isShow !== this.isShow) {
        this.changeBaseMap(isShow)
        this.isShowChange(isShow)
      }
      let newBasemapList = JSON.parse(JSON.stringify(this.basemapNames))
      // 清空底图
      this.document.baseLayerMap.removeAll()

      // 移除已加载底图
      removeBaseMapList.forEach((basemap) => {
        if (newBasemapList.includes(basemap.guid)) {
          newBasemapList = newBasemapList.filter(
            (item) => item !== basemap.guid
          )
        }
      })

      // 添加新增的底图，不改变已加载的底图顺序
      addBaseMapList.forEach((item) => {
        if (!newBasemapList.includes(item.guid)) {
          newBasemapList.push(item.guid)
        }
      })

      this.basemapNames = newBasemapList
      this.basemapNamesCopy = newBasemapList
      // 添加底图
      this.basemapNames.forEach((guid) => {
        this.renderMaps(guid)
      })

      setTimeout(() => {
        this.updateCurrentBaseMapConfig()
      }, 1000)
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
