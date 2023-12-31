<template>
  <div>
    <mapgis-3d-stratified-household
      v-if="show"
      ref="stratifiedHousehold"
      @loaded="load"
      @project-screen="handleProjectScreen"
      @change-layer="handleChangeLayer"
      @show-relationship-graph="showRelationshipGraph"
      :outStyle="outStyle"
      :layers="layers"
      :enablePopup="true"
      :enableCollapse="false"
      :enableStratifiedHouse="true"
      :getProjectorStatus="getProjectorStatus"
      :layerHighlightColorProp="layerHighlightColor"
      :featureHighlightColorProp="featureHighlightColor"
      :dataStoreIp="dataStoreIp"
      :dataStorePort="dataStorePort"
      :dataStoreDataset="dataStoreDataset"
      :dataStoreStep="dataStoreStep"
    ></mapgis-3d-stratified-household>
    <!-- 关系图谱 -->
    <mp-window-wrapper :visible="relationshipGraphShow">
      <mp-window
        class="relationship-graph-wrapper"
        ref="relationshipGraphWindow"
        @window-size="onResize"
        @update:visible="closeRelationshipGraph"
        :visible.sync="relationshipGraphShow"
        :min-width="1000"
        :mix-height="720"
        :has-padding="relationshipWindowPadding"
        anchor="bottom-center"
        title="关系图谱"
      >
        <div v-if="relationshipGraphShow">
          <mapgis-3d-relationship-graph
            ref="mapgisRelationshipGraph"
            :info="relationshipInfo"
            :relationshipConfig="relationshipConfig"
            :getProjectorStatus="getProjectorStatus"
            @floor-highlight="floorHighlight"
            @house-highlight="houseHighlight"
            @change-floor="changeFloor"
            @project-screen="handleProjectScreen"
          />
        </div>
      </mp-window>
    </mp-window-wrapper>
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  LayerType,
  LoadStatus,
  ProjectorManager,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpStratifiedHousehold',
  mixins: [WidgetMixin],
  data() {
    return {
      relationshipGraphShow: false,

      relationshipGraphLoad: false,

      relationshipInfo: undefined,

      relationshipWindowPadding: false,

      outStyle: {
        position: 'absolute',
        // position: 'relative',
        zIndex: 1000,
        padding: '0px',
        margin: '0px',
        height: '450px',
        width: '296px',
        top: '0px',
        left: '0px',
      },

      layers: [],

      show: true,

      layerId: '',

      layerTitle: '',
    }
  },
  computed: {
    // 颜色配置
    featureHighlightColor() {
      return baseConfigInstance.config.colorConfig.feature.reg.color
    },
    layerHighlightColor() {
      let color = 'rgba(255,0,0,0.5)'
      if (
        this.widgetInfo.config &&
        this.widgetInfo.config.layerHighlightcolor
      ) {
        color = this.widgetInfo.config.layerHighlightcolor
      }
      return color
    },

    dataStoreIp() {
      return baseConfigInstance.config.DataStoreIp
    },

    dataStorePort() {
      return baseConfigInstance.config.DataStorePort
    },

    dataStoreDataset() {
      return baseConfigInstance.config.DataStoreRelationDataset
    },

    dataStoreStep() {
      return baseConfigInstance.config.DataStoreStep
    },

    relationshipConfig() {
      return this.widgetInfo.config
    },
  },
  watch: {
    /**
     * 动态获取基础目录树上已勾选的三维模型数据
     */
    document: {
      immediate: true,
      deep: true,
      handler() {
        if (!this.document) return
        const layers = []
        this.document.defaultMap
          .clone()
          .getFlatLayers()
          .forEach((layer, index) => {
            const { id, type, title } = layer
            // if (layer.loadStatus === LoadStatus.loaded) {
            if (type === LayerType.IGSScene) {
              // if (layer.activeScene) {
              let isHousehold
              if (layer.title.indexOf('G3D') >= 0) {
                isHousehold = true
              } else {
                isHousehold = false
              }
              // 剖切分析暂时只支持模型
              layers.push({
                title: title,
                vueIndex: id,
                isHousehold,
              })
              // }
            }
            // }
          })
        this.layers = layers
      },
    },
  },
  methods: {
    /**
     * 微件打开时
     */
    onOpen() {
      this.show = true
    },

    /**
     * 微件关闭时
     */
    onClose() {
      this.show = false
    },

    load(payload) {
      const { component } = payload
      this.component = component
    },

    handleChangeLayer(layer) {
      const { title, vueIndex } = layer
      this.layerId = vueIndex
      this.layerTitle = title
    },

    handleProjectScreen(file) {
      if (!this.getProjectorStatus(file.name)) {
        const { layerId, layerTitle } = this
        const {
          vFOV,
          orientationHeading,
          orientationRoll,
          positionX,
          positionY,
          positionZ,
          hFOV,
          orientationPitch,
        } = file
        const cameraPosition = {
          x: positionX,
          y: positionY,
          z: positionZ,
        }
        const Orientation = {
          heading: orientationHeading,
          pitch: orientationPitch,
          roll: orientationRoll,
        }

        ProjectorManager.addProjector(
          layerId, // this.exhibition.id,
          layerTitle, // this.exhibition.name,
          file.name,
          file.url,
          'video',
          file.type,
          file.url,
          '',
          '',
          true,
          cameraPosition,
          Orientation,
          hFOV,
          vFOV
        )
        this.setProjectorStatus(file.name, true)
      } else {
        this.setProjectorStatus(file.name)
      }
    },

    getProjectorStatus(projectorId) {
      const { layerId, layerTitle } = this
      return ProjectorManager.getProjectorStatus(projectorId, layerId)
    },

    setProjectorStatus(projectorId, isProjected = false) {
      const { layerId, layerTitle } = this
      return ProjectorManager.setProjectorStatus(
        projectorId,
        layerId,
        isProjected
      )
    },

    showRelationshipGraph(info) {
      this.$nextTick(() => {
        this.relationshipInfo = info
        // 重新渲染
        if (this.relationshipGraphShow) {
          this.$refs.mapgisRelationshipGraph.init()
        } else {
          this.relationshipGraphShow = true
        }

        // 还原
        // !info.isFloor && this.$refs.stratifiedHousehold.restoreOrigindVisible()
        // this.$refs.stratifiedHousehold.resizeGraph().then(() => {
        //   if (info.isFloor) {
        //     this.$refs.stratifiedHousehold.restoreFloor().then(() => {
        //       this.$refs.stratifiedHousehold.lockFloor(info.layerIndex)
        //     })
        //   } else {
        //     this.$refs.stratifiedHousehold.restoreFloor()
        //   }
        // })
        // 如果是楼层则展示当前层,楼栋则还原
        if (info.isFloor) {
          if (this.$refs.stratifiedHousehold.prevFloorId) {
            this.$refs.stratifiedHousehold.resizeGraph().then(() => {
              this.$refs.stratifiedHousehold.lockFloor(info.layerIndex)
            })
          } else {
            this.$refs.stratifiedHousehold.lockFloor(info.layerIndex)
          }
        } else {
          this.$refs.stratifiedHousehold.restoreOrigindVisible()
          this.$refs.stratifiedHousehold.resizeGraph().then(() => {
            this.$refs.stratifiedHousehold.restoreFloor()
          })
        }
      })
    },

    floorHighlight(data) {
      this.$nextTick(() => {
        this.$refs.stratifiedHousehold.floorHighlight(data)
      })
    },

    houseHighlight(data) {
      this.$nextTick(() => {
        this.$refs.stratifiedHousehold.houseHighlight(data)
      })
    },

    closeRelationshipGraph() {
      this.$nextTick(() => {
        this.$refs.stratifiedHousehold.resizeGraph().then(() => {
          this.$refs.stratifiedHousehold.restoreFloor()
        })
        // 窗口退出全屏
        this.$refs.relationshipGraphWindow.fullScreen = false
      })
    },

    onResize() {
      this.$nextTick(() => {
        this.$refs.mapgisRelationshipGraph.resizeGraph()
      })
    },

    changeFloor(data) {
      this.$nextTick(() => {
        this.$refs.stratifiedHousehold.changeFloor(data)
      })
    },
  },
}
</script>

<style lang="less" scoped>
.mapgis-3d-stratified-household-wrapper {
  height: 450px;
  // width: 260px;
}
</style>
<style lang="less">
.relationship-graph-wrapper {
  background-color: rgba(20, 20, 20, 0.4) !important;
  // left: 45% !important;
}
</style>
