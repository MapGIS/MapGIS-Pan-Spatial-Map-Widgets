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
import { Component, Mixins } from 'vue-property-decorator'
import { WidgetMixin } from '@mapgis/web-app-framework'

@Component({
  name: 'MpCutFillAnalysis',
  components: {},
})
export default class MpCutFillAnalysis extends Mixins(WidgetMixin) {
  private xPaneNum = 16

  private yPaneNum = 16

  private height = 2000

  private cutColor = 'rgba(0, 0, 255, 0.5)'

  private fillColor = 'rgba(255,165,0,0.5)'

  private dataType = 2.0

  private cutFillAnalysis = null

  load(cutFillAnalysis) {
    this.cutFillAnalysis = cutFillAnalysis
  }

  onActive() {
    this.cutFillAnalysis.mount()
  }

  // 微件失活时
  onDeActive() {
    this.cutFillAnalysis.unmount()
  }
}
</script>
