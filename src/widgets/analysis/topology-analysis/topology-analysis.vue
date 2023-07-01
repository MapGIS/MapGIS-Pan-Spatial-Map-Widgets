<template>
  <mapgis-ui-spin :spinning="loading" style="padding: 8px 16px">
    <div class="mp-widget-topology-analysis">
      <mapgis-ui-group-tab
        slot="label"
        title="选择源要素(仅限区要素)"
        :has-top-margin="false"
      >
        <div slot="handle" class="layer-select-container">
          <mapgis-ui-select v-model="tDataIndex" @change="changeTarget">
            <mapgis-ui-select-option
              v-for="(item, index) in layerArrOption"
              :key="index"
              :value="index"
            >
              {{ item.title }}
            </mapgis-ui-select-option>
          </mapgis-ui-select>
          <mapgis-ui-toolbar :bordered="false">
            <mapgis-ui-toolbar-command
              icon="search"
              title="查询要素"
              @click="draw('target')"
            ></mapgis-ui-toolbar-command>
          </mapgis-ui-toolbar>
        </div>
      </mapgis-ui-group-tab>
      <mapgis-ui-setting-form
        layout="vertical"
        :class="[isFullScreen === true ? '' : 'fixed-table']"
      >
        <mapgis-ui-form-item>
          <div class="tab-list-container">
            <mapgis-ui-tabs
              size="small"
              :style="{ height: '100%' }"
              tab-position="left"
              v-model="tDataTab"
              v-if="tDataArr.length > 0"
            >
              <mapgis-ui-tab-pane
                v-for="item in tDataArr"
                :key="item.id"
                :tab="item.name"
              >
                <feature-list
                  type="target"
                  :params="item"
                  :active="tDataTab === item.id"
                  @select-item="(val) => selectItem(val, 'Target')"
                />
              </mapgis-ui-tab-pane>
            </mapgis-ui-tabs>
            <mapgis-ui-empty v-else description="请点击搜索按钮查询要素" />
          </div>
        </mapgis-ui-form-item>
      </mapgis-ui-setting-form>
      <mapgis-ui-group-tab
        slot="label"
        title="选择目标要素"
        :has-top-margin="false"
      >
        <div slot="handle" class="layer-select-container">
          <mapgis-ui-select v-model="aDataIndex" @change="changeAnalysis">
            <mapgis-ui-select-option
              v-for="(item, index) in layerArrOption"
              :key="index"
              :value="index"
            >
              {{ item.title }}
            </mapgis-ui-select-option>
          </mapgis-ui-select>
          <mapgis-ui-toolbar :bordered="false">
            <mapgis-ui-toolbar-command
              icon="search"
              title="查询要素"
              @click="draw('analysis')"
            ></mapgis-ui-toolbar-command>
          </mapgis-ui-toolbar>
        </div>
      </mapgis-ui-group-tab>
      <mapgis-ui-setting-form
        layout="vertical"
        :class="[isFullScreen === true ? '' : 'fixed-table']"
      >
        <mapgis-ui-form-item>
          <div class="tab-list-container">
            <mapgis-ui-tabs
              size="small"
              :style="{ height: '100%' }"
              tab-position="left"
              v-model="aDataTab"
              v-if="aDataArr.length > 0"
            >
              <mapgis-ui-tab-pane
                v-for="item in aDataArr"
                :key="item.id"
                :tab="item.name"
              >
                <feature-list
                  :params="item"
                  :active="aDataTab === item.id"
                  @select-item="(val) => selectItem(val, 'Analysis')"
                />
              </mapgis-ui-tab-pane>
            </mapgis-ui-tabs>
            <mapgis-ui-empty v-else description="请点击搜索按钮查询要素" />
          </div>
        </mapgis-ui-form-item>
      </mapgis-ui-setting-form>
      <div class="analysis-actions">
        <mapgis-ui-tag color="#87d068" v-if="massage">
          {{ massage }}
        </mapgis-ui-tag>
        <mapgis-ui-button type="primary" @click="analysis">
          分析
        </mapgis-ui-button>
      </div>
      <template v-if="isWidgetOpen">
        <mapbox-layer
          v-if="is2DMapMode"
          ref="mapboxLayer"
          :geoJSONTarget="geoJSONTarget"
          :geoJSONAnalysis="geoJSONAnalysis"
        />
        <cesium-layer
          v-else
          ref="cesiumLayer"
          :geoJSONTarget="geoJSONTarget"
          :geoJSONAnalysis="geoJSONAnalysis"
        ></cesium-layer>
      </template>
      <mp-draw-pro ref="draw" @finished="clickFunciton" />
      <mp-3d-draw-pro ref="draw3d" @finished="clickFunciton" />
    </div>
  </mapgis-ui-spin>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  UUID,
  IGSMapImageLayer,
  IGSVectorLayer,
  IGSScene,
  baseConfigInstance,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import mapboxLayer from './map-layer/mapbox-layer.vue'
