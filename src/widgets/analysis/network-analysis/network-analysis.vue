<template>
  <div class="mp-widget-network-analysis">
    <div id="network-analysis-el">
      <mapgis-ui-spin :spinning="showLoading">
        <mapgis-ui-setting-form
          :label-col="{ span: 5 }"
          :wrapper-col="{ span: 12 }"
        >
          <!-- <mapgis-ui-setting-form :wrapper-width="180"> -->
          <mapgis-ui-form-item label="选择数据" class="select-data">
            <mapgis-ui-select
              class="select-box"
              v-model="layerSelectIndex"
              @change="setNetWorkLayer"
            >
              <mapgis-ui-select-option
                v-for="(item, index) in layerArrOption"
                :key="index"
                :value="index"
              >
                {{ item.title }}
              </mapgis-ui-select-option>
            </mapgis-ui-select>
          </mapgis-ui-form-item>
          <mapgis-ui-form-item label="选择图层" class="select-data">
            <mapgis-ui-select v-model="networkLayerIndex" @change="resetLayer">
              <mapgis-ui-select-option
                v-for="(item, index) in networkLayerOption"
                :key="index"
                :value="index"
              >
                {{ item.title }}
              </mapgis-ui-select-option>
            </mapgis-ui-select>
          </mapgis-ui-form-item>
          <mapgis-ui-form-item label="选择方式" class="select-data">
            <mapgis-ui-select v-model="wayIndex" @change="resetLayer">
              <mapgis-ui-select-option
                v-for="(item, index) in wayOptions"
                :key="index"
                :value="index"
              >
                {{ item.name }}
              </mapgis-ui-select-option>
            </mapgis-ui-select>
          </mapgis-ui-form-item>
          <mapgis-ui-form-item v-if="showButton" label="选择类型">
            <mapgis-ui-radio-group v-model="groupRadio" :options="optionsRadio">
            </mapgis-ui-radio-group>
          </mapgis-ui-form-item>
        </mapgis-ui-setting-form>
        <div v-if="showButton" class="control-button-container">
          <mapgis-ui-button
            class="control-button"
            @click="createMarker(null, 'dots')"
          >
            绘制目标
          </mapgis-ui-button>
          <mapgis-ui-button
            class="control-button"
            @click="createMarker(null, 'barrier')"
          >
            绘制障碍
          </mapgis-ui-button>
        </div>

        <div v-if="!showButton" class="control-button-container">
          <mapgis-ui-button
            class="control-button"
            @click="createMarker('1', 'dots')"
          >
            点上网标
          </mapgis-ui-button>
          <mapgis-ui-button
            class="control-button"
            @click="createMarker('2', 'dots')"
          >
            线上网标
          </mapgis-ui-button>
        </div>
        <div class="control-button-container">
          <mapgis-ui-button class="control-button" @click="clearClick">
            结束绘制
          </mapgis-ui-button>
          <mapgis-ui-button class="control-button" @click="resetLayer">
            清空
          </mapgis-ui-button>
        </div>
        <mapgis-ui-tabs type="card" v-model="tab" size="small">
          <mapgis-ui-tab-pane key="coordinateArr" tab="坐标点集">
            <mp-coordinate-table
              :data="dataCoordinateArr.features"
              :columns="columnsCoordinateArr"
              :isFullScreen="isFullScreen"
              @deleteRow="deleteRow"
              @rowClick="rowClick"
              :showButton="!showButton"
            ></mp-coordinate-table>
          </mapgis-ui-tab-pane>
          <mapgis-ui-tab-pane v-if="showButton" key="hinderArr" tab="障碍点集">
            <mp-hinder-table
              :data="dataBarrierArr.features"
              :columns="columnsCoordinateArr"
              :isFullScreen="isFullScreen"
              @deleteRow="deleteRow"
              @rowClick="rowClick"
            ></mp-hinder-table>
          </mapgis-ui-tab-pane>
          <mapgis-ui-tab-pane key="analysisRes" tab="分析结果">
            <mp-analysis-result-table
              :isFullScreen="isFullScreen"
              ref="MpNetworkAnalysis"
              @draw-high-result="drawHighResult"
              @draw-result="drawResult"
              @fly-to-high="flyToHigh"
            />
          </mapgis-ui-tab-pane>
        </mapgis-ui-tabs>
        <div class="analysis-actions">
          <!-- <mapgis-ui-button @click="showSetting" :disable="showLoading"
              >设置参数</mapgis-ui-button
            > -->
          <mapgis-ui-button
            type="primary"
            @click="startAnalysis"
            :disable="showLoading"
          >
            分析
          </mapgis-ui-button>
        </div>
      </mapgis-ui-spin>
    </div>
    <template v-if="isWidgetOpen">
      <mapbox-layer
        v-if="is2DMapMode"
        ref="mapboxLayer"
        :dataBarrierArr="dataBarrierArr"
        :dataCoordinateArr="dataCoordinateArr"
        :marker="centerMarker"
        :result="result"
        :highResultSource="highResultSource"
        :color="color"
      />
      <cesium-layer
        v-else
        ref="cesiumLayer"
        :dataBarrierArr="dataBarrierArr"
        :dataCoordinateArr="dataCoordinateArr"
        :marker="centerMarker"
        :result="result"
        :highResultSource="highResultSource"
        :color="color"
      ></cesium-layer>
    </template>
    <mp-draw-pro ref="draw" @finished="clickFunciton" />
    <mp-3d-draw-pro ref="draw3d" @finished="clickFunciton" />
    <mapgis-ui-modal
      v-model="settingDialog"
      title="设置参数"
      centered
      :footer="null"
    >
      <setting v-model="settingForm" />
    </mapgis-ui-modal>
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  Analysis,
  UUID,
  markerIconInstance,
} from '@mapgis/web-app-framework'
import MpHinderTable from './hinder-table'
import MpCoordinateTable from './coordinate-table'
import MpAnalysisResultTable from './analysis-result-table'
import setting from './setting'
import mapboxLayer from './map-layer/mapbox-layer.vue'
import cesiumLayer from './map-layer/cesium-layer'

