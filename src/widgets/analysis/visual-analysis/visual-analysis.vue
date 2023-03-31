<template>
  <mapgis-3d-viewshed
    :horizontAngle="horizontAngle"
    :verticalAngle="verticalAngle"
    :unVisibleColor="unVisibleColor"
    :visibleColor="visibleColor"
    :maskColor="maskColor"
    :exHeight="exHeight"
    @load="load"
  ></mapgis-3d-viewshed>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpVisualAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      // 观察点的水平视角
      horizontAngle: 60,
      // 观察点的垂直视角
      verticalAngle: 60,
      // 非可视区域颜色
      unVisibleColor: '#ff0000',
      // 可视区域颜色
      visibleColor: '#00ff00',
      // 可视遮罩颜色
      maskColor: 'rgba(37, 218, 169, 0.2)',
      // 观察点的附加高度，单位为米
      exHeight: 1.85,
      // 可视域分析对象
      visualAnalysis: null,
    }
  },

  methods: {
    onOpen() {
      if (this.visualAnalysis) {
        this.visualAnalysis.mount()
      }
    },

    onClose() {
      this.visualAnalysis.unmount()
    },

    load(visualAnalysis) {
      this.visualAnalysis = visualAnalysis
    },
  },
}
</script>

<style lang="less" scoped></style>
