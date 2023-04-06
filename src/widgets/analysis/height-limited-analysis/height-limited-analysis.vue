<template>
  <mapgis-3d-heightlimited
    :color="color"
    :heightLimit="heightLimit"
    :maxSliderHeight="maxSliderHeight"
    :minSliderHeight="minSliderHeight"
    :drawStyle="drawStyle"
    @load="load"
  >
  </mapgis-3d-heightlimited>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpHeightLimitedAnalysis',
  mixins: [WidgetMixin],
  data() {
    return {
      color: 'rgba(255,140,0,0.6)',
      heightLimit: 80,
      maxSliderHeight: 180,
      minSliderHeight: 0,
      drawStyle: {
        color: '#FF0000',
        opacity: 0.6,
      },
      // 控高分析对象
      heightLimitedAnalysis: undefined,
    }
  },
  methods: {
    onActive() {
      this.heightLimitedAnalysis.mount()
    },

    /**
     * 打开模块
     */
    onOpen() {
      this.heightLimitedAnalysis.mount()
    },

    /**
     * 关闭模块
     */
    onClose() {
      this.heightLimitedAnalysis.unmount()
    },

    load(e) {
      this.heightLimitedAnalysis = e
    },
  },
}
</script>

<style lang="less" scoped></style>
