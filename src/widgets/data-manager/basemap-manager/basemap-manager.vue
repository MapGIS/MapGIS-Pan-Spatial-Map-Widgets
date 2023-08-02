<template>
  <div class="mp-widget-basemap-manager">
    <mapgis-ui-switch-row-left
      title="显示底图"
      v-model="isShow"
      @change="isShowChange"
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
} from '@mapgis/web-app-framework'
import basemapManagerMixins from '../components/mixins/basemap-manager-mixin.ts'

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
    const { indexBaseMapGUID, isShow = true } = { ...this.widgetInfo.config }
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
      // BaseMapController.initBaseMapInfo = { isShow }
      return
    }
    // 记录初始化底图信息
    let initBaseMap = { isShow, indexBaseMapGUID }
    const selectBaseMap = this.defaultSelect.map((item) => item.guid)
    initBaseMap = { ...initBaseMap, selectBaseMap }
    // 加载显示配置里已设置默认选中的底图
    if (this.defaultSelect && this.defaultSelect.length > 0) {
      for (let i = 0; i < this.defaultSelect.length; i++) {
        let isZoomTo = false
        let init // 判断是否为初始化加载
        if (
          // 以默认范围为初始范围
          initPositionMode === 'initExtent'
        ) {
          const { xmin, ymin, xmax, ymax } = baseConfigInstance.config
          this.map.fitBounds([
            [xmin, ymin],
            [xmax, ymax],
          ])
          this.viewer.camera.flyTo({
            destination: this.Cesium.Rectangle.fromDegrees(
              xmin,
              ymin,
              xmax,
              ymax
            ),
          })
        } else if (
          // 以默认中心点为初始范围
          initPositionMode === 'initPosition'
        ) {
          const {
            center,
            initZoom: zoom,
            initAltitude,
          } = baseConfigInstance.config
          this.map.flyTo({
            center: [center.split(',')[0], center.split(',')[1]],
            zoom,
          })
          this.viewer.camera.flyTo({
            destination: this.Cesium.Cartesian3.fromDegrees(
              center.split(',')[0],
              center.split(',')[1],
              initAltitude
            ),
          })
        } else {
          // 以索引底图的范围为初始范围
          if (this.defaultSelect[i].guid == indexBaseMapGUID) {
            isZoomTo = true
            init = true
          }
        }
        this.onSelect(this.defaultSelect[i].guid, isZoomTo, init)
      }
    }
  },
  methods: {
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
      this.basemapNames = [...onSelect]
      if (onSelect && onSelect.length > 0) {
        const promiseAll = []
        onSelect.forEach((item) => {
          promiseAll.push(
            zoomArr.includes(item)
              ? this.generateLayer(item, true)
              : this.generateLayer(item)
          )
        })
        Promise.all(promiseAll).then((result) => {
          // 调整图层顺序,忽略无法加载的图层
          result.forEach((item) => {
            item && this.document.baseLayerMap.add(item)
          })
        })
      }
    },
    generateLayer(guid, isZoomTo = false) {
      return new Promise((resolve, reject) => {
        const basemap = this.basemaps.find((item) => item.guid === guid)
        if (basemap) {
          basemap.children.forEach(async (layer) => {
            const mapLayer = DataCatalogManager.generateLayerByConfig(layer)
            mapLayer.description = layer.description
            if (mapLayer.loadStatus === LoadStatus.notLoaded) {
              await mapLayer.load()
              // this.document.baseLayerMap.add(mapLayer)
              // 正常来说收藏夹不会走此逻辑
              if (isZoomTo) {
                if (this.is3DLayer(mapLayer)) {
                  setTimeout(() => {
                    this.fitBounds(mapLayer, false)
                  }, 500)
                } else {
                  this.fitBounds(mapLayer, false)
                }
              }
            }
            resolve(mapLayer)
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
      this.renderMaps(guid, isZoomTo, init)
    },
    // 通过点击底图进行勾选使用onCheck方法，用于区分是否为点击底图进行勾选
    onCheck(guid, isZoomTo = false, init = false) {
      if (!this.isShow) return
      if (this.widgetInfo.config.isSingleMode) {
        this.clearBasemap()
      }
      this.basemapNames.push(guid)
      const config = this.baseMapConfig()
      const onSelect = this.basemapNames.map((item) => item)
      const unSelect = this.basemaps
        .filter((item) => !onSelect.includes(item.guid))
        .map((item) => item.guid)
      config.onSelect = onSelect
      config.unSelect = unSelect
      this.baseMapController.currentBaseMapInfo = config
      this.renderMaps(guid, isZoomTo, init)
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
      const config = this.getSaveConfig(this.basemaps)
      console.log(config, 'config')
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
