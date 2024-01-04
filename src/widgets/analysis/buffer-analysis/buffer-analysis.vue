<template>
  <div class="mp-widget-buffer-analysis">
    <div id="widgets-ui" v-if="isWidgetOpen">
      <mapgis-ui-group-tab
        title="选择图层"
        id="title-space"
        :hasBottomMargin="false"
      />
      <mapgis-ui-form-model :layout="layout" :labelAlign="'left'">
        <mapgis-ui-form-model-item :colon="false">
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
                @change="tchangeTarget($event)"
                v-if="!selectLevel"
                :showSearch="true"
              >
              </mapgis-ui-tree-select>
              <mapgis-ui-tree-select
                v-model="tDataIndex"
                placeholder="请选择图层"
                :tree-data="layerArrOption"
                :replace-fields="replaceFields"
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
            v-show="dataType == 'VectorLayer' && !modelBuffer"
            >只对选择数据进行操作</mapgis-ui-checkbox
          >
          <mapgis-ui-checkbox
            v-show="dataType == 'VectorLayer'"
            :checked="modelBuffer"
            @change="
              () => {
                modelBuffer = !modelBuffer
                if (modelBuffer) {
                  selectLevel = false
                }
              }
            "
          >
            进行三维分析
          </mapgis-ui-checkbox>
        </mapgis-ui-form-model-item>
      </mapgis-ui-form-model>
    </div>
    <!-- 使用缓冲区分析组件 -->
    <mapgis-3d-analysis-model-buffer
      v-if="dataType == 'Model' || modelBuffer"
      :layout="layout"
      :baseUrl="baseBufferUrl"
      :srcType="srcType"
      :srcLayer="srcLayer"
      :srcFeature="srcFeature"
      @listenLayer="showLayer"
      @listenFeature="showFeature(arguments)"
      @listenBufferAdd="showAdd"
      @load="load"
      @exportResult="exportResult"
      @deleteResult="deleteResult"
    />
    <mapgis-3d-analysis-buffer
      v-else
      :layout="layout"
      :baseUrl="baseBufferUrl"
      :srcType="srcType"
      :srcLayer="srcLayer"
      :srcFeature="srcFeature"
      @listenLayer="showLayer"
      @listenFeature="showFeature(arguments)"
      @listenBufferAdd="showAdd"
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
  eventBus,
  events,
  baseConfigInstance,
  ActiveResultSet,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import { Style } from '@mapgis/webclient-es6-service'
import MpExportLayer from '../../../components/ExportLayer/export-layer.vue'

const { FillStyle } = Style
const Types = ['Lin', 'Pnt', 'Reg']

