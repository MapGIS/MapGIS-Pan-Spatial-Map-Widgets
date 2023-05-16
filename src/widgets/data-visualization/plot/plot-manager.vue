<template>
  <div style="max-height: 530px" v-if="is2DMapMode">
    <mapgis-ui-row :gutter="8" class="plot-edit-toolbar">
      <mapgis-ui-col :span="12">
        <mapgis-ui-switch-panel
          v-if="showSymbol"
          label="启用图层编辑"
          @changeChecked="edit"
          :checked="true"
          :isTitleBold="true"
          :hasTopMargin="false"
          :hasBottomMargin="false"
          size="small"
        />
      </mapgis-ui-col>
      <mapgis-ui-col :span="12">
        <mapgis-ui-button @click="stopDrawing" class="plot-edit-btn">
          停止绘制
        </mapgis-ui-button>
      </mapgis-ui-col>
    </mapgis-ui-row>

    <mapgis-2d-plot
      v-if="symbolUrl !== ''"
      :symbolUrl="symbolUrl"
      :vueKey="vueKey"
      :vueIndex="vueIndex"
      @loaded="(e) => (plot = e)"
      :fontUrl="font"
      :baseUrl="svgBaseUrl"
    >
      <template #symbol="slotProps" v-if="is2DMapMode">
        <mp-window-wrapper :visible="showSymbol">
          <mp-window
            :visible.sync="showSymbol"
            title="符号库"
            :vertical-offset="52"
            :horizontal-offset="10"
            :width="320"
            :height="550"
            :has-padding="false"
            anchor="top-left"
          >
            <mapgis-ui-plot-symbol
              :data="slotProps.data"
              @click="slotProps.click"
              @search="slotProps.search"
              :baseUrl="slotProps.baseUrl"
              :format="slotProps.format"
              v-if="slotProps.data"
            ></mapgis-ui-plot-symbol>
          </mp-window>
        </mp-window-wrapper>
      </template>
    </mapgis-2d-plot>
  </div>
  <div style="max-height: 530px" v-else>
    <mapgis-ui-row :gutter="8" class="plot-edit-toolbar">
      <mapgis-ui-col :span="12">
        <mapgis-ui-switch-panel
          v-if="showSymbol"
          label="图层编辑"
          @changeChecked="edit"
          :checked="false"
          :isTitleBold="true"
          :hasTopMargin="false"
          :hasBottomMargin="false"
          size="small"
        />
      </mapgis-ui-col>
      <mapgis-ui-col :span="12">
        <mapgis-ui-button @click="stopDrawing" class="plot-edit-btn">
          停止绘制
        </mapgis-ui-button>
      </mapgis-ui-col>
    </mapgis-ui-row>

    <mapgis-3d-plot
      v-if="symbolUrl !== ''"
      :symbolUrl="symbolUrl"
      :vueKey="vueKey"
      :vueIndex="vueIndex"
      @loaded="(e) => (plot = e)"
      :fontUrl="font"
      :baseUrl="svgBaseUrl"
    >
      <template #symbol="slotProps" v-if="!is2DMapMode">
        <mp-window-wrapper :visible.sync="showSymbol">
          <mp-window
            :visible.sync="showSymbol"
            title="符号库"
            :vertical-offset="52"
            :horizontal-offset="10"
            :width="320"
            :height="550"
            :has-padding="false"
            anchor="top-left"
          >
            <mapgis-ui-plot-symbol
              :data="slotProps.data"
              @click="slotProps.click"
              @search="slotProps.search"
              :baseUrl="slotProps.baseUrl"
              :format="slotProps.format"
              v-if="slotProps.data"
            ></mapgis-ui-plot-symbol>
          </mp-window>
        </mp-window-wrapper>
      </template>
    </mapgis-3d-plot>
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  eventBus,
  events,
  api,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpPlotManager',
  mixins: [WidgetMixin],
  data() {
    return {
      defaultIp: baseConfigInstance.config.ip,
      defaultPort: baseConfigInstance.config.port,
      // private plotLayer = []

      vueIndex: '',

      vueKey: '',

      /** 符号库Url */
      symbolUrl: '',

      /** 字体基地址 */
      font: '',

      /** 符号基地址 */
      base: '',

      /** 标绘基地址 */
      symbolBaseUrl: '',

      /** 符号展示基地址 */
      svgBaseUrl: '',

      showSymbol: false,

      firstOpen: true,

      plot: undefined,
    }
  },

  // @Watch('document', { immediate: true, deep: true })
  // getScenes() {
  //   if (!this.document) return
  //   this.plotLayer = []
  //   const vm = this
  //   this.document.defaultMap
  //     .clone()
  //     .getFlatLayers()
  //     .forEach((layer) => {
  //       if (layer.type === LayerType.Plot) {
  //         // console.log('plotlayerssssssss', layer)
  //         vm.plotLayer.push(layer.id)
  //       }
  //     })
  // }
  async created() {
    const config = await api.getWidgetConfig('plot-manager')
    this.font = config.fontUrl
    // this.base = config.baseUrl
    const protocol = window.location.protocol
    const ip = config.ip || this.defaultIp
    const port = config.port || this.defaultPort
    if (ip && ip !== '' && port && port !== '') {
      this.symbolBaseUrl = `${protocol}//${ip}:${port}/`
    }

    this.svgBaseUrl = `${this.symbolBaseUrl}igs/rest/services/${config.serviceName}/PlotServer/symbolLibs/${config.libId}/symbols/`

    this.symbolUrl = await api.getSymbolLibsById(
      ip,
      port,
      config.serviceName,
      config.libId
    )

    // this.symbolUrl = config.symbolUrl

    this.$root.$on(events.PLOT_LAYER_LOADED, this.handleLoad.bind(this))
  },
  methods: {
    onOpen() {
      this.showSymbol = true
      this.plot && this.plot.setPick()
    },

    onClose() {
      this.showSymbol = false
      const newConfig = this.plot && this.plot.toJSON()
      // console.log('plotConfig',newConfig)
      api.saveWidgetConfig({
        name: 'plot',
        config: JSON.stringify(newConfig),
      })
    },

    handleLoad(vueIndex, vueKey) {
      this.vueIndex = vueIndex
      this.vueKey = vueKey

      this.plot && this.plot.setPick()
      // console.log('vueIndex, vueKey', vueIndex, vueKey)
    },

    edit(editable) {
      const layer = this.is2DMapMode ? this.get2dlayer() : this.get3dlayer()
      if (!layer) return console.log('标绘图层未加载完成！')
      layer.editable = editable
    },

    get2dlayer() {
      const vueMap = window.vueMap
      if (!vueMap) return
      const layerManager = vueMap.PlotLayerManager.findSource(
        this.vueKey,
        this.vueIndex
      )
      return layerManager && layerManager.source
    },

    get3dlayer() {
      const vueCesium = window.vueCesium
      if (!vueCesium) return
      const layerManager = window.vueCesium.PlotLayerManager.findSource(
        this.vueKey,
        this.vueIndex
      )
      return layerManager && layerManager.source
    },

    stopDrawing() {
      const drawTool = this.getDrawTool()
      drawTool && drawTool.stopDraw()
    },

    getDrawTool() {
      const vueM = this.is2DMapMode ? window.vueMap : window.vueCesium
      if (!vueM) return

      const DrawToolManager = vueM.DrawToolManager.findSource(
        this.vueKey,
        this.vueIndex
      )
      return DrawToolManager && DrawToolManager.source
    },
  },
}
</script>

<style lang="less" scoped>
.mp-window-wrapper {
  white-space: unset;
}

.plot-edit-toolbar {
  padding: 16px 16px 0;
}

.plot-edit-btn {
  width: 100%;
}
</style>
