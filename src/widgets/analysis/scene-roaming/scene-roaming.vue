<template>
  <mapgis-3d-scene-roaming
    :setting="setting"
    :models="models"
    :paths="paths"
    @load="load"
    @save-paths="onSaveConfig"
  />
</template>

<script lang="ts">
import { WidgetMixin, api } from '@mapgis/web-app-framework'

export default {
  name: 'MpSceneRoaming',
  mixins: [WidgetMixin],
  data() {
    return {
      setting: {
        speed: 10,
        exHeight: 1,
        heading: 90,
        pitch: 0,
        range: 1,
        animationType: 1,
        interpolationAlgorithm: 'LagrangePolynomialApproximation',
        isLoop: true,
        showPath: true,
        showInfo: true,
        modelUrl: '',
      },
      models: [
        {
          label: '人',
          value: `${process.env.VUE_APP_PUBLIC_PATH}CesiumModels/Cesium_Man.glb`,
        },
        {
          label: '卡车',
          value: `${process.env.VUE_APP_PUBLIC_PATH}CesiumModels/CesiumMilkTruck.glb`,
        },
        {
          label: '飞机',
          value: `${process.env.VUE_APP_PUBLIC_PATH}CesiumModels/Cesium_Air.gltf`,
        },
        {
          label: '无',
          value: '',
        },
      ],
      sceneRoaming: null,
    }
  },

  computed: {
    paths() {
      return this.widgetInfo.config
    },
  },

  methods: {
    load(sceneRoaming) {
      this.sceneRoaming = sceneRoaming
    },

    onActive() {
      this.sceneRoaming.mount()
    },

    // 微件关闭时
    onClose() {
      this.sceneRoaming.unmount()
    },

    // 微件失活时
    onDeActive() {
      this.sceneRoaming.unmount()
    },

    onSaveConfig(paths) {
      const this_ = this

      api
        .saveWidgetConfig({
          name: 'scene-roaming',
          config: JSON.stringify(paths),
        })
        .then(() => {
          this_.$message.success('保存成功')
        })
        .catch(() => {
          this_.$message.error('保存失败')
        })
    },
  },
}
</script>
