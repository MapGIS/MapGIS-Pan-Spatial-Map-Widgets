<template>
  <div class="mp-widget-add-data">
    <ul class="top-tab-nav">
      <li
        v-for="{ key, label } in tabs"
        :key="key"
        :class="[key === tab ? 'active-color' : '']"
        @click="tab = key"
      >
        {{ label }}
      </li>
    </ul>
    <template v-if="loaded">
      <add-data-list
        ref="refAddDataList"
        v-show="tab === 'list'"
        :data-list="dataList"
        :dataTypes="dataTypes"
        :categories="categories"
        @save="onSaveData"
        @add-layer="onAddLayer"
        @remove-layer="onRemoveLayer"
        @add-category="onAddCategory"
      />
      <add-data-url
        v-show="tab === 'url'"
        :url-data-types="urlDataTypes"
        :categories="categories"
        @added="onAddData"
      ></add-data-url>
      <add-data-file
        v-show="tab === 'file'"
        :file-data-types="fileDataTypes"
        :categories="categories"
        :config="config"
        @added="onAddData"
      >
      </add-data-file>
    </template>
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  UUID,
  ObjectUtil,
  LayerType,
  LoadStatus,
  Document,
  FitBound,
  api,
  dataCatalogManagerInstance,
  DataCatalogManager,
  eventBus,
  events,
} from '@mapgis/web-app-framework'

import AddDataList from './components/AddDataList.vue'
import AddDataUrl from './components/AddDataUrl.vue'
import AddDataFile from './components/AddDataFile.vue'
import axios from 'axios'

