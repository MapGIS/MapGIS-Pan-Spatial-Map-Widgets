<template>
  <mapgis-3d-analysis-contour
    id="contour-analysis"
    :contourSpacing="contourSpacing"
    :contourWidth="contourWidth"
    :contourColor="contourColor"
    @load="load"
  />
</template>
<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpContourAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      contourSpacing: 150,
      contourWidth: 2,
      contourColor: 'rgb(255,0,0)',
      contourAnalysis: null,
    }
  },

  methods: {
    load(contourAnalysis) {
      this.contourAnalysis = contourAnalysis
    },

    onActive() {
      this.contourAnalysis.mount()
    },

    // 微件失活时
    onDeActive() {
      this.contourAnalysis.unmount()
    },

    // 微件窗口模式切换时回调
    onWindowSize(mode) {
      this.isFullScreen = mode === 'max'
      this.$nextTick(() => {
        const el = document.getElementById('contour-analysis')
        if (el) {
          el.style.width = `${mode === 'max' ? this.$el.clientWidth : 300}px`
        }
      })
    },
  },
}
</script>
<style lang="less">
#contour-analysis {
  width: 300px;
  max-width: 100%;
}
</style>
