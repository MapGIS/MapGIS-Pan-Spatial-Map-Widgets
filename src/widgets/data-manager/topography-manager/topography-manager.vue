<template>
  <div class="mp-widget-topography-manager">
    <mapgis-ui-switch-row-left
      title="显示地形"
      v-model="isShow"
      @change="isShowChange"
    />
    <div class="topography-wrapper">
      <mp-basemap-item
        v-for="basemap in basemaps"
        :key="basemap.name"
        :name="basemap.name"
        :guid="basemap.guid"
        :image="imageUrl(basemap.image)"
        :active="basemapNames.includes(basemap.guid)"
        :icon="icon"
        @select="onSelect"
        @un-select="onUnSelect"
      >
      </mp-basemap-item>
    </div>
  </div>
</template>

<script lang="ts">
import { api } from '@mapgis/web-app-framework'
import basemapManagerMixins from '../components/mixins/basemap-manager-mixin.ts'

export default {
  name: 'MpTopographyManager',
  mixins: [basemapManagerMixins],
  computed: {
    basemaps() {
      const topographyMapList = this.widgetInfo.config.topographyMapList

      // 将配置转换成可用于添加到map中的配置
      const maps = this.mapDataTransfromation(topographyMapList, false)
      return maps
    },
  },
  data() {
    return {
      icon: '<svg t="1607415205240" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6802" width="200" height="200"><path d="M139.1 830H886v-41.5H139.1V830z m145.2-368.5l209.1 244h60.7L403.8 529.6l260.9-322 209.8 497.9h53.1L679.3 111 370 490.1l-99.5-116.4-173 331.8h60.6l126.2-244z m590.3 244.2H261.1l0.1-0.1H158l0.1-0.1H97.6V747h829.9v-41.5h-53l0.1 0.2zM180.6 913h663.9v-41.5H180.6V913z" p-id="6803"></path></svg>',
    }
  },
  mounted() {
    // 配置文件无isShow属性时默认设置为true
    const { isShow = true } = { ...this.widgetInfo.config }
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
      for (let i = 0; i < this.defaultSelect.length; i++) {
        this.onSelect(this.defaultSelect[i].name)
      }
    }
  },
  methods: {
    onSelect(guid, isZoomTo = false) {
      if (!this.isShow) return
      // 清空底图
      this.clearBasemap()
      this.basemapNames.push(guid)
      this.renderMaps(guid, isZoomTo)
    },
    getSaveConfig() {
      const topographyMapList = this.transfromationMapData()
      const isShow = this.isShow
      const config = {
        topographyMapList,
        isShow,
      }
      return config
    },
    saveConfig() {
      const config = this.getSaveConfig(this.basemaps)
      console.log(config, 'config')
      api
        .saveWidgetConfig({
          name: 'topography-manager',
          config: JSON.stringify(config),
        })
        .then(() => {
          console.log('更新地形配置成功')
        })
        .catch(() => {
          console.log('更新地形配置失败')
        })
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-topography-manager {
  .topography-wrapper {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
