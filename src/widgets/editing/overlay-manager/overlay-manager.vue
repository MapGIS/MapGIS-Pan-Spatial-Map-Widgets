<template>
  <div style="max-height: 530px">
    <mapgis-3d-graphic-layer
      :models="models"
      :dataSource="dataSource"
      :uploadUrl="uploadUrl"
      :featureConfig="featureConfig"
      @save="save"
      ref="graphicLayer"
    />
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  api,
  eventBus,
  events,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpOverlayManager',
  mixins: [WidgetMixin],

  data() {
    return {
      dataSource: [],
      models: {},
      firstOpen: true,
    }
  },

  computed: {
    uploadUrl() {
      return `${this.baseUrl}/psmap/rest/services/system/ResourceServer/files/pictures`
    },
    featureConfig() {
      return baseConfigInstance.config.colorConfig
    },
  },

  async mounted() {
    let config = await api.getWidgetConfig('overlay-manager')
    if (!config) {
      config = {}
    }
    const { models } = config
    if (models) {
      this.models = config.models
      const vm = this
      Object.keys(vm.models).forEach(function (key) {
        for (let i = 0; i < vm.models[key].length; i++) {
          vm.models[key][i].img = vm.baseUrl + vm.models[key][i].img
          vm.models[key][i].model = vm.baseUrl + vm.models[key][i].model
        }
      })
    }
  },

  methods: {
    async onOpen() {
      if (this.firstOpen) {
        let config = await api.getWidgetConfig('overlay-manager')
        if (!config) {
          config = {}
        }
        const { dataSource } = config
        if (dataSource) {
          const dataSource = config.dataSource
          for (let i = 0; i < dataSource.length; i++) {
            const features = dataSource[i]
            for (let j = 0; j < features.length; j++) {
              const { style } = features[j]
              const { url } = style
              if (url) {
                features[j].style.url = this.baseUrl + url
              }
            }
          }
        }
        this.firstOpen = false
        this.dataSource = dataSource
      } else {
        this.$refs.graphicLayer.$_showCurrentGraphic()
      }
    },

    onClose() {
      // this.$refs.graphicLayer.$_hideAllGraphic()
      this.$refs.graphicLayer.$_stopDrawAll()
    },

    async save(e) {
      let config = await api.getWidgetConfig('overlay-manager')
      if (!config) {
        config = {}
      }
      config.dataSource = e
      api.saveWidgetConfig({
        name: 'overlay-manager',
        config: JSON.stringify(config),
      })
    },
  },
}
</script>

<style lang="less" scoped></style>
