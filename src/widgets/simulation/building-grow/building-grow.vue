<template>
  <div class="mp-widget-building-grow">
    <mapgis-ui-row>
      <!-- <label class='mp-widget-label'>选择m3d图层</label> -->
      <mapgis-ui-group-tab title="选择m3d图层" :hasBottomMargin="false" />
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-select
        :default-value="selectDefaultVal"
        @change="onLayerChange"
        style="width: 100%"
      >
        <mapgis-ui-select-option
          v-for="m3dLayer in m3dLayers"
          :key="m3dLayer.vueIndex"
          :value="m3dLayer.vueIndex"
          :title="m3dLayer.title"
          >{{ m3dLayer.title }}</mapgis-ui-select-option
        >
      </mapgis-ui-select>
    </mapgis-ui-row>
    <mp-window-wrapper :visible="startBuildingGrow">
      <template v-slot:default="slotProps">
        <mp-window
          title="单体建筑生长"
          :visible.sync="startBuildingGrow"
          :horizontal-offset="28"
          :vertical-offset="30"
          :width="playWidth"
          :height="114"
          :has-padding="false"
          anchor="bottom-center"
          v-bind="slotProps"
        >
          <template>
            <mapgis-3d-building-grow
              v-if="startBuildingGrow"
              :vueIndex="vueIndex"
              :enableSteps="false"
              :steps="steps"
              @loaded="loaded"
            />
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>
    <mapgis-ui-setting-footer>
      <mapgis-ui-button type="primary" @click="startGrow"
        >开始生长
      </mapgis-ui-button>
      <mapgis-ui-button @click="deleteBuildingGrow">清除</mapgis-ui-button>
      <!--      <mapgis-ui-button @click="deleteCityGrow">消除城市生长</mapgis-ui-button>-->
    </mapgis-ui-setting-footer>
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  LayerType,
  IGSSceneSublayerRenderType,
  LoadStatus,
  ModelCacheFormat,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpBuildingGrow',
  mixins: [WidgetMixin],

  data() {
    return {
      m3dLayers: [],
      startBuildingGrow: false,
      playWidth: 500,
      vueIndex: undefined,
      steps: 2,
      selectDefaultVal: undefined,
      // 建筑生长对象
      buildingGrow: null,
    }
  },

  watch: {
    document: {
      immediate: true,
      deep: true,
      handler: 'getScenes',
    },
  },

  methods: {
    /**
     * 动态获取基础目录树上已勾选的三维模型数据
     */
    getScenes() {
      if (!this.document) return
      const m3dLayers = []
      this.document.defaultMap
        .clone()
        .getFlatLayers()
        .forEach((layer, index) => {
          if (layer.loadStatus === LoadStatus.loaded) {
            if (layer.type === LayerType.ModelCache) {
              if (layer.format === ModelCacheFormat.m3d) {
                this.vueIndex = layer.id
                // 剖切分析暂时只支持模型
                m3dLayers.push({
                  title: layer.title,
                  vueIndex: this.vueIndex,
                })
              }
            }
          }
        })
      this.m3dLayers = m3dLayers
      const m3dLength = m3dLayers.length
      this.selectDefaultVal = m3dLayers[m3dLength - 1]
    },

    onLayerChange(value: string) {
      this.deleteBuildingGrow()
      const { viewer, vueKey, vueCesium } = this
      const find = vueCesium.M3DIgsManager.findSource(vueKey, value)
      const m3ds = find.source
      const m3d = m3ds && m3ds.length > 0 ? m3ds[0] : undefined
      viewer.camera.flyToBoundingSphere(m3d.boundingSphere)
      this.vueIndex = value
    },

    startGrow() {
      this.startBuildingGrow = true
    },

    deleteBuildingGrow() {
      this.hideBuildingGrow()
      if (this.buildingGrow) {
        this.buildingGrow.unmount()
      }
    },

    loaded(e) {
      this.buildingGrow = e.component
    },

    onClose() {
      this.hideBuildingGrow()
      if (this.buildingGrow) {
        this.buildingGrow.unmount()
      }
    },

    hideBuildingGrow() {
      this.startBuildingGrow = false
    },
  },
}
</script>

<style scoped>
.mp-widget-label {
  width: 41px;
  height: 12px;
  font-size: 14px;
  font-family: Microsoft YaHei;
  font-weight: bold;
  line-height: 36px;
}
</style>
