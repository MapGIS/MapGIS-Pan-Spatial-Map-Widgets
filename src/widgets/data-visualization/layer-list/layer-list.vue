<template>
  <div class="layer-list-router-container">
    <div id="layerListEl">
      <mp-widget-routers :mode="mode" :widgetRouters.sync="widgetRouters" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  AppMixin,
  api,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import { Empty } from 'ant-design-vue'

export default {
  name: 'MpLayerList',
  mixins: [WidgetMixin, AppMixin],
  data() {
    return {
      widgetRouters: [],
      mode: 'normal',
    }
  },

  created() {
    console.log(this.widgetInfo)

    this.widgetRouters = [
      {
        title: '图层树',
        component: 'MpLayerListContainer',
        props: {
          widgetInfo: this.widgetInfo,
        },
      },
    ]
  },

  /**
   * 视图窗口变化
   */
  // private onWindowSize(mode: 'max' | 'normal') {
  //   this.$nextTick(() => {
  //     this.mode = mode
  //     const layerListEl = document.getElementById('layerListEl')
  //     console.log(mode)
  //     if (layerListEl) {
  //       layerListEl.style.width = `${
  //         mode === 'max' ? this.$el.clientWidth : 300
  //       }px`
  //     }
  //   })
  // }
}
</script>

<style lang="less" scoped></style>
