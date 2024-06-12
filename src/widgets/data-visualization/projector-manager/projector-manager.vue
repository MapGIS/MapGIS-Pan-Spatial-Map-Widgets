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
      projectorLayerList: [
        {
          id: '123-345-567-789',
          name: 'test',
          projectorList: [
            {
              id: '987-765-543-321',
              name: 'testProjector1',
              description: '',
              isProjected: false,
              params: {
                projectorType: 'video',
                imgUrl: '',
                videoSource: {
                  protocol: 'm3u8',
                  videoUrl:
                    'http://192.168.91.123:10008/record/video1/20211221/out.m3u8',
                },
                cameraPosition: {
                  x: 114.401228136856,
                  y: 30.467421377675457,
                  z: 84.94989410478892,
                },
                orientation: {
                  heading: 6.053866507322313,
                  pitch: -73.6,
                  roll: 354.1,
                },
                hFOV: 34.6,
                vFOV: 18.9,
                hintLineVisible: true,
              },
            },
          ],
        },
      ],
      ProjectorManagerInstance: ProjectorManager,
      maxProjected: 10,
      hideVPInvisible: false,
      config: {},
      projectorComponent: null,
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

  watch: {
    currentLayerId: {
      deep: true,
      immediate: true,
      handler: 'changeCurrentLayerId',
    },
    currentProjectorId: {
      deep: true,
      immediate: true,
      handler: 'changeCurrentProjectorId',
    },
    projectorOverlayLayerList: {
      deep: true,
      immediate: true,
      handler: 'changeProjectorOverlayLayerList',
    },
  },

  mounted() {
    this.projectorOverlayLayerList =
      (this.widgetInfo.config &&
        this.widgetInfo.config.projectorOverlayLayerList) ||
      this.projectorLayerList
    this.maxProjected =
      (this.widgetInfo.config && this.widgetInfo.config.maxProjected) || 10
    this.hideVPInvisible =
      (this.widgetInfo.config && this.widgetInfo.config.hideVPInvisible) ||
      false
  },

  methods: {
    changeCurrentLayerId() {},

    changeCurrentProjectorId() {},

    changeProjectorOverlayLayerList() {},

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