export default {
  name: 'MpBufferAnalysis',
  mixins: [WidgetMixin],
  components: { MpExportLayer },
  data() {
    return {
      layout: 'vertical',
      baseBufferUrl: 'http://localhost:6163/',
      dataType: 'VectorLayer',
      srcType: 'Layer',
      srcLayer: '',
      srcFeature: {},
      buffer: null,
      tDataIndex: null,
      isFullScreen: false,
      isWidgetOpen: false,
      featureStyle: new FillStyle({
        color: 'rgba(255,0,0,1)',
        outlineColor: 'rgba(255,0,0,1)',
        outlineWidth: 3,
        opacity: 1,
      }),
      destLayer: '',
      feature: undefined,
      selectLevel: false,
      add: false,
      finishLayer: false,
      finishFeature: false,
      visible: false,
      resultData: {},
      modelBuffer: false,
      replaceFields: {
        children: 'sublayers',
        title: 'title',
        key: 'layerIndex',
        value: 'title',
      },
      layerArrOption: [],
    }
  },

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
      if (!!this.baseBufferUrl && this.baseBufferUrl.length > 0) {
        return this.baseBufferUrl.split('/')[2].split(':')[0]
      }
      return baseConfigInstance.config.ip
    },
    port() {
      if (!!this.baseBufferUrl && this.baseBufferUrl.length > 0) {
        return this.baseBufferUrl.split('/')[2].split(':')[1]
      }
      return baseConfigInstance.config.port
    },
    domain() {
      if (!!this.baseBufferUrl && this.baseBufferUrl.length > 0) {
        const url = new URL(this.baseBufferUrl)
        return url.origin
      }
      return `${window.location.protocol}//${baseConfigInstance.config.ip}:${baseConfigInstance.config.port}`
    },
  },

  methods: {
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
          this.srcFeature = ActiveResultSet.activeResultSet
        }
      }
    },

    // 监听图层列表，当图层发生变化时动态改变layerArrOption数组
    documentChange(val: Array<unknown>) {
      this.tDataIndex = null
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

    // 微件窗口模式切换时回调
    onWindowSize(mode) {
      this.isFullScreen = mode === 'max'
    },

    load(buffer) {
      this.buffer = buffer
    },

    /**
     * 打开模块
     */
    onOpen() {
      this.isWidgetOpen = true
      this.buffer.mount()
    },

    tchangeTarget(event) {
      const layerCurrent = this.tData
      this.dataType = 'VectorLayer'
      if (layerCurrent != null) {
        if (
          layerCurrent.type == LayerType.IGSVector ||
          layerCurrent.serverType == LayerType.IGSVector ||
          layerCurrent.type == LayerType.IGSVector3D ||
          layerCurrent.serverType == LayerType.IGSVector3D
        ) {
          this.baseBufferUrl = layerCurrent.url || layerCurrent.serverURL
          this.srcLayer = layerCurrent.gdbps
          if (
            layerCurrent.serverType == LayerType.IGSVector ||
            layerCurrent.serverType == LayerType.IGSVector3D
          ) {
            this.dataType = 'Model'
          }
        } else {
          this.baseBufferUrl = layerCurrent.layer?.url
          this.srcLayer = layerCurrent.url
        }
      }
    },

    getResultLayer() {
      let url
      let layerType
      if (this.dataType === 'Model' || this.modelBuffer) {
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

    /**
     * 若缓冲区分析生成新图层，将结果显示在地图容器中，并用图层列表管理
     */
    addNewLayer(bufferStyle, renderType) {
      const resultLayer: Array<string> = this.getResultLayer()
      let highlightStyle
      if (this.dataType !== 'Model' && !this.modelBuffer) {
        highlightStyle = {
          polygon: new FillStyle({
            width: 8,
            color: '#ffff00',
            opacity: 0.8,
            outlineColor: '#ff0000',
          }),
        }
      }
      this.resultData = {
        name: 'IGS图层',
        description: '综合分析_结果图层',
        data: {
          type: resultLayer[2],
          description: '缓冲区分析',
          srcLayer: this.srcLayer,
          url: resultLayer[0],
          name: resultLayer[1],
          renderType: renderType,
          featureStyle: bufferStyle,
          highlightStyle: highlightStyle,
        },
      }
      eventBus.$emit(events.ADD_DATA_EVENT, this.resultData)
    },

    /**
     * 要素级增加GeoJsonLayer支持
     */
    addNewGeoJsonLayer() {
      const resultFeature = this.feature
      const highlightStyle = {
        polygon: new FillStyle({
          width: 8,
          color: '#ffff00',
          opacity: 0.8,
          outlineColor: '#ff0000',
        }),
      }
      const data = {
        name: 'GeoJson图层',
        description: '综合分析_结果图层',
        data: {
          type: 'GeoJson',
          url: this.destLayer,
          source: resultFeature,
          featureStyle: this.featureStyle,
          name: this.destLayer,
          highlightStyle: highlightStyle,
        },
      }
      eventBus.$emit(events.ADD_DATA_EVENT, data)
    },

    /**
     * 关闭模块
     */
    onClose() {
      this.isWidgetOpen = false
      this.reset()
      this.add = false
      this.buffer.unmount()
    },

    reset() {
      this.isFullScreen = false
      this.destLayer = ''
      this.selectLevel = false
      this.srcType = 'Layer'
    },

    showLayer(data, bufferStyle, renderType) {
      this.finishLayer = true
      this.destLayer = data
      if (this.add == true) {
        this.addNewLayer(bufferStyle, renderType)
      }
    },

    showFeature(data) {
      ;[this.feature, this.destLayer, this.featureStyle] = data
      this.finishFeature = true
      if (this.add == true) {
        this.addNewGeoJsonLayer()
      }
    },

    showAdd(data) {
      this.add = data
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
.mp-widget-buffer-analysis {
  // height: 480px;
  // overflow-y: auto;
  // padding: 0 8px 0 16px;
  // margin-left: 5px;
}
#widgets-ui {
  // height: 130px;
  z-index: 100000;
  // margin-bottom: -15px;
}
</style>
