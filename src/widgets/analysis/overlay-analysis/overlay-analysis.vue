<template>
  <div class="mp-widget-overlay-analysis">
    <div id="widgets-ui" slot="selectLayer">
      <mapgis-ui-group-tab title="选择数据" id="title-space" />
      <mapgis-ui-form-model :layout="layout">
        <mapgis-ui-form-model-item label="叠加图层1" :colon="false">
          <mapgis-ui-row>
            <mapgis-ui-col>
              <mapgis-ui-tree-select
                v-model="tDataIndex"
                placeholder="请选择图层"
                :tree-data="layerArrOption"
                :getPopupContainer="
                  (e) => {
                    return e.parentNode
                  }
                "
                tree-default-expand-all
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                :replace-fields="replaceFields"
                @select="tSelectTarget"
                @change="tchangeTarget"
                :showSearch="true"
              >
              </mapgis-ui-tree-select>
            </mapgis-ui-col>
          </mapgis-ui-row>
        </mapgis-ui-form-model-item>
        <mapgis-ui-form-model-item label="叠加图层2" :colon="false">
          <mapgis-ui-row>
            <mapgis-ui-col>
              <mapgis-ui-tree-select
                v-model="dDataIndex"
                placeholder="请选择图层"
                tree-default-expand-all
                :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                @select="dSelectTarget"
                @change="dchangeTarget"
                :tree-data="layerArrOption"
                :getPopupContainer="
                  (e) => {
                    return e.parentNode
                  }
                "
                :replace-fields="replaceFields"
                v-if="!selectLevel"
                :showSearch="true"
              >
              </mapgis-ui-tree-select>
              <mapgis-ui-tree-select
                v-model="dDataIndex"
                :tree-data="layerArrOption"
                :getPopupContainer="
                  (e) => {
                    return e.parentNode
                  }
                "
                :replace-fields="replaceFields"
                @change="dchangeTarget"
                v-if="selectLevel"
                disabled
              >
              </mapgis-ui-tree-select>
            </mapgis-ui-col>
          </mapgis-ui-row>
          <mapgis-ui-checkbox
            style="line-height: 32px"
            :checked="selectLevel"
            @change="changeSelectLevel"
            v-show="dataType !== 'Model'"
            >只对选择数据进行操作</mapgis-ui-checkbox
          >
        </mapgis-ui-form-model-item>
      </mapgis-ui-form-model>
    </div>
    <mapgis-3d-analysis-overlay
      v-show="dataType !== 'Model'"
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
    />
    <mapgis-3d-analysis-model-overlay
      v-show="dataType === 'Model'"
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
    />
    <mp-export-layer
      :visible="visible"
      :gdbp="destLayer"
      :ip="ip"
      :port="port"
      @finished="visible = false"
    ></mp-export-layer>
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  SelectedResultSet,
  eventBus,
  events,
  baseConfigInstance,
  dataCatalogManagerInstance,
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
      dataType: 'VectorLayer',
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
      replaceFields: {
        children: 'sublayers',
        title: 'title',
        key: 'layerIndex',
        value: 'title',
      },
      layerArrOption: [],
    }
  },

  // 监听图层列表，当图层发生变化时动态改变layerArrOption数组
  watch: {
    'document.defaultMap': {
      handler: 'documentChange',
      deep: true,
      immediate: true,
    },
    // 三维分析不支持要素级，当分析类型变成三维分析时将selectLevel属性置为false
    dataType() {
      if (this.dataType === 'Model') {
        this.selectLevel = false
      }
    },
  },

  computed: {
    ip() {
      if (!!this.baseOverlayUrl && this.baseOverlayUrl.length > 0) {
        return this.baseOverlayUrl.split('/')[2].split(':')[0]
      }
      return baseConfigInstance.config.ip
    },
    port() {
      if (!!this.baseOverlayUrl && this.baseOverlayUrl.length > 0) {
        return this.baseOverlayUrl.split('/')[2].split(':')[1]
      }
      return baseConfigInstance.config.port
    },
    domain() {
      if (!!this.baseOverlayUrl && this.baseOverlayUrl.length > 0) {
        const url = new URL(this.baseOverlayUrl)
        return url.origin
      }
      return `${window.location.protocol}//${baseConfigInstance.config.ip}:${baseConfigInstance.config.port}`
    },
  },

  methods: {
    // 监听图层列表，当图层发生变化时动态改变layerArrOption数组
    documentChange(val: Array<unknown>) {
      this.tDataIndex = null
      this.dDataIndex = null
      this.layerArrOption = []
      const arr = []
      const layers: Array<unknown> = this.document.clone().defaultMap.layers()
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        if (
          layer.type === LayerType.IGSVector ||
          layer.type === LayerType.IGSMapImage ||
          layer.type === LayerType.IGSTile
        ) {
          const treeNodeData = {
            id: layer.id,
            layerIndex: `${i}`,
            sublayers: [],
            title: layer.title,
            url: layer.url,
            serverURL: layer.serverURL,
            type: layer.type,
            serverType: layer.serverType,
            layer,
          }
          if (layer.sublayers && layer.sublayers.length > 0) {
            treeNodeData.disabled = true
            this.formatTreeNodeData(
              treeNodeData.sublayers,
              layer.sublayers,
              treeNodeData.layerIndex,
              layer
            )
          }
          arr.push(treeNodeData)
        } else if (
          layer.type === LayerType.IGSScene ||
          layer.type === LayerType.ModelCache
        ) {
          // 只支持使用绑定的简单要素类进行分析，绑定二维地图文档无法分析
          if (
            layer.searchParams &&
            layer.searchParams.searchName &&
            layer.searchParams.searchName.includes('gdbp')
          ) {
            const treeNodeData = {
              id: layer.id,
              layerIndex: `${i}`,
              sublayers: [],
              title: layer.title,
              url: layer.searchParams.searchName,
              serverURL: layer.serverURL,
              type: layer.type,
              serverType: layer.serverType,
              layer,
            }
            arr.push(treeNodeData)
          }
        }
      }

      if (arr.length > 0) {
        this.layerArrOption = arr
      }
    },

    formatTreeNodeData(arr, sublayers, index, parantLayer) {
      for (let i = 0; i < sublayers.length; i++) {
        const layer = sublayers[i]
        const treeNodeData = {
          id: layer.id,
          layerIndex: `${index}-${i}`,
          sublayers: [],
          title: layer.title,
          url: layer.url,
          serverURL: layer.serverURL,
          type: layer.type,
          serverType: layer.serverType,
          layer: parantLayer,
        }
        if (layer.sublayers && layer.sublayers.length > 0) {
          treeNodeData.disabled = true
          this.formatTreeNodeData(
            treeNodeData.sublayers,
            layer.sublayers,
            treeNodeData.layerIndex,
            parantLayer
          )
        }
        arr.push(treeNodeData)
      }
    },

    tSelectTarget(value, node) {
      this.tData = node.dataRef
    },

    dSelectTarget(value, node) {
      this.dData = node.dataRef
    },

    changeSelectLevel() {
      this.selectLevel = !this.selectLevel
      if (this.selectLevel == false) {
        this.srcType = 'Layer'
      } else {
        this.srcType = 'Feature'
        for (let i = 0; i < SelectedResultSet.selectedResultSet.length; i++) {
          const selectedResultSet = SelectedResultSet.selectedResultSet[i]
          if (selectedResultSet.id == this.tData.id) {
            this.srcAFeature = selectedResultSet
          } else if (selectedResultSet.id == this.dData.id) {
            this.srcBFeature = selectedResultSet
          }
        }
        if (this.srcAFeature.length == 0 && this.srcBFeature.length == 0) {
          this.$message.warn('当前选择要素为空，请重新选择')
          this.selectLevel = true
          this.changeSelectLevel()
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
        this.dataType = 'VectorLayer'
        if (
          tlayerCurrent.type == LayerType.IGSVector ||
          tlayerCurrent.serverType == LayerType.IGSVector ||
          tlayerCurrent.type == LayerType.IGSVector3D ||
          tlayerCurrent.serverType == LayerType.IGSVector3D
        ) {
          this.baseOverlayUrl = tlayerCurrent.url || tlayerCurrent.serverURL
          this.srcALayer = tlayerCurrent.gdbps
          if (
            tlayerCurrent.serverType == LayerType.IGSVector ||
            tlayerCurrent.serverType == LayerType.IGSVector3D
          ) {
            this.dataType = 'Model'
          }
        } else {
          this.baseOverlayUrl = tlayerCurrent.layer?.url
          this.srcALayer = tlayerCurrent.url
        }
      }
    },

    dchangeTarget() {
      const dlayerCurrent = this.dData
      if (dlayerCurrent != null) {
        if (
          dlayerCurrent.type == LayerType.IGSVector ||
          dlayerCurrent.serverType == LayerType.IGSVector ||
          dlayerCurrent.type == LayerType.IGSVector3D ||
          dlayerCurrent.serverType == LayerType.IGSVector3D
        ) {
          this.baseOverlayUrl = dlayerCurrent.url || dlayerCurrent.serverURL
          this.srcBLayer = dlayerCurrent.gdbps
        } else {
          this.baseOverlayUrl = dlayerCurrent.layer?.url
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

    getResultLayer() {
      let url
      let layerType
      if (this.dataType === 'Model') {
        url = `${this.domain}/igs/rest/services/system/ResourceServer/tempData/models?gdbpUrl=${this.destLayer}`
        layerType = 'IGSVector3D'
      } else {
        url = `${this.domain}/igs/rest/mrms/layers?gdbps=${this.destLayer}`
        layerType = 'IGSVector'
      }
      const index = url.lastIndexOf('/')
      const layerName = url.substring(index + 1, url.length)
      return [url, layerName, layerType]
    },

    addNewLayer() {
      const resultLayer: Array<string> = this.getResultLayer()
      this.resultData = {
        name: 'IGS图层',
        description: '综合分析_结果图层',
        data: {
          type: resultLayer[2],
          description: '缓冲区分析',
          srcLayer: this.srcLayer + this.srcBLayer,
          url: resultLayer[0],
          name: resultLayer[1],
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
