<template>
  <mapgis-3d-viewpoint-manager
    @loaded="loaded"
    @change="configSave"
    :viewpoint-config="iconfig"
  ></mapgis-3d-viewpoint-manager>
</template>

<script lang="ts">
import { WidgetMixin, api } from '@mapgis/web-app-framework'

export default {
  name: 'MpViewpointManager',
  mixins: [WidgetMixin],

  data() {
    return {}
  },

  computed: {
    iconfig() {
      return this.widget.config
    },
  },

  // async mounted() {
  //   let config = await api.getWidgetConfig('viewpoint-manager')
  //   if (!config || !(config instanceof Array)) {
  //     config = []
  //   }

  //   const result = config.map((item) => {
  //     return {
  //       name: item.name,
  //       image:
  //         item.image.substr(0, 8) == '/upload/'
  //           ? `${this.baseUrl}${item.image}`
  //           : item.image,
  //       destination: item.destination,
  //       orientation: item.orientation,
  //       duration: item.duration,
  //     }
  //   })

  //   this.iconfig = result
  // },

  methods: {
    configSave(newConfig) {
      // console.log("newConfig",JSON.parse(JSON.stringify(newConfig)));

      api.saveWidgetConfig({
        name: 'viewpoint-manager',
        config: JSON.stringify(newConfig),
      })
    },

    /**
     * 微件打开时
     */
    onOpen() {
      this.viewpoint.mount()
    },

    /**
     * 微件关闭时
     */
    onClose() {
      this.viewpoint.unmount()
    },

    loaded(viewpoint) {
      this.viewpoint = viewpoint
    },
  },
}
</script>

<style lang="less" scoped></style>
