<template>
  <mapgis-3d-analysis-aspect
    id="aspect-analysis"
    :rampColors="rampColors"
    @load="load"
  />
</template>
<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpAspectAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      rampColors: [
        { min: 0, max: 60, color: 'rgba(244, 67, 54, 0.5)' },
        { min: 60, max: 120, color: 'rgba(233, 30, 99, 0.5)' },
        { min: 120, max: 180, color: 'rgba(156, 39, 176, 0.5)' },
        { min: 180, max: 240, color: 'rgba(255, 235, 59, 0.5)' },
        { min: 240, max: 300, color: 'rgba(96, 125, 139, 0.5)' },
        { min: 300, max: 360, color: 'rgba(76, 175, 80, 0.5)' },
      ],
      aspectAnalysis: null,
    }
  },

  methods: {
    load(aspectAnalysis) {
      this.aspectAnalysis = aspectAnalysis
    },

    onActive() {
      this.aspectAnalysis.mount()
    },

    // 微件失活时
    onDeActive() {
      this.aspectAnalysis.unmount()
    },

    // 微件窗口模式切换时回调
    onWindowSize(mode) {
      this.isFullScreen = mode === 'max'
      this.$nextTick(() => {
        const el = document.getElementById('aspect-analysis')
        if (el) {
          el.style.width = `${mode === 'max' ? this.$el.clientWidth : 300}px`
        }
      })
    },
  },
}
</script>
<style lang="less">
#aspect-analysis {
  width: 300px;
  max-width: 100%;
}
</style>
