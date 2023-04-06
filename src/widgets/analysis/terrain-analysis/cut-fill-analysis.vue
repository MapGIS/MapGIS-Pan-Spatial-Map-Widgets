<template>
  <mapgis-3d-analysis-cut-fill
    :xPaneNum="xPaneNum"
    :yPaneNum="yPaneNum"
    :height="height"
    :cutColor="cutColor"
    :fillColor="fillColor"
    :dataType="dataType"
    @load="load"
  />
</template>
<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpCutFillAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      xPaneNum: 16,
      yPaneNum: 16,
      height: 2000,
      cutColor: 'rgba(0, 0, 255, 0.5)',
      fillColor: 'rgba(255,165,0,0.5)',
      dataType: 2.0,
      cutFillAnalysis: null,
    }
  },

  methods: {
    load(cutFillAnalysis) {
      this.cutFillAnalysis = cutFillAnalysis
    },

    onActive() {
      this.cutFillAnalysis.mount()
    },

    // 微件失活时
    onDeActive() {
      this.cutFillAnalysis.unmount()
    },
  },
}
</script>