import cesiumLayer from './map-layer/cesium-layer'
import featureList from './feature-list.vue'
import * as Zondy from '@mapgis/webclient-es6-service'
import axios from 'axios'

export default {
  name: 'MpTopologyAnalysis',
  mixins: [WidgetMixin],
  components: {
    mapboxLayer,
    cesiumLayer,
    featureList,
  },

  data() {
    return {
      queryType: 'target',
      tDataIndex: null,
      aDataIndex: null,
      tDataArr: [],
      aDataArr: [],
      tDataTab: '',
      aDataTab: '',
      isFullScreen: false,
      loading: false,
      massage: '',
      geoJSONTarget: null,
      geoJSONAnalysis: null,
      isWidgetOpen: false,
    }
  },

  computed: {
    drawLayer() {
      return this.is2DMapMode ? this.$refs.mapboxLayer : this.$refs.cesiumLayer
    },

    drawComponent() {
      return this.is2DMapMode ? this.$refs.draw : this.$refs.draw3d
    },

    // 目标类
    tData() {
      if (this.tDataIndex !== null) {
        return this.layerArrOption[this.tDataIndex]
      }
      return null
    },

    // 分析类
    aData() {
      if (this.aDataIndex !== null) {
        return this.layerArrOption[this.aDataIndex]
      }
      return null
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
    // 微件窗口模式切换时回调
    onWindowSize(mode) {
      this.isFullScreen = mode === 'max'
    },

    onOpen() {
      this.isWidgetOpen = true
    },

    documentChange(val: Array<unknown>) {
      this.aDataIndex = null
      this.tDataIndex = null
      this.layerArrOption = []
      this.changeTarget()
      this.changeAnalysis()
      const arr = []
      val.layers().forEach((data) => {
        if (
          data.type === LayerType.IGSMapImage ||
          data.type === LayerType.IGSVector ||
          data.type === LayerType.IGSScene
        ) {
          arr.push(data)
        }
      })
      if (arr.length > 0) {
        this.layerArrOption = arr
        this.aDataIndex = 0
        this.tDataIndex = 0
      }
    },

    selectItem(geoJSON, type) {
      if (type === 'Target') {
        this.geoJSONTarget = geoJSON
      } else {
        this.geoJSONAnalysis = geoJSON
      }
    },

    changeTarget() {
      this.tDataArr = []

      this.tDataTab = ''

      this.massage = ''

      this.geoJSONTarget = null
    },

    changeAnalysis() {
      this.aDataArr = []

      this.aDataTab = ''

      this.massage = ''

      this.geoJSONAnalysis = null
    },

    draw(type) {
      this.queryType = type
      this.drawComponent && this.drawComponent.openDraw('draw-rectangle')
    },

    clickFunciton(e) {
      if (this.queryType === 'target') {
        this.tDataArr = []
        this.tDataTab = ''
      } else {
        this.aDataArr = []
        this.aDataTab = ''
      }
      const { xmin, ymin, xmax, ymax } = e.shape
      const geo = new Zondy.Common.Rectangle(xmin, ymin, xmax, ymax)
      const layer = this.queryType === 'target' ? this.tData : this.aData
      if (layer) {
        if (layer.type === LayerType.IGSMapImage) {
          this.queryFeaturesByDoc(layer, geo)
        } else if (layer.type === LayerType.IGSVector) {
          this.queryFeaturesByVector(layer, geo)
        } else if (layer.type === LayerType.IGSScene) {
          this.queryFeaturesByIGSScene(layer, geo)
        }
      }
    },

    queryFeaturesByDoc(layer: IGSMapImageLayer, geometry) {
      if (!layer.isVisible) {
        return
      }
      const { domain, docName } = layer._parseUrl(layer.url)

      const arr = []
      const sublayers = layer.allSublayers
      sublayers.forEach((sublayer) => {
        if (
          !sublayer.visible ||
          (sublayer.sublayers && sublayer.sublayers.length > 0)
        ) {
          return
        }
        arr.push({
          id: sublayer.id,
          name: sublayer.title,
          domain,
          ip: baseConfigInstance.config.ip,
          port: Number(baseConfigInstance.config.port),
          serverType: layer.type,
          layerIndex: sublayer.id,
          serverName: docName,
          serverUrl: layer.url,
          geometry: geometry,
        })
      })
      if (this.queryType === 'target') {
        this.tDataArr = arr
        this.tDataTab = arr.length > 0 ? arr[0].id : ''
      } else {
        this.aDataArr = arr
        this.aDataTab = arr.length > 0 ? arr[0].id : ''
      }
    },

    queryFeaturesByVector(layer: IGSVectorLayer, geometry) {
      if (!layer.isVisible) {
        return
      }
      const { domain, docName } = layer._parseUrl(layer.url)

      const arr = [
        {
          ip: baseConfigInstance.config.ip,
          port: Number(baseConfigInstance.config.port),
          domain,
          serverType: layer.type,
          gdbp: layer.gdbps,
          geometry: geometry,
          name: layer.title,
        },
      ]
      if (this.queryType === 'target') {
        this.tDataArr = arr
        this.tDataTab = arr.length > 0 ? arr[0].id : ''
      } else {
        this.aDataArr = arr
        this.aDataTab = arr.length > 0 ? arr[0].id : ''
      }
    },

    queryFeaturesByIGSScene(layer: IGSScene, geometry) {
      if (!layer.isVisible) {
        return
      }
      debugger
      const { domain, docName } = layer._parseUrl(layer.url)

      const layerConfig = dataCatalogManagerInstance.getLayerConfigByID(
        layer.id
      )
      let arr = []
      if (layerConfig && layerConfig.bindData) {
        // if (!layerConfig.bindData.title) {
        //   layerConfig.bindData.title = layerConfig.bindData.serverName
        // }
        // arr.push(layerConfig.bindData)
        arr = [
          {
            ip: baseConfigInstance.config.ip,
            port: Number(baseConfigInstance.config.port),
            domain: 'http://192.168.1.131:8089',
            serverType: layer.type,
            gdbp: layerConfig.bindData.gdbps,
            geometry: geometry,
            name: layer.title,
          },
        ]
      }

      // const arr = [
      //   {
      //     ip: baseConfigInstance.config.ip,
      //     port: Number(baseConfigInstance.config.port),
      //     domain,
      //     serverType: layer.type,
      //     gdbp: layer.gdbps,
      //     geometry: geometry,
      //     name: layer.title,
      //   },
      // ]
      if (this.queryType === 'target') {
        this.tDataArr = arr
        this.tDataTab = arr.length > 0 ? arr[0].id : ''
      } else {
        this.aDataArr = arr
        this.aDataTab = arr.length > 0 ? arr[0].id : ''
      }
    },

    async analysis() {
      if (this.geoJSONAnalysis && this.geoJSONTarget) {
        this.loading = true
        this.massage = ''
        const target = this.geoJSONTarget.features[0].properties
        const analysis = this.geoJSONAnalysis.features[0].properties
        if (target.ftype === 'Entity') {
          const srcInfo1 = this.tDataArr[0].gdbp
          const srcInfo2 = this.aDataArr[0].gdbp
          const FID1 = target.FID
          const FID2 = analysis.FID
          await this.topology3d(srcInfo1, srcInfo2, FID1, FID2)
        } else {
          const { ip, port } = baseConfigInstance.config
          let analysisService
          if (target.ftype === 1) {
            const targetGeom = target.fGeom.PntGeom[0]
            analysisService = new Zondy.MRGS.TopAnalysis({
              relativeObj: targetGeom,
              ip,
              port,
            })
          } else if (target.ftype === 2) {
            const targetGeom = target.fGeom.LinGeom[0]
            analysisService = new Zondy.MRGS.TopAnalysis({
              relativeObj: targetGeom,
              ip,
              port,
            })
          } else if (analysis.ftype === 3) {
            const targetGeom = target.fGeom.RegGeom[0]
            analysisService = new Zondy.MRGS.TopAnalysis({
              relativeObj: targetGeom,
              ip,
              port,
            })
          }
          if (analysis.ftype === 1) {
            const analysisGeom = analysis.fGeom.PntGeom[0]
            analysisService.setPnt(analysisGeom)
          } else if (analysis.ftype === 2) {
            const analysisGeom = analysis.fGeom.LinGeom[0]
            analysisService.setLine(analysisGeom)
          } else if (analysis.ftype === 3) {
            const analysisGeom = analysis.fGeom.RegGeom[0]
            analysisService.setReg(analysisGeom)
          }
          analysisService.execute(
            (res) => {
              let msg = ''
              if (res === 'Include') {
                msg = '包含'
              } else if (res === 'Disjoin') {
                msg = '相离'
              } else if (res === 'Intersect') {
                msg = '相交'
              } else {
                msg = '相邻'
              }
              this.loading = false
              this.massage = `分析结果: ${msg}`
            },
            () => {
              this.loading = false
            }
          )
        }
      } else {
        this.$message.error('未选择要素')
      }
    },
    /**
     * 三维体对象之间的包含、相交、相离等空间关系判定
     * @param srcInfo1 维体对象简单要素类1
     * @param srcInfo2 维体对象简单要素类2
     * @param FID1 图元OID1
     * @param FID2 图元OID2
     * @return
     */
    async topology3d(srcInfo1, srcInfo2, FID1, FID2) {
      const res = await this.topology3dpromise({
        srcInfo1,
        srcInfo2,
        FID1,
        FID2,
      })
      console.log(res)
      const msg = res.results[0].Value
      this.loading = false
      this.massage = `分析结果: ${msg}`
    },

    topology3dpromise(options) {
      const keys = Object.keys(options)
      const paramArr = []
      for (let i = 0; i < keys.length; i++) {
        const param = {
          Key: keys[i],
          Value: options[keys[i]],
        }
        paramArr.push(param)
      }
      const url =
        'http://192.168.1.131:8089/igs/rest/mrfws/execute/600368?isAsy=false&f=json'
      const promise = new Promise((resolve, reject) => {
        axios.post(url, paramArr).then((res) => {
          const { data } = res
          if (!data) {
            resolve(undefined)
          } else {
            resolve(data)
          }
        })
      })
      return promise.then((data) => {
        return data
      })
    },

    // 面板关闭时候触发函数
    onClose() {
      this.isWidgetOpen = false
      this.drawComponent.clear()
      this.reset()
    },

    reset() {
      this.queryType = 'target'

      // this.tDataIndex = null

      // this.aDataIndex = null

      this.tDataArr = []

      this.aDataArr = []

      this.tDataTab = ''

      this.aDataTab = ''

      this.isFullScreen = false

      this.loading = false

      this.massage = ''

      this.geoJSONTarget = null

      this.geoJSONAnalysis = null
    },
  },
}
</script>

<style lang="scss">
.mp-widget-topology-analysis {
  .fixed-table {
    // width: 360px;
  }
  .tab-list-container {
    border-radius: 4px;
    height: 180px;
    border: 1px solid $border-color;
    display: flex;
    flex-direction: column;
    justify-content: center;
    .mapgis-ui-tabs {
      .mapgis-ui-tabs-left-content {
        padding-left: 8px;
      }
      .mapgis-ui-tabs-left-bar .mapgis-ui-tabs-tab {
        text-align: center;
        margin: 0;
        padding: 6px 8px;
        width: 120px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 12px;
      }
    }
  }
  .layer-select-container {
    display: flex;
    .mapgis-ui-select {
      width: 108px;
    }
    .mapgis-ui-btn {
      margin-left: 10px;
    }
  }
  .mapgis-ui-select {
    font-size: 12px;
  }
  .analysis-actions {
    float: right;
  }
}
</style>
