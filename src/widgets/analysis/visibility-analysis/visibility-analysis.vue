<template>
  <mapgis-3d-sightline
    :exHeight="exHeight"
    :visibleColor="visibleColor"
    :unVisibleColor="unVisibleColor"
    @load="load"
  >
  </mapgis-3d-sightline>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpVisibilityAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      // 附加高度(米)
      exHeight: 1.85,
      // 可视区域颜色
      visibleColor: '#008000',
      // 不可视区域颜色
      unVisibleColor: '#ff0000',
      // 通视分析对象
      visibilityAnalysis: null,
    }
  },

  methods: {
    onClose() {
      this.visibilityAnalysis.unmount()
    },

    load(visibilityAnalysis) {
      this.visibilityAnalysis = visibilityAnalysis
    },
  },
}
</script>

<style lang="less" scoped></style>
