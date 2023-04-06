<template>
  <div style="max-height: 530px" v-if="is2DMapMode">
    <mapgis-ui-switch-panel
      v-if="dataLoaded"
      label="启用图层编辑"
      @changeChecked="edit"
      :checked="true"
      :isTitleBold="true"
      :hasTopMargin="true"
      :hasBottomMargin="false"
      size="small"
      class="plot-layer-edit-btn"
    />
    <mapgis-2d-plot-animation
      :data="data"
      :vueKey="vueKey"
      :vueIndex="vueIndex"
      :currentTime="'1948-11-06'"
      v-if="dataLoaded"
      @loaded="(e) => (animation = e)"
      @save="saveScript"
      @remove="removeScript"
      @export="saveConfig"
      @play="timelinePlay"
      @reset="timelineReset"
    >
      <template #timeline="slotProps" v-if="is2DMapMode">
        <mp-window-wrapper :visible="showTimeline">
          <mapgis-ui-placement
            :position="'bottom-left'"
            v-show="showTimeline"
            :offset="[52, 60]"
            style="right: 0px"
          >
            <mapgis-ui-plot-timeline
              ref="timeline"
              :value="slotProps.value"
              :min="slotProps.min"
              :max="slotProps.max"
              @change="slotProps.change"
              :enableEnd="slotProps.enableEnd"
              :speed="slotProps.speed"
              :interval="slotProps.interval"
              :intervalOptions="slotProps.intervalOptions"
              :duration="slotProps.duration"
              :currentTime="slotProps.currentTime"
              @start="slotProps.start"
              @backward="slotProps.backward"
              @pause="slotProps.pause"
              @forward="slotProps.forward"
              @speedChange="slotProps.speedChange"
              @intervalChange="slotProps.intervalChange"
            ></mapgis-ui-plot-timeline>
          </mapgis-ui-placement>
        </mp-window-wrapper>
      </template>
    </mapgis-2d-plot-animation>
  </div>
  <div style="max-height: 530px" v-else>
    <mapgis-ui-switch-panel
      v-if="dataLoaded"
      label="图层编辑"
      @changeChecked="edit"
      :checked="false"
      :isTitleBold="true"
      :hasTopMargin="true"
      :hasBottomMargin="false"
      size="small"
      class="plot-layer-edit-btn"
    />
    <mapgis-3d-plot-animation
      :data="data"
      :vueKey="vueKey"
      :vueIndex="vueIndex"
      :currentTime="'1948-11-06'"
      v-if="dataLoaded"
      @loaded="(e) => (animation = e)"
      @save="saveScript"
      @remove="removeScript"
      @export="saveConfig"
      @play="timelinePlay"
      @reset="timelineReset"
    >
      <template #timeline="slotProps" v-if="!is2DMapMode">
        <mp-window-wrapper :visible="showTimeline">
          <mapgis-ui-placement
            :position="'bottom-left'"
            v-show="showTimeline"
            :offset="[52, 60]"
            style="right: 0px"
          >
            <mapgis-ui-plot-timeline
              ref="timeline"
              :value="slotProps.value"
              :min="slotProps.min"
              :max="slotProps.max"
              @change="slotProps.change"
              :enableEnd="slotProps.enableEnd"
              :speed="slotProps.speed"
              :interval="slotProps.interval"
              :intervalOptions="slotProps.intervalOptions"
              :duration="slotProps.duration"
              :currentTime="slotProps.currentTime"
              @start="slotProps.start"
              @backward="slotProps.backward"
              @pause="slotProps.pause"
              @forward="slotProps.forward"
              @speedChange="slotProps.speedChange"
              @intervalChange="slotProps.intervalChange"
            ></mapgis-ui-plot-timeline>
          </mapgis-ui-placement>
        </mp-window-wrapper>
      </template>
    </mapgis-3d-plot-animation>
  </div>
</template>

<script lang="ts">
import { SymbolManager } from '@mapgis/webclient-es6-service'
import {
  LayerType,
  WidgetMixin,
  eventBus,
  events,
  api,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpPlotAnimation',
  mixins: [WidgetMixin],
  data() {
    return {
      defaultIp: baseConfigInstance.config.ip,

      defaultPort: baseConfigInstance.config.port,

      vueIndex: '',

      vueKey: '',

      data: '',

      dataLoaded: false,

      showTimeline: false,

      animation: undefined,

      config: {},
    }
  },

  async created() {
    // 拿到服务名
    this.config = await api.getWidgetConfig('plot-animation')

    this.$root.$on(events.PLOT_LAYER_LOADED, this.handleLoad.bind(this))
  },
  methods: {
    onOpen() {
      // 确保打开面板的时候才请求数据，避免在未使用组件时，请求数据时无法请求到数据出现报错问题
      if (!this.dataLoaded || (this.data && this.data !== '')) {
        // 请求脚本列表，得到脚本数组
        this.getScriptListData()
        this.dataLoaded = true
      }
      this.showTimeline = true
      this.animation && this.animation.setPick()
    },

    onClose() {
      this.showTimeline = false
    },

    handleLoad(vueIndex, vueKey) {
      this.vueIndex = vueIndex
      this.vueKey = vueKey
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

    async getScriptListData() {
      const ip = this.config.ip || this.defaultIp
      const port = this.config.port || this.defaultPort
      const scriptList = await api.getScriptList(
        ip,
        port,
        this.config.serviceName
      )
      console.log('测试', scriptList, JSON.stringify(scriptList))
      const resultList = []

      for (const script of scriptList.scripts) {
        const result = await api.getScriptById(
          ip,
          port,
          this.config.serviceName,
          script.scriptId
        )
        result.scriptId = script.scriptId
        resultList.push(result)
      }
      this.data = JSON.parse(JSON.stringify(resultList))
    },

    saveConfig(newConfig) {
      api.saveWidgetConfig({
        name: 'plot-animation',
        config: JSON.parse(JSON.stringify(newConfig)),
      })
    },

    async saveScript(script) {
      console.log(script)
      const scriptListCopy = JSON.parse(JSON.stringify(script))
      const scriptList =
        script instanceof Array ? scriptListCopy : [scriptListCopy]
      for (let i = 0; i < scriptList.length; i++) {
        const scriptItem = scriptList[i]
        const scriptId = scriptItem.scriptId
        delete scriptItem.scriptId
        const ip = this.config.ip || this.defaultIp
        const port = this.config.port || this.defaultPort
        const scriptParams = {
          scriptId,
          scriptName: scriptItem.timeLineName,
          content: JSON.stringify(scriptItem),
        }
        await api
          .saveScriptById(ip, port, this.config.serviceName, scriptParams)
          .then((res) => {
            if (res.code > 0) {
              this.getScriptListData()
            }
          })
      }
    },

    removeScript(script) {
      const scriptId = script.scriptId
      delete script.scriptId
      const ip = this.config.ip || this.defaultIp
      const port = this.config.port || this.defaultPort
      api
        .removeScriptById(ip, port, this.config.serviceName, scriptId)
        .then((res) => {
          if (res.code > 0) {
            this.getScriptListData()
          }
        })
    },

    timelineReset() {
      this.$refs.timeline.stopPlay()
    },

    timelinePlay() {
      this.$refs.timeline.getWindowWidth()
      this.$refs.timeline.forward()
    },
  },
}
</script>

<style lang="less" scoped>
.plot-layer-edit-btn {
  margin: 20px 20px 0;
}
</style>
