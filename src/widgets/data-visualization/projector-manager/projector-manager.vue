<template>
  <mapgis-3d-projector-manager
    class="projector-manager"
    :projectorOverlayLayerList="projectorOverlayLayerList"
    :modelUrl="modelUrl"
    :modelOffset="modelOffset"
    :currentLayerId="currentLayerId"
    :currentProjectorId="currentProjectorId"
    :maxProjected="maxProjected"
    :hideVPInvisible="hideVPInvisible"
    :disabledImageUrlInput="true"
    @load="load"
    @update-projectorOverlayLayerList="updateProjectorOverlayLayerList"
  >
    <template slot="imgUpload" slot-scope="{ click }">
      <mapgis-ui-upload-image
        :uploadUrl="`${baseUrl}/${appProductName}/rest/services/system/ResourceServer/files/pictures`"
        :showUploadList="false"
        :click="click"
      ></mapgis-ui-upload-image>
    </template>
  </mapgis-3d-projector-manager>
</template>

<script lang="ts">
import { WidgetMixin, api, ProjectorManager } from '@mapgis/web-app-framework'

export default {
  name: 'MpProjectorManager',
  mixins: [WidgetMixin],

  data() {
    return {
      modelOffset: { headingOffset: -90, pitchOffset: 0, rollOffset: 0 },
      ProjectorManagerInstance: ProjectorManager,
      maxProjected: 10,
      hideVPInvisible: false,
      config: {},
    }
  },

  computed: {
    modelUrl() {
      return `${this.application.publicPath}CesiumModels/Cesium_Camera.glb`
    },
    projectorOverlayLayerList: {
      get() {
        const projectorOverlayLayerList =
          this.ProjectorManagerInstance.getProjectorOverlayLayerList()
        return projectorOverlayLayerList
      },
      set(projectorOverlayLayerList) {
        this.ProjectorManagerInstance.setProjectorOverlayLayerList(
          projectorOverlayLayerList
        )
      },
    },
    currentLayerId() {
      const layerId = this.ProjectorManagerInstance.getCurrentLayerId()
      return layerId
    },
    currentProjectorId() {
      const projectorId = this.ProjectorManagerInstance.getCurrentProjectorId()
      return projectorId
    },
  },

  mounted() {
    this.onWidgetConfigChange(this.widgetInfo.config, undefined)
  },

  methods: {
    // 监听config变化
    onWidgetConfigChange(newValue, oldValue) {
      const { projectorOverlayLayerList, maxProjected, hideVPInvisible } =
        newValue
      this.onProjectorOverlayLayerListChange(projectorOverlayLayerList)
      this.onMaxProjectedChange(maxProjected)
      this.onHideVPInvisibleChange(hideVPInvisible)
      // 添加对widegt.config.projectorOverlayLayerList的监听
      if (
        projectorOverlayLayerList &&
        !this.projectorOverlayLayerListWatchAdded
      ) {
        // 接口内部会过滤重复添加的监听
        this.addWidgetConfigPropertiesWatchEvent(
          'projectorOverlayLayerList',
          this.onProjectorOverlayLayerListChange
        )
        // 标识已添加监听事件
        this.projectorOverlayLayerListWatchAdded = true
      }
      // 添加对widegt.config.maxProjected的监听
      if (maxProjected !== undefined && !this.maxProjectedWatchAdded) {
        // 接口内部会过滤重复添加的监听
        this.addWidgetConfigPropertiesWatchEvent(
          'maxProjected',
          this.onMaxProjectedChange
        )
        // 标识已添加监听事件
        this.maxProjectedWatchAdded = true
      }
      // 添加对widegt.config.hideVPInvisible的监听
      if (hideVPInvisible !== undefined && !this.hideVPInvisibleWatchAdded) {
        // 接口内部会过滤重复添加的监听
        this.addWidgetConfigPropertiesWatchEvent(
          'hideVPInvisible',
          this.onHideVPInvisibleChange
        )
        // 标识已添加监听事件
        this.hideVPInvisibleWatchAdded = true
      }
    },
    // 投放列表变化
    onProjectorOverlayLayerListChange(val) {
      this.projectorOverlayLayerList = val || []
    },
    // 最大可投放数变化
    onMaxProjectedChange(val) {
      this.maxProjected = val || 10
    },
    // 是否显示视锥线设置变化
    onHideVPInvisibleChange(val) {
      this.hideVPInvisible = val || false
    },

    load(projectorComponent) {
      this.projectorComponent = projectorComponent
    },

    onActive() {
      this.projectorComponent.mount()
    },

    // 微件失活时
    onDeActive() {
      // 微件失活时自动保存配置到后台
      this.saveConfig()
      this.projectorComponent.unmount()
    },

    // 微件关闭时
    onClose() {
      // 微件失活时自动保存配置到后台
      this.saveConfig()
      this.projectorComponent.unmount()
    },

    imgUpload(e) {},

    updateProjectorOverlayLayerList(layerList) {
      this.projectorOverlayLayerList = [...layerList]
      // 每次更新投影参数后，同步保存配置数据
      this.saveConfig()
    },

    saveConfig() {
      const config = {
        projectorOverlayLayerList: [...this.projectorOverlayLayerList],
      }
      if (this.designTime) {
        this.setWidgetData(JSON.parse(JSON.stringify(config)))
      } else if (this.previewTime) {
      } else {
        api
          .saveWidgetConfig({
            name: 'projector-manager',
            config: JSON.stringify(config),
          })
          .then(() => {
            // this.$message.success('更新projector配置成功')
            // console.log('更新projector配置成功')
          })
          .catch(() => {
            // this.$message.error('更新projector配置失败')
            // console.log('更新projector配置失败')
          })
      }
    },
  },
}
</script>
<style lang="less">
.projector-manager {
  width: 310px;
  max-width: 100%;
}
</style>
