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
import { WidgetMixin, api, baseConfigInstance } from '@mapgis/web-app-framework'

export default {
  name: 'MpSceneRoaming',
  mixins: [WidgetMixin],
  provide() {
    const self = this
    return {
      get ip() {
        return self.ip
      },
      get port() {
        return self.port
      },
    }
  },
  data() {
    return {
      setting: {
        speed: 10,
        elevationType: 'addition',
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
      sceneRoaming: null,
      ip: baseConfigInstance.config.ip,
      port: baseConfigInstance.config.port,
    }
  },
  computed: {
    paths() {
      return this.widgetInfo.config
    },
    models() {
      return [
        {
          label: '人',
          value: `${this.application.publicPath}CesiumModels/Cesium_Man.glb`,
        },
        {
          label: '卡车',
          value: `${this.application.publicPath}CesiumModels/CesiumMilkTruck.glb`,
        },
        {
          label: '飞机',
          value: `${this.application.publicPath}CesiumModels/Cesium_Air.gltf`,
        },
        {
          label: '无',
          value: '',
        },
      ]
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
      // this.sceneRoaming.unmount()
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
