<template>
  <div ref="mapDataV" class="mp-widget-map-data-v">
    <iframe
      v-if="url"
      :src="url"
      frameborder="0"
      width="100%"
      height="100%"
    ></iframe>
    <div class="empty-box" v-else><mapgis-ui-empty /></div>
  </div>
</template>

<script lang="ts">
import { WidgetMixin, DomUtil } from '@mapgis/web-app-framework'

export default {
  name: 'MpMapDataV',
  mixins: [WidgetMixin],

  computed: {
    url() {
      return this.widgetInfo.config.url
    },
  },

  methods: {
    onActive() {
      const el = this.$refs.mapDataV
      if (!DomUtil.inFullScreen(el)) {
        this.$message.warn('对不起，您的浏览器不支持全屏模式')
      }
    },
  },
}
</script>

<style lang="less" scoped>
.mp-widget-map-data-v {
  width: 100%;
  height: 100%;
  .empty-box {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
