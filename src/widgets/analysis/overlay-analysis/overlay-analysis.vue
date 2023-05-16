<template>
  <div class="mp-widget-overlay-analysis">
    <mapgis-3d-analysis-overlay
      :layout="layout"
      :baseUrl="baseOverlayUrl"
      :srcType="srcType"
      :srcALayer="srcALayer"
      :srcBLayer="srcBLayer"
      :srcAFeature="srcAFeature"
      :srcBFeature="srcBFeature"
      @listenLayer="showLayer"
      @listenOverlayAdd="showAdd"
      @load="load"
      @exportResult="exportResult"
      @deleteResult="deleteResult"
    >
      <div id="widgets-ui" slot="selectLayer">
        <mapgis-ui-group-tab title="选择数据" id="title-space" />
        <mapgis-ui-form-model :layout="layout">
          <mapgis-ui-form-model-item label="叠加图层1" :colon="false">
            <mapgis-ui-row>
              <mapgis-ui-col>
                <mapgis-ui-select v-model="tDataIndex" @change="tchangeTarget">
                  <mapgis-ui-select-option
                    v-for="(item, index) in layerArrOption"
                    :key="index"
                    :value="index"
                    >{{ item.title }}</mapgis-ui-select-option
                  >
                </mapgis-ui-select>
              </mapgis-ui-col>
            </mapgis-ui-row>
          </mapgis-ui-form-model-item>
          <mapgis-ui-form-model-item label="叠加图层2" :colon="false">
            <mapgis-ui-row>
              <mapgis-ui-col>
                <mapgis-ui-select
                  v-model="dDataIndex"
                  @change="dchangeTarget"
                  v-if="!selectLevel"
                >
                  <mapgis-ui-select-option
                    v-for="(item, index) in layerArrOption"
                    :key="index"
                    :value="index"
                    >{{ item.title }}</mapgis-ui-select-option
                  >
                </mapgis-ui-select>
                <mapgis-ui-select
                  v-model="dDataIndex"
                  @change="dchangeTarget"
                  v-if="selectLevel"
                  disabled
                >
                  <mapgis-ui-select-option
                    v-for="(item, index) in layerArrOption"
                    :key="index"
                    :value="index"
                    >{{ item.title }}</mapgis-ui-select-option
                  >
                </mapgis-ui-select>
              </mapgis-ui-col>
            </mapgis-ui-row>
            <mapgis-ui-checkbox
              style="line-height: 32px"
              :checked="selectLevel"
              @change="changeSelectLevel"
              >只对选择数据进行操作</mapgis-ui-checkbox
            >
          </mapgis-ui-form-model-item>
        </mapgis-ui-form-model>
      </div>
    </mapgis-3d-analysis-overlay>
    <mp-export-layer
      :visible="visible"
      :gdbp="destLayer"
      :ip="ip"
      :port="port"
      :exportConfig="exportConfig"
      @finished="visible = false"
    ></mp-export-layer>
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  ActiveResultSet,
  eventBus,
  events,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import MpExportLayer from '../../../components/ExportLayer/export-layer.vue'