export default {
  name: 'MpNetworkAnalysis',
  mixins: [WidgetMixin],
  components: {
    MpHinderTable,
    MpCoordinateTable,
    setting,
    MpAnalysisResultTable,
    mapboxLayer,
    cesiumLayer,
  },

  data() {
    return {
      settingForm: {
        analyTp: 'UserMode',
        nearDis: 0.01,
        wid1: 'Weight1',
        wid2: 'Weight1',
        wid3: 'Weight1',
      },
      // 分时分析加载框
      showLoading: false,
      settingDialog: false,
      // 地图划线颜色
      color: 'rgba(39,194,76,1)',
      layerSelectIndex: null,
      layerArrOption: [],
      centerMarker: null,
      // 选择图层下标
      networkLayerIndex: null,
      // 选择图层的 数组
      networkLayerOption: [],
      wayIndex: 0,
      // 判断点上、线上类型
      clickRadio: null,
      // 根据该类型判断是否需要跳转到障碍物table
      clickType: 'dots',
      tab: 'coordinateArr',
      groupRadio: '1',
      optionsRadio: [
        {
          label: '点上网标',
          value: '1',
        },
        {
          label: '线上网标',
          value: '2',
        },
      ],
      // 点集的source
      dataCoordinateArr: {
        type: 'FeatureCollection',
        features: [],
      },
      circleColor: {
        'circle-radius': 5, // 半径
        'circle-color': '#FF9933', // 颜色
        'circle-opacity': 1, // 透明度
      },
      // 点集的source
      dataBarrierArr: {
        type: 'FeatureCollection',
        features: [],
      },
      isWidgetOpen: false,
      highResultSource: { type: 'FeatureCollection', features: [] },
      result: {
        layerPoint: { type: 'FeatureCollection', features: [] },
        layerLine: { type: 'FeatureCollection', features: [] },
      },
      wayOptions: [
        {
          id: 'connectAnalysis',
          name: '连通分析',
          workflowId: '600336',
        },
        {
          id: 'disconnectAnalysis',
          name: '非连通分析',
          workflowId: '600336',
        },
        {
          id: 'pathAnalysis',
          name: '路径分析',
          workflowId: '600233',
        },
      ],
      isFullScreen: false,
    }
  },

  computed: {
    drawLayer() {
      return this.is2DMapMode ? this.$refs.mapboxLayer : this.$refs.cesiumLayer
    },

    drawComponent() {
      return this.is2DMapMode ? this.$refs.draw : this.$refs.draw3d
    },

    way() {
      if (this.wayIndex !== null) {
        return this.wayOptions[this.wayIndex]
      }
      return null
    },

    // 选择数据
    layerSelect() {
      if (this.layerSelectIndex !== null) {
        return this.layerArrOption[this.layerSelectIndex]
      }
      return null
    },

    // 选择图层
    networkLayer() {
      if (this.networkLayerIndex !== null) {
        return this.networkLayerOption[this.networkLayerIndex]
      }
      return null
    },

    showButton() {
      return this.way.id === 'pathAnalysis'
    },

    columnsCoordinateArr() {
      const itemWidth = this.isFullScreen ? {} : { width: '120px' }
      if (!this.showButton) {
        return [
          {
            title: '',
            key: 'index',
            scopedSlots: { customRender: 'index' },
            width: '40px',
            align: 'center',
          },
          {
            title: 'X坐标',
            dataIndex: 'geometry.coordinates[0]',
            scopedSlots: { customRender: 'x' },
            ellipsis: true,
            align: 'center',
            ...itemWidth,
          },
          {
            title: 'Y坐标',
            dataIndex: 'geometry.coordinates[1]',
            scopedSlots: { customRender: 'y' },
            ellipsis: true,
            align: 'center',
            ...itemWidth,
          },
          {
            title: '类型',
            dataIndex: 'properties.type',
            scopedSlots: { customRender: 'type' },
            ellipsis: true,
            width: '60px',
            align: 'center',
          },
          {
            title: '操作',
            key: 'action',
            scopedSlots: { customRender: 'action' },
            width: '60px',
            align: 'center',
          },
        ]
      }
      return [
        {
          title: '',
          key: 'index',
          scopedSlots: { customRender: 'index' },
          width: '40px',
          align: 'center',
        },
        {
          title: 'X坐标',
          dataIndex: 'geometry.coordinates[0]',
          scopedSlots: { customRender: 'x' },
          ellipsis: true,
          align: 'center',
          ...itemWidth,
        },
        {
          title: 'Y坐标',
          dataIndex: 'geometry.coordinates[1]',
          scopedSlots: { customRender: 'y' },
          ellipsis: true,
          align: 'center',
          ...itemWidth,
        },
        {
          title: '操作',
          key: 'action',
          scopedSlots: { customRender: 'action' },
          width: '60px',
          align: 'center',
        },
      ]
    },
  },

  watch: {
    'document.defaultMap': {
      immediate: true,
      deep: true,
      handler: 'documentChange',
    },
  },

  methods: {
    onOpen() {
      this.isWidgetOpen = true
    },

    // 面板关闭时候触发函数
    onClose() {
      this.isWidgetOpen = false
      this.resetLayer()
    },

    // 微件窗口模式切换时回调
    onWindowSize(mode) {
      this.isFullScreen = mode === 'max'
      this.$nextTick(() => {
        const el = document.getElementById('network-analysis-el')
        if (el) {
          el.style.width = `${mode === 'max' ? this.$el.clientWidth : 300}px`
        }
      })
    },

    documentChange(val: Array<unknown>) {
      this.layerSelectIndex = null
      this.layerArrOption = []
      const arr = []
      val.layers().forEach((data) => {
        if (
          data.type === LayerType.IGSMapImage ||
          data.type === LayerType.IGSVector
        ) {
          arr.push(data)
        }
      })
      if (arr.length > 0) {
        this.layerArrOption = arr
        this.layerSelectIndex = 0
        this.setNetWorkLayer()
      }
    },

    async startAnalysis() {
      this.clearClick()
      this.clearResult()
      let param
      const type = this.way.id
      const workFlowId = this.way.workflowId
      const netClsUrl = this.networkLayer && this.networkLayer.url
      const { wid1, wid2, wid3, nearDis, analyTp } = this.settingForm
      const weight = [wid1, wid2, wid3].join(',')
      const flagPosStrArray = []
      const elementTypeArray = []
      this.dataCoordinateArr.features.forEach((item) => {
        flagPosStrArray.push(item.geometry.coordinates)
        elementTypeArray.push(item.properties.type)
      })
      if (!netClsUrl) {
        this.$message.error('请选择要分析的图层')
        return
      }
      if (flagPosStrArray.length === 0) {
        this.$message.error('至少绘制一个的目标点')
        return
      }
      const flagPosStr = flagPosStrArray.join(',')
      if (type === 'connectAnalysis' || type === 'disconnectAnalysis') {
        const flag = this.way.id === 'connectAnalysis'
        this.color = flag ? 'rgba(39,194,76,1)' : 'rgba(255,60,60,1)'
        const elementType = elementTypeArray.join(',')
        param = [
          {
            Key: 'netClsUrl',
            Value: netClsUrl,
          },
          {
            Key: 'flag',
            Value: flag,
          },
          {
            Key: 'flagPosStr',
            Value: flagPosStr,
          },
          {
            Key: 'elementType',
            Value: elementType,
          },
          {
            Key: 'nearDis',
            Value: nearDis,
          },
          {
            Key: 'weight',
            Value: weight,
          },
          {
            Key: 'analyTp',
            Value: analyTp,
          },
          {
            Key: 'flowId',
            Value: workFlowId,
          },
        ]
      } else if (type === 'pathAnalysis') {
        const elementType = this.groupRadio
        const barrierPosStrArray = []
        const bRows = this.dataBarrierArr.features
        for (let i = 0; i < bRows.length; i++) {
          barrierPosStrArray.push(bRows[i].geometry.coordinates)
        }
        const barrierPosStr = barrierPosStrArray.join(',')
        param = [
          {
            Key: 'netClsUrl',
            Value: netClsUrl,
          },
          {
            Key: 'flagPosStr',
            Value: flagPosStr,
          },
          {
            Key: 'elementType',
            Value: elementType,
          },
          {
            Key: 'barrierPosStr',
            Value: barrierPosStr,
          },
          {
            Key: 'nearDis',
            Value: nearDis,
          },
          {
            Key: 'analyTp',
            Value: analyTp,
          },
          {
            Key: 'weight',
            Value: weight,
          },
          {
            Key: 'outFormat',
            Value: 'JSON',
          },
          {
            Key: 'flowId',
            Value: workFlowId,
          },
        ]
        this.color = 'rgba(39,194,76,1)'
      }
      const { domain, docName } = this.layerSelect._parseUrl(
        this.layerSelect.url
      )

      const opt = {
        flowID: workFlowId,
        domain,
        isAsy: false,
        param,
      }
      try {
        this.showLoading = true
        const res = await Analysis.WorkflowAnalysis.executeWorkflow(opt)
        setTimeout(() => {
          this.getStatus(res)
        }, 1000)
      } catch (error) {
        this.showLoading = false
        this.$message.error('分析失败')
      }
    },

    getStatus(guid) {
      const { domain, docName } = this.layerSelect._parseUrl(
        this.layerSelect.url
      )
      Analysis.WorkflowAnalysis.getWorkflowStatus({
        id: guid,
        domain,
      }).then((status) => {
        if (status === 'Succeeded') {
          this.tab = 'analysisRes'
          Analysis.WorkflowAnalysis.getWorkflowResult({
            id: guid,
            domain,
          }).then((res) => {
            this.showLoading = false
            this.dealWithExecuteRes(res)
          })
        } else if (status === 'Runing') {
          window.setTimeout(() => {
            this.getStatus(guid)
          }, 1000)
        } else {
          this.showLoading = false
          this.$message.error('分析失败')
        }
      })
    },

    showSetting() {
      this.settingDialog = true
    },

    dealWithExecuteRes(result) {
      if (this.$refs.MpNetworkAnalysis) {
        this.drawLayer && this.drawLayer.clearHighLayer()
        this.drawLayer && this.drawLayer.clearResultLayer()
        this.$refs.MpNetworkAnalysis.clearLayer()
        this.$refs.MpNetworkAnalysis.onValueChange(result)
      }
    },

    clearResult() {
      this.drawLayer && this.drawLayer.clearHighLayer()
      this.drawLayer && this.drawLayer.clearResultLayer()
      this.$refs.MpNetworkAnalysis && this.$refs.MpNetworkAnalysis.clearLayer()
    },

    drawHighResult(val) {
      this.highResultSource = val
    },

    drawResult(val) {
      this.result = val
    },

    flyToHigh(val) {
      this.drawLayer && this.drawLayer.flyToHigh(val)
    },

    resetLayer() {
      this.clearClick()
      this.clearMarker()
      this.clearResult()
      // 点集的source
      this.dataCoordinateArr = {
        type: 'FeatureCollection',
        features: [],
      }

      // 点集的source
      this.dataBarrierArr = {
        type: 'FeatureCollection',
        features: [],
      }

      this.highResultSource = { type: 'FeatureCollection', features: [] }

      this.result = {
        layerPoint: { type: 'FeatureCollection', features: [] },
        layerLine: { type: 'FeatureCollection', features: [] },
      }
    },

    setNetWorkLayer() {
      this.networkLayerIndex = null
      this.networkLayerOption = []
      const arr = []
      if (!this.layerSelect.allSublayers) {
        if (this.layerSelect.geomType === 'Net') {
          arr.push({
            title: this.layerSelect.title,
            url: this.layerSelect.gdbps,
          })
        }
      } else {
        this.layerSelect.allSublayers.forEach((item) => {
          if (item.geomType === 'Net') {
            arr.push({
              title: item.title,
              url: item.url,
            })
          }
        })
      }

      if (arr.length > 0) {
        this.networkLayerIndex = 0
        this.networkLayerOption = arr
      }
    },

    deleteRow(rowIndex, type) {
      this.centerMarker = null
      if (type === 'dots') {
        this.$delete(this.dataCoordinateArr.features, rowIndex)
      } else {
        this.$delete(this.dataBarrierArr.features, rowIndex)
      }
    },

    async rowClick(row) {
      const img = await markerIconInstance.unSelectIcon()
      this.centerMarker = {
        name: 'coordinate-marker',
        center: row.geometry.coordinates,
        img,
      }
      if (this.is2DMapMode) {
        this.map.panTo(row.geometry.coordinates)
      } else {
        this.viewer.camera.flyTo({
          destination: this.Cesium.Cartesian3.fromDegrees(
            row.geometry.coordinates[0],
            row.geometry.coordinates[1],
            this.viewer.camera.positionCartographic.height
          ),
        })
      }
    },

    createMarker(val, type) {
      this.clickRadio = val
      this.clickType = type
      if (this.clickType === 'barrier') {
        this.tab = 'hinderArr'
      } else {
        this.tab = 'coordinateArr'
      }
      this.drawComponent && this.drawComponent.openDraw('draw-point')
    },

    clearClick() {
      this.drawComponent && this.drawComponent.closeDraw()
    },

    clickFunciton(e) {
      const obj = this.clickRadio ? { type: this.clickRadio } : {}
      const data = {
        type: 'Feature',
        properties: obj,
        id: UUID.uuid(),
        geometry: {
          type: 'Point',
          coordinates: [e.shape.x, e.shape.y],
        },
      }
      if (this.clickType === 'barrier') {
        this.dataBarrierArr.features.push(data)
      } else {
        this.dataCoordinateArr.features.push(data)
      }
      window.setTimeout(() => {
        this.drawComponent && this.drawComponent.openDraw('draw-point')
      })
    },

    clearMarker() {
      this.dataCoordinateArr = {
        type: 'FeatureCollection',
        features: [],
      }
      this.dataBarrierArr = {
        type: 'FeatureCollection',
        features: [],
      }
      this.centerMarker = null
      this.drawLayer && this.drawLayer.clearDataBarrierArr()
      this.drawLayer && this.drawLayer.clearDataCoordinateArr()
    },
  },
}
</script>

<style lang="less" scoped>
.select-data {
  display: flex;
  /deep/.mapgis-ui-form-item-control {
    width: 100%;
  }
}
/deep/.mapgis-ui-form-item {
  margin-bottom: 5px;
  display: flex;
  .mapgis-ui-col {
    align-items: center;
  }
}
.mapgis-ui-radio-group-default {
  display: flex;
}
</style>

<style lang="less">
.mp-widget-network-analysis {
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  #network-analysis-el {
    width: 300px;
    max-width: 100%;
  }
  .control-button-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    &:last-child {
      margin-bottom: 0;
    }
    .control-button {
      width: calc(~'50% - 2.5px');
    }
  }
  .analysis-actions {
    float: right;
    padding-top: 8px;
  }
}
</style>
