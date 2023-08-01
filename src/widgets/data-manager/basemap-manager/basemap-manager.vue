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
        @select="onSelect"
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
} from '@mapgis/web-app-framework'
import basemapManagerMixins from '../components/mixins/basemap-manager-mixin.ts'

export default {
  name: 'MpBasemapManager',
  mixins: [basemapManagerMixins],
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
  },

  mounted() {
    // 配置文件无isShow属性时默认设置为true
    const { indexBaseMapGUID, isShow = true } = { ...this.widgetInfo.config }
    const { initPositionMode } = baseConfigInstance.config
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
    onSelect(guid, isZoomTo = false, init = false) {
      if (!this.isShow) return
      if (this.widgetInfo.config.isSingleMode) {
        this.clearBasemap()
      }
      this.basemapNames.push(guid)
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