export default {
  name: 'MpOverlayAnalysis',
  mixins: [WidgetMixin],
  components: { MpExportLayer },
  data() {
    return {
      layout: 'vertical',
      baseOverlayUrl: 'http://localhost:6163',
      srcType: 'Layer',
      srcALayer: '',
      srcBLayer: '',
      srcAFeature: {},
      srcBFeature: {},
      overlay: null,
      tDataIndex: null,
      dDataIndex: null,
      isFullScreen: false,
      isWidgetOpen: false,
      selectLevel: false,
      feature: undefined,
      destLayer: '',
      add: false,
      finishLayer: false,
      finishFeature: false,
      visible: false,
      resultData: {},
    }
  },

  // 监听图层列表，当图层发生变化时动态改变layerArrOption数组
  watch: {
    'document.defaultMap': {
      handler: 'documentChange',
      deep: true,
      immediate: true,
    },
  },

  computed: {
    // 获取当前下拉框中的图层对象和索引值
    tData() {
      if (this.tDataIndex !== null) {
        return this.layerArrOption[this.tDataIndex]
      }
      return null
    },
    dData() {
      if (this.dDataIndex !== null) {
        return this.layerArrOption[this.dDataIndex]
      }
      return null
    },
    exportConfig() {
      return this.widgetInfo.config
        ? this.widgetInfo.config.exportConfig
        : {
            ip: baseConfigInstance.config.ip,
            port: baseConfigInstance.config.port,
          }
    },
    ip() {
      return (this.baseBufferUrl || '').split('/')[2].split(':')[0]
    },
    port() {
      return (this.baseBufferUrl || '').split('/')[2].split(':')[1]
    },
  },

  methods: {
    // 监听图层列表，当图层发生变化时动态改变layerArrOption数组
    documentChange(val: Array<unknown>) {
      this.tDataIndex = null
      this.dDataIndex = null
      this.layerArrOption = []
      const arr = []
      val.layers().forEach((data) => {
        if (data.type === LayerType.IGSVector) {
          arr.push(data)
        } else if (data.type === LayerType.IGSMapImage) {
          arr.push(...data.sublayers)
        }
      })
      if (arr.length > 0) {
        this.layerArrOption = arr
        this.tDataIndex = 0
        this.dDataIndex = 0
      }
      this.tchangeTarget()
      this.dchangeTarget()
    },

    changeSelectLevel() {
      this.selectLevel = !this.selectLevel
      if (this.selectLevel == false) {
        this.srcType = 'Layer'
      } else {
        this.srcType = 'Feature'
        if (JSON.stringify(ActiveResultSet.activeResultSet) == '{}') {
          this.$message.warn('当前选择要素为空，请重新选择')
          this.selectLevel = true
          this.changeSelectLevel()
        } else {
          this.srcAFeature = ActiveResultSet.activeResultSet
        }
      }
    },

    // 微件窗口模式切换时回调
    onWindowSize(mode) {
      this.isFullScreen = mode === 'max'
    },

    load(overlay) {
      this.overlay = overlay
    },

    /**
     * 打开模块
     */
    onOpen() {
      this.isWidgetOpen = true
      this.overlay.mount()
    },

    tchangeTarget() {
      const tlayerCurrent = this.tData
      if (tlayerCurrent != null) {
        if (tlayerCurrent.type == 6) {
          this.baseOverlayUrl = tlayerCurrent.url
          this.srcALayer = tlayerCurrent.gdbps
        } else {
          this.baseOverlayUrl = tlayerCurrent.layer.url
          this.srcALayer = tlayerCurrent.url
        }
      }
    },

    dchangeTarget() {
      const dlayerCurrent = this.dData
      if (dlayerCurrent != null) {
        if (dlayerCurrent.type == 6) {
          this.baseOverlayUrl = dlayerCurrent.url
          this.srcBLayer = dlayerCurrent.gdbps
        } else {
          this.baseOverlayUrl = dlayerCurrent.layer.url
          this.srcBLayer = dlayerCurrent.url
        }
      }
    },

    showLayer(data) {
      this.finishLayer = true
      this.destLayer = data
      if (this.add == true) {
        this.addNewLayer()
      }
    },

    showAdd(data) {
      this.add = data
    },

    addNewLayer() {
      const { ip, port } = this
      const protocol = window.location.protocol
      const domain = `${protocol}//${ip}:${port}`
      const url = `${domain}/igs/rest/mrms/layers?gdbps=${this.destLayer}`
      const index = url.lastIndexOf('/')
      const layerName = url.substring(index + 1, url.length)
      this.resultData = {
        name: 'IGS图层',
        description: '综合分析_结果图层',
        data: {
          type: 'IGSVector',
          description: '叠加分析',
          srcLayer: this.srcALayer + this.srcBLayer,
          url,
          name: layerName,
        },
      }
      eventBus.$emit(events.ADD_DATA_EVENT, this.resultData)
    },

    /**
     * 关闭模块
     */
    onClose() {
      this.isWidgetOpen = false
      this.reset()
      this.overlay.unmount()
    },

    reset() {
      this.isFullScreen = false
    },
    exportResult() {
      if (this.destLayer && this.destLayer.length > 0) {
        this.visible = true
      }
    },
    deleteResult() {
      eventBus.$emit(events.DELETE_DATA_EVENT, this.resultData)
    },
  },
}
</script>

<style lang="scss" scoped>
.mapgis-ui-form-item {
  margin-bottom: 0px;
}
.mp-widget-overlay-analysis {
  // height: 480px;
  // overflow-y: auto;
  // padding: 10px 10px 10px 15px;
  // margin-left: 5px;
}
#widgets-ui {
  // height: 130px;
  z-index: 100000;
  // margin-bottom: -15px;
}
</style>