export default {
  name: 'MpAddData',
  mixins: [WidgetMixin],
  components: {
    AddDataList,
    AddDataUrl,
    AddDataFile,
  },

  data() {
    return {
      tab: 'list',
      tabs: [
        { key: 'list', label: '数据列表' },
        { key: 'url', label: 'URL' },
        { key: 'file', label: '文件' },
      ],
      // private config
      config: {},
      loaded: false,
      commonDataTypes: [
        {
          text: 'WMS服务',
          value: 'OGCWMS',
          example: 'http://<server>:<port>/igs/rest/ogc/doc/beijing/WMSServer',
        },
        {
          text: 'WMTS服务',
          value: 'OGCWMTS',
          example: 'http://<server>:<port>/igs/rest/ogc/beijing/WMTSServer',
        },
        {
          text: '矢量瓦片服务',
          value: 'VectorTile',
          example:
            'http://<server>:<port>/igs/rest/mrms/vtiles/styles/街道-墨卡托.json',
        },
        {
          text: 'ArcGIS地图服务',
          value: 'ArcGISMapImage',
          example:
            'http://<server>:<port>/arcgis/rest/services/ServiceRequest/MapServer',
        },
        {
          text: 'ArcGIS瓦片服务',
          value: 'ArcGISTile',
          example:
            'http://<server>:<port>/arcgis/rest/services/ServiceRequest/MapServer',
        },
        {
          text: '栅格瓦片服务',
          value: 'IGSTile',
          example: 'http://<server>:<port>/igs/rest/mrms/tile/{tileName}',
        },
        {
          text: '地图服务',
          value: 'IGSMapImage',
          example: 'http://<server>:<port>/igs/rest/mrms/docs/{docName}',
        },
        {
          text: '图层地图服务',
          value: 'IGSVector',
          example: 'http://<server>:<port>/igs/rest/mrms/layers?gdbps={gdbps}',
        },
        {
          text: 'GEOJSON',
          value: 'GeoJson',
          example:
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
        },
      ],
      isZoomLayer: false,
      dataCatalogManager: dataCatalogManagerInstance,
    }
  },

  computed: {
    urlDataTypes2D() {
      return [...this.commonDataTypes]
    },

    fileDataTypes2D() {
      return [
        { text: 'GeoTIFF数据', value: 'TIF' },
        { text: 'Esri Shapefile', value: 'SHP' },
        { text: 'MapGIS 6X 工作区文件', value: '6X' },
        { text: 'GeoJSON数据', value: 'GeoJson' },
      ]
    },

    dataTypes2D() {
      return [...this.commonDataTypes]
    },

    urlDataTypes3D() {
      return [...this.commonDataTypes, ...this.cesiumDataTypes3D]
    },

    fileDataTypes3D() {
      return [
        { text: 'KML', value: 'KML' },
        { text: 'KMZ', value: 'KMZ' },
        { text: 'CZML', value: 'CZML' },
      ]
    },

    cesiumDataTypes3D() {
      return [
        {
          text: '场景服务',
          value: 'IGSScene',
          example: 'http://<server>:<port>/igs/rest/g3d/{modelName}',
        },
        {
          text: '三维图层地图服务',
          value: 'IGSVector3D',
          example: 'http://<server>:<port>/igs/rest/mrms/layers?gdbps={gdbps}',
        },
        {
          text: 'KML',
          value: 'KML',
          example: 'http://<server>:<port>/FileName.kml',
        },
        {
          text: 'KMZ',
          value: 'KMZ',
          example: 'http://<server>:<port>/FileName.kmz',
        },
        {
          text: 'CZML',
          value: 'CZML',
          example: 'http://<server>:<port>/FileName.czml',
        },
      ]
    },

    dataTypes3D() {
      return [...this.commonDataTypes, ...this.cesiumDataTypes3D]
    },

    dataTypes() {
      return this.is2DMapMode ? this.dataTypes2D : this.dataTypes3D
    },

    urlDataTypes() {
      return this.is2DMapMode ? this.urlDataTypes2D : this.urlDataTypes3D
    },

    fileDataTypes() {
      // 目前暂不支持kml、kmz、czml类型文件上传出图、所以暂时隐藏这三种上传文件类型
      return this.is2DMapMode
        ? this.fileDataTypes2D
        : [...this.fileDataTypes2D, ...this.fileDataTypes3D]
      // return this.fileDataTypes2D
    },

    dataList() {
      return this.config && this.config.data
    },

    categories() {
      return this.dataList.map((item) => {
        return { name: item.name, description: item.description }
      })
    },
  },

  mounted() {
    if (this.widgetInfo.config.data) {
      this.widgetInfo.config.data.forEach((category) => {
        category.children.forEach((item) => {
          item.id = UUID.uuid()
          item.visible = false
        })
      })
    } else {
      this.$set(this.widgetInfo.config, 'data', [])
    }

    this.config = this.widgetInfo.config
    this.loaded = true

    eventBus.$on(events.ADD_DATA_EVENT, this.onAddData)
    eventBus.$on(events.DELETE_DATA_EVENT, this.onDeleteData)
  },

  methods: {
    onAddCategory({ name, description }) {
      this.dataList.push({ name, description, children: [] })
    },

    onAddData({ name, description, data, isZoom = false }) {
      this.isZoomLayer = isZoom

      // 检查是否有编辑状态的数据
      const flag = this.$refs.refAddDataList.checkCategoryDatalistSave()
      if (!flag) return

      const isRepeat = this.isRepeatedService(data)

      if (isRepeat) {
        this.$message.warn('目录树中已存在相同地址的数据')
        return
      }

      let categoryDataList = this.dataList.find(
        (category) => category.name === name
      )

      if (!categoryDataList) {
        categoryDataList = { name, description, children: [] }
        this.dataList.push(categoryDataList)
      }

      // 检查是否存在相同URL的数据
      if (categoryDataList.children.some((val) => val.url === data.url)) {
        this.$message.warn('当前分类中已存在相同地址的数据')
        return
      }
      data.id = UUID.uuid()
      data.visible = false
      categoryDataList.children.unshift({
        ...data,
      })
      // 跳转到数据列表
      this.tab = 'list'
      this.$refs.refAddDataList.selectData(name, data)
    },

    onDeleteData({ name, description, data }) {
      const categoryDataList = this.dataList.find(
        (category) => category.name === name
      )

      if (!categoryDataList || !categoryDataList.children) {
        return
      }

      const { children } = categoryDataList
      for (let i = 0; i < children.length; i++) {
        const item = children[i]
        if (item.srcLayer && item.srcLayer === data.srcLayer) {
          this.onRemoveLayer(item)
          this.deleteGdbp(item.url)
          children.splice(i, 1)
        }
      }
    },

    deleteGdbp(url) {
      // http://localhost:8089/igs/rest/services/system/ResourceServer/datasources/{datasource}/gdbs/{gdb}/sfcls/{name}
      // http://${ip}:${port}/igs/rest/mrms/layers?gdbps=${this.destLayer}
      // gdbp://MapGisLocal/专题图数据/sfcls/省级行政区xbuffer1
      const domain = url.split('/igs/rest')[0]
      const gdbp = url.split('gdbps=')[1]
      const strs = gdbp.split('/sfcls/')
      const name = strs[1]
      const subStrs = strs[0].split('/')
      const datasource = subStrs[2]
      const gdb = subStrs[3]
      const deletUrl = `${domain}/igs/rest/services/system/ResourceServer/datasources/${datasource}/gdbs/${gdb}/sfcls/${name}`
      axios.delete(deletUrl).then((res) => {
        console.log(res.data)
      })
    },

    onSaveData() {
      const this_ = this

      const savedConfig = ObjectUtil.deepClone(this.config)
      savedConfig.data.forEach((category) => {
        category.children.forEach((item) => {
          this.$delete(item, 'id')
          this.$delete(item, 'visible')
        })
      })

      api
        .saveWidgetConfig({
          name: 'add-data',
          config: JSON.stringify(savedConfig),
        })
        .then(() => {
          this_.$message.success('保存成功')
        })
        .catch(() => {
          this_.$message.error('保存失败')
        })
    },

    async onAddLayer(data) {
      const { Cesium, map, viewer, vueCesium } = this
      const layerConfig = {
        name: data.name,
        guid: data.id,
        serverURL: data.url,
        serverType: this.parseIssueType(data.type),
        ...data,
      }
      if (data.token) {
        layerConfig.tokenKey = data.tokenKey ? data.tokenKey : 'token'
        layerConfig.tokenValue = data.token
      }

      const layer = DataCatalogManager.generateLayerByConfig(layerConfig)
      if (layer) {
        try {
          if (layer.loadStatus === LoadStatus.notLoaded) {
            await layer.load()
          }
        } catch (error) {
          console.log(error)
        } finally {
          if (layer.loadStatus === LoadStatus.loaded) {
            if (
              layer.type === LayerType.IGSScene &&
              this.is2DMapMode === true
            ) {
              this.switchMapMode()
            }
            this.document.defaultMap.add(layer)

            if (this.isZoomLayer) {
              if (layer.type !== LayerType.IGSScene) {
                FitBound.fitBoundByLayer(
                  layer,
                  {
                    Cesium,
                    map,
                    viewer,
                    vueCesium,
                  },
                  this.is2DMapMode === true
                )
              }

              this.isZoomLayer = false
            }
          } else {
            this.$message.error(`图层:${layer.title}加载失败`)
            this.$refs.refAddDataList.unSelectData(layer.id)
          }
        }
      }
    },

    onRemoveLayer(data) {
      const layer = this.document.defaultMap.findLayerById(data.id)

      this.document.defaultMap.remove(layer)
    },

    parseIssueType(typeString: string): LayerType {
      const type = LayerType[typeString]
      if (type === undefined) {
        return LayerType.Unknown
      }

      return type
    },

    // 判断添加的数据在目录树中是否已存在
    isRepeatedService(data) {
      return this.dataCatalogManager.hasRepeatedService(data)
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-add-data {
  padding: 8px 16px;
  flex: 1 1 0%;
  min-height: 76px;
  display: flex;
  flex-direction: column;
  .top-tab-nav {
    flex-shrink: 0;
    list-style: none;
    display: flex;
    height: 28px;
    margin: 0;
    padding: 0;
    margin-bottom: 8px;
    border-bottom: 1px $border-color solid;
    li {
      height: 100%;
      padding: 0 5px;
      margin-right: 21px;
      border-bottom: 2px transparent solid;
      &:hover {
        color: $primary-color;
        cursor: pointer;
      }
    }
    .active-color {
      border-bottom-color: $primary-color;
    }
  }
}
</style>
