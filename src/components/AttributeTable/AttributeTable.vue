<template>
  <div ref="attributeTable" :id="id" class="mp-attribute-table">
    <mapgis-ui-toolbar class="header-bar" size="small" :bordered="false">
      <div class="title">
        {{ selectedDescription }}
      </div>
      <mapgis-ui-switch
        checked-children="范围过滤"
        un-checked-children="范围过滤"
        v-model="filterWithMap"
        size="small"
        style="margin: 0 8px"
      />
      <mapgis-ui-switch
        checked-children="高亮已选择"
        un-checked-children="高亮已选择"
        v-model="hightlightSelection"
        size="small"
        style="margin: 0 8px"
      />
      <mapgis-ui-toolbar-command
        title="缩放至已选择"
        icon="environment"
        @click="onZoomTo"
      />
      <mapgis-ui-toolbar-command
        title="清除选择"
        icon="close-square"
        @click="onClearSelection"
      />
      <mapgis-ui-toolbar-space />
      <mapgis-ui-dropdown class="download-dropdown">
        <mapgis-ui-menu slot="overlay" @click="handleMenuClick">
          <mapgis-ui-menu-item key="jsonData">
            导出json文件
          </mapgis-ui-menu-item>
          <mapgis-ui-menu-item key="csvData"> 导出csv文件 </mapgis-ui-menu-item>
        </mapgis-ui-menu>
        <mapgis-ui-button
          class="download-button"
          style="
            margin: 0 13px;
            border: 1px solid transparent;
            height: 25px !important;
            padding: 2px 0 0;
          "
        >
          <mapgis-ui-ant-icon type="download" />
        </mapgis-ui-button>
      </mapgis-ui-dropdown>
      <mapgis-ui-toolbar-command
        title="属性统计"
        icon="bar-chart"
        @click="onStatistics"
      />
      <mapgis-ui-toolbar-command
        title="过滤器"
        icon="filter"
        @click="onFilter"
      />
      <mapgis-ui-divider type="vertical" />
      <mapgis-ui-toolbar-command
        title="刷新"
        :icon="loading ? 'loading' : 'reload'"
        @click="onRefresh"
      />
      <mp-attribute-table-column-setting
        v-if="tableColumns.length"
        :columns="tableColumns"
      />
      <mapgis-ui-toolbar-command
        title="全屏"
        :icon="fullScreen ? 'fullscreen-exit' : 'fullscreen'"
        @click="onToggleScreen"
      />
    </mapgis-ui-toolbar>
    <mapgis-ui-table
      :id="tableId"
      bordered
      size="small"
      :columns="visibleColumns"
      :data-source="tableData"
      :loading="loading"
      :rowSelection="{
        selectedRowKeys: selectedRowKeys,
        onChange: onSelectChange,
        type: 'checkbox',
        fixed: true,
        columnWidth: '50px',
      }"
      :rowKey="(row) => row.properties[rowKey]"
      :scroll="{
        x: useScrollX ? '100%' : false,
        y: scrollY,
      }"
      :pagination="false"
      :customRow="
        (record) => ({
          on: {
            click: () => onRowClick(record),
            dblclick: () => onRowDblclick(record),
          },
        })
      "
    >
    </mapgis-ui-table>
    <div
      style="text-align: right; padding: 5px 10px 5px 0"
      v-if="tableData && tableData.length > 0"
    >
      <mapgis-ui-pagination
        size="small"
        :total="pagination.total"
        :show-total="showPaginationTotal"
        :page-size-options="pagination.pageSizeOptions"
        :page-size="pagination.pageSize"
        :current="pagination.current"
        show-size-changer
        show-quick-jumper
        @showSizeChange="onPaginationShowSizeChange"
        @change="onPaginationChange"
      >
      </mapgis-ui-pagination>
    </div>
    <mp-marker-plotting
      v-if="is2DMapMode && !isIGSScence && !isModelCacheLayer"
      ref="refMarkerPlotting"
      :markers="markers"
      :filter-with-map="filterWithMap"
      :fit-bound="fitBound"
      :selection-bound="selectionBound"
      :highlight-style="highlightStyle"
      :popup-anchor="popupAnchor"
      :popup-toggle-type="popupToggleType"
      :selected-markers="selectedMarkers"
      :marker-show-type="markerShowType"
      @map-bound-change="onGetGeometry"
    />
    <mp-3d-marker-plotting
      v-else
      ref="ref3dMarkerPlotting"
      :markers="markers"
      :filter-with-map="filterWithMap"
      :fit-bound="fitBound"
      :selection-bound="selectionBound"
      :highlight-style="highlightStyle"
      :popup-anchor="popupAnchor"
      :popup-toggle-type="popupToggleType"
      :popup-width="popupWidth"
      :selected-markers="selectedMarkers"
      :marker-show-type="markerShowType"
      @map-bound-change="onGetGeometry"
      @currentId="updateCurrentMarkerId"
    >
      <template slot="popup" slot-scope="{ properties, marker }">
        <!-- <mapgis-3d-popup-iot
          :properties="properties"
          :dataStoreIp="dataStoreIp"
          :dataStorePort="dataStorePort"
          :getProjectorStatus="getProjectorStatus"
          @project-screen="projectScreen"
        /> -->
        <component
          v-if="currentId === marker.markerId"
          :is="popupComponent"
          :properties="properties"
          :dataStoreIp="dataStoreIp"
          :dataStorePort="dataStorePort"
          :getProjectorStatus="getProjectorStatus"
          v-bind="popupOption"
          @project-screen="projectScreen"
        />
      </template>
    </mp-3d-marker-plotting>
    <mp-window-wrapper :visible="showAttrStatistics">
      <template v-slot:default="slotProps">
        <mp-window
          :id="statisticsId"
          title="属性统计"
          :width="500"
          :height="330"
          :bottom="10"
          :verticalOffset="10"
          :visible.sync="showAttrStatistics"
          anchor="top-center"
          v-bind="slotProps"
        >
          <template>
            <mp-attribute-statistics
              v-if="currentTableParams"
              :queryParams="statisticAndFilterParamas"
            />
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>
    <mp-window-wrapper :visible="showFilter">
      <template v-slot:default="slotProps">
        <mp-window
          :id="filterId"
          title="过滤器"
          :width="600"
          :height="320"
          :verticalOffset="10"
          :visible.sync="showFilter"
          anchor="top-center"
          v-bind="slotProps"
        >
          <template>
            <mp-filter
              v-if="currentTableParams"
              :queryParams="statisticAndFilterParamas"
              @finish="onUpdateWhere"
            />
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>
  </div>
</template>

<script lang="ts">
import {
  baseConfigInstance,
  markerIconInstance,
  DataFlowList,
  ActiveResultSet,
  SelectedResultSet,
  DomUtil,
  AppMixin,
  ExhibitionMixin,
  LayerType,
  UUID,
  MapMixin,
  Rectangle3D,
  Feature,
  Objects,
  Exhibition,
  eventBus,
  events,
} from '@mapgis/web-app-framework'
import * as Zondy from '@mapgis/webclient-es6-service'
import MpAttributeTableColumnSetting from './AttributeTableColumnSetting.vue'
import axios from 'axios'
/* 文件导出 */
import FileSaver from 'file-saver'
import AttributeUtil from './mixin/AttributeUtil'

const { GFeature, FeatureQuery, ArcGISFeatureQuery } = Feature

const { IAttributeTableOption, IAttributeTableExhibition } = Exhibition

export default {
  name: 'MpAttributeTable',
  components: {
    MpAttributeTableColumnSetting,
  },
  mixins: [AttributeUtil],
  provide() {
    return {
      popupShowType: baseConfigInstance.config.popupShowType,
    }
  },
  props: {
    // 属性表选项
    exhibition: {
      type: IAttributeTableExhibition,
    },
    // 属性表选项
    option: {
      type: IAttributeTableOption,
    },
  },
  computed: {
    selectedRowKeys() {
      return this.selection.map(
        (item) => (item as GFeature).properties[this.rowKey]
      )
    },
    dataStoreIp() {
      return baseConfigInstance.config.DataStoreIp
    },
    dataStorePort() {
      return baseConfigInstance.config.DataStorePort
    },
    popupAnchor() {
      return baseConfigInstance.config.colorConfig.label.image.popupAnchor
    },
    popupToggleType() {
      return baseConfigInstance.config.colorConfig.label.image.popupToggleType
    },
    selectedDescription() {
      const length = this.selectedRowKeys.length

      return `${length} 已选择`
    },
    optionVal() {
      return this.option || this.exhibition.option
    },
    visibleColumns() {
      return this.tableColumns.filter((col) => col.visible)
    },
    highlightStyle() {
      return baseConfigInstance.config.colorConfig
    },
    markerPlottingComponent() {
      return this.is2DMapMode
        ? this.$refs.refMarkerPlotting
        : this.$refs.ref3dMarkerPlotting
    },
    dataFlowList() {
      return DataFlowList
    },
    getDataFLowList() {
      const { serverType } = this.optionVal
      if (serverType === LayerType.DataFlow) {
        const features = this.dataFlowList.getDataFlowById(this.optionVal.id)
        return features || []
      }
      return []
    },
    isIGSScence() {
      const { serverType } = this.optionVal
      return serverType === LayerType.IGSScene
    },
    isModelCacheLayer() {
      const { serverType } = this.optionVal
      return serverType === LayerType.ModelCache
    },
    popupWidth() {
      return Number(this.exhibition?.popupOption?.componentWidth || 280)
    },
    popupComponent() {
      return this.exhibition?.popupOption?.component || 'mapgis-3d-popup-iot'
    },
    popupOption() {
      return this.exhibition?.popupOption
    },
    // marker几何高亮类型，hover表示鼠标放到标注上高亮，default表示显示标注的时候就高亮
    markerShowType() {
      return this.hightlightSelection ? 'default' : 'hover'
    },
  },
  watch: {
    getDataFLowList: {
      deep: true,
      handler(newVal, oldVal) {
        if (!newVal || !newVal.length) {
          return
        }
        this.clearSelection()
        this.removeMarkers()
        this.tableData = []
        this.tableColumns = []
        this.query()
      },
    },
    optionVal: {
      deep: true,
      immediate: true,
      handler() {
        this.clearSelection()
        this.removeMarkers()
        this.tableData = []
        this.tableColumns = []
        this.query()
      },
    },
  },

  created() {
    DomUtil.addFullScreenListener(this.fullScreenListener)
    // this.sceneController = Objects.SceneController.getInstance(
    //   this.Cesium,
    //   this.vueCesium,
    //   this.viewer
    // )
  },

  beforeDestroy() {
    DomUtil.removeFullScreenListener(this.fullScreenListener)
  },
  methods: {
    onResize() {
      this.calcTableScrollY()
    },
    async onActive() {
      await this.addMarkers()
      await this.hightlightSelectionMarkers()
    },
    onDeActive() {
      this.showFilter = false
      this.showAttrStatistics = false
      this.removeMarkers()
    },
    onClose() {
      // 下面无法隐藏窗口
      // this.showFilter = false
      // this.showAttrStatistics = false
      // 直接设置窗口的style
      document.getElementById(this.filterId).style.display = 'none'
      document.getElementById(this.statisticsId).style.display = 'none'

      this.removeMarkers()
    },
    async onSelectChange(selectedRowKeys, selectedRows) {
      this.selection = selectedRows
      if (this.selectedRowKeys.length == 0) {
        ActiveResultSet.activeResultSet = {}
        SelectedResultSet.selectedResultSet =
          SelectedResultSet.selectedResultSet.filter(
            (item) => item.id != ActiveResultSet.activeResultSet.id
          )
      } else {
        ActiveResultSet.activeResultSet = {
          type: 'FeatureCollection',
          features: selectedRows,
          id: this.optionVal.id,
        }
        let hasActiveResultSet = false
        for (let i = 0; i < SelectedResultSet.selectedResultSet.length; i++) {
          if (SelectedResultSet.selectedResultSet[i].id == this.optionVal.id) {
            SelectedResultSet.selectedResultSet[i] =
              ActiveResultSet.activeResultSet
            hasActiveResultSet = true
          }
        }
        if (!hasActiveResultSet) {
          SelectedResultSet.selectedResultSet.push(
            ActiveResultSet.activeResultSet
          )
        }
      }
      await this.hightlightSelectionMarkers()
    },
    onPaginationChange(page, pageSize) {
      this.pagination.current = page
      this.query()
    },
    onPaginationShowSizeChange(current, size) {
      this.pagination.pageSize = size
      this.pagination.current = 1
      this.query()
    },
    // 单击行
    onRowClick(row: unknown) {
      const feature = row as GFeature
      eventBus.$emit(events.ATTRIBUTE_TABLE_CLICK_ROW, {
        fid: feature.properties[this.rowKey],
        feature,
        exhibition: this.exhibition,
      })
    },
    // 双击行
    onRowDblclick(row: unknown) {
      const feature = row as GFeature
      eventBus.$emit(events.ATTRIBUTE_TABLE_DOUBLE_CLICK_ROW, {
        fid: feature.properties[this.rowKey],
        feature,
        exhibition: this.exhibition,
      })
      let bound = feature.properties.specialLayerBound
      if (bound === undefined) {
        bound = Feature.getGeoJSONFeatureBound(feature)
      }
      const width = bound.xmax - bound.xmin
      const height = bound.ymax - bound.ymin
      const center = {
        x: (bound.xmin + bound.xmax) / 2,
        y: (bound.ymin + bound.ymax) / 2,
      }
      /**
       * 当缩放的范围为点时，跳转过去，会导致标注点消失，
       * 这个给点一个矩形范围
       * @修改人 龚瑞强
       * @date 2021/12/28
       */
      bound = {
        xmin: center.x - (width || 0.1),
        ymin: center.y - (height || 0.1),
        xmax: center.x + (width || 0.1),
        ymax: center.y + (height || 0.1),
      }
      this.fitBound = { ...(bound as Record<string, number>) }
    },

    onRefresh() {
      this.query()
    },

    /* 属性表导出选择器 */
    async handleMenuClick(type) {
      await this.jsonFile(type.key)
    },

    /* 结果集属性列表导出为json数据 */
    async jsonFile(type) {
      const val = '1'
      const where = ''
      const datetime = Date.now()
      const jsonData = {}
      await this.queryGeoJSON(
        this.filterWithMap ? this.geometry : undefined,
        where,
        val
      )
      // const tableColumns = JSON.parse(JSON.stringify(this.tableColumns))
      const attrTableToJsonData = JSON.parse(
        JSON.stringify(this.attrTableToJsonData)
      )
      const jsonDataList = []
      for (const element of attrTableToJsonData) {
        jsonDataList.push(element.properties)
      }
      /* csv文件下载 */
      if (type === 'csvData') {
        await this.exportCSV(JSON.parse(JSON.stringify(jsonDataList)))
      } else if (type === 'jsonData') {
        jsonData.data = jsonDataList
        const blob = new Blob([JSON.stringify(jsonData)])
        await FileSaver.saveAs(blob, `attrData_${datetime}.json`)
        this.$message.success('导出成功')
      }
    },

    /* json数据转换成csv文件导出 */
    async exportCSV(data: any) {
      const parser = new this.Json2csvParser()
      const csvData = parser.parse(data)
      const blob = new Blob([`\uFEFF${csvData}`], {
        type: 'text/plain;charset=utf-8;',
      })
      const datetime = Date.now()
      await FileSaver.saveAs(blob, `attrData_${datetime}.csv`)
      this.$message.success('导出成功')
    },

    onToggleScreen() {
      if (this.fullScreen) {
        this.outFullScreen()
      } else {
        this.inFullScreen()
      }
    },

    onZoomTo() {
      if (this.selection.length == 0) return

      this.markerPlottingComponent &&
        this.markerPlottingComponent.zoomTo(this.selectionBound)
    },

    onClearSelection() {
      this.clearSelection()
      SelectedResultSet.selectedResultSet =
        SelectedResultSet.selectedResultSet.filter(
          (item) => item.id != ActiveResultSet.activeResultSet.id
        )
      ActiveResultSet.activeResultSet = {}
    },

    onStatistics() {
      this.showAttrStatistics = true
      this.updateStatisticAndFilterParamas()
    },

    onFilter() {
      this.showFilter = true
      this.updateStatisticAndFilterParamas()
    },

    async onUpdateWhere(val) {
      await this.query(val)
      this.showFilter = false
    },

    async onGetGeometry(val: Record<string, any>) {
      const { xmin, ymin, xmax, ymax, height = 0 } = val
      this.geometry = new Zondy.Common.Rectangle(xmin, ymin, xmax, ymax)

      this.geometry3D = {
        xmin,
        ymin,
        zmin: -100000,
        xmax,
        ymax,
        zmax: 100000,
      }
      // 分页初始化到第一页
      this.pagination.current = 1
      // 记录当前选中的行（避免双击定位同时根据范围过滤时导致信息刷新）
      await this.query()
    },

    showPaginationTotal(total, range) {
      return `显示${range[0]}-${range[1]}条，共有 ${total}条`
    },

    async query(where?: string) {
      this.loading = true
      this.sceneController = Objects.SceneController.getInstance(
        this.Cesium,
        this.vueCesium,
        this.viewer
      )
      try {
        this.clearSelection()
        const attrGeoJson = await this.queryGeoJSON(
          this.filterWithMap ? this.geometry : undefined,
          where
        )
      } catch (error) {
        const e = error as Error
        this.tableColumns = []
        console.error('属性表请求失败：', e)
        this.$message.warning('请求失败！')
      } finally {
        this.loading = false
        this.calcTableScrollY()
      }
    },

    // 清除选择集
    async clearSelection() {
      this.selection = []
      await this.hightlightSelectionMarkers()
    },

    // 高亮选择集对应的标注图标
    async hightlightSelectionMarkers() {
      const selectIcon = await markerIconInstance.selectIcon()
      const unSelectIcon = await markerIconInstance.unSelectIcon()
      this.selectedMarkers = []
      this.markers.forEach((marker) => {
        if (this.selectedRowKeys.includes(marker.fid)) {
          marker.img = selectIcon
          this.selectedMarkers.push(marker)
        } else {
          marker.img = unSelectIcon
        }
      })

      // 设置选择项和未选择项的图标
      if (this.selection.length == 0) return
      // 点击之后需要做一些跳转和缩放的动作
      // 以所有选择项的外包来看
      //    如果在当前屏幕范围内，什么都不处理
      //    如果不在屏幕范围内，先看平移过来是否可以看全，如果平移看不全，就需要缩放
      this.selectionBound = this.selection.reduce(
        (prev, cur) => {
          const feature = cur as GFeature
          let bound = feature.properties.specialLayerBound
          if (bound === undefined) {
            bound = Feature.getGeoJSONFeatureBound(feature)
          }
          return {
            xmin: bound.xmin < prev.xmin ? bound.xmin : prev.xmin,
            ymin: bound.ymin < prev.ymin ? bound.ymin : prev.ymin,
            xmax: bound.xmax > prev.xmax ? bound.xmax : prev.xmax,
            ymax: bound.ymax > prev.ymax ? bound.ymax : prev.ymax,
          }
        },
        {
          xmin: Number.MAX_VALUE,
          ymin: Number.MAX_VALUE,
          xmax: Number.MIN_VALUE,
          ymax: Number.MIN_VALUE,
        }
      )
    },

    // 添加标注
    async addMarkers() {
      const { serverType } = this.optionVal

      const unSelectIcon = await markerIconInstance.unSelectIcon()
      const tempMarkers: Record<string, any>[] = []
      for (let i = 0; i < this.tableData.length; i += 1) {
        const feature = this.tableData[i]
        let center = []
        if (this.isIGSScence || this.isModelCacheLayer) {
          const { xmin, xmax, ymin, ymax } =
            feature.properties.specialLayerBound
          const longitude = (xmin + xmax) / 2
          const latitude = (ymin + ymax) / 2
          // const height = await this.getModelHeight(longitude, latitude)
          center = [longitude, latitude]
        } else {
          center = Feature.getGeoJSONFeatureCenter(feature)
        }
        if (!(Number.isNaN(center[0]) || Number.isNaN(center[1]))) {
          const marker: Record<string, any> = {
            markerId: UUID.uuid(),
            coordinates: center,
            fid: feature.properties[this.rowKey],
            img: unSelectIcon,
            properties: this.setPropertiesAlias(feature.properties),
            feature: feature,
          }
          tempMarkers.push(marker)
        }
      }
      if (
        (this.isIGSScence || this.isModelCacheLayer) &&
        tempMarkers.length > 0
      ) {
        const arr = await this.getModelHeight(tempMarkers)
        if (arr.length === tempMarkers.length) {
          arr.forEach((item, index) => {
            const { longitude, latitude, height } = item
            tempMarkers[index].coordinates = [longitude, latitude, height]
          })
        }
      }
      this.markers = [...tempMarkers]
    },

    /**
     * 将弹窗的key设置成别名
     * 这里images字段不能用别名，弹窗组件需要通过images字段添加图片
     */
    setPropertiesAlias(properties) {
      const obj = {}
      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const value = properties[key]
          const column = this.tableColumns.find((item) => item.key === key)
          if (column && key !== 'images') {
            obj[column.title] = value
          } else {
            obj[key] = value
          }
        }
      }
      return obj
    },

    getModelHeight(tempMarkers: Array<unknown>) {
      return new Promise((resolve, reject) => {
        const positions = tempMarkers.map((item) => {
          return new this.Cesium.Cartesian3.fromDegrees(
            item.coordinates[0],
            item.coordinates[1]
          )
        })
        const sampleElevationTool = new this.Cesium.SampleElevationTool(
          this.viewer,
          positions,
          'model',
          (elevationPosition) => {
            if (elevationPosition && elevationPosition.length > 0) {
              resolve(elevationPosition)
            } else {
              resolve([])
            }
          }
        )
        sampleElevationTool.start()
      })
    },

    // 移除标注
    removeMarkers() {
      this.markers = []
    },

    // 计算表格内容高度
    calcTableScrollY() {
      const tableElement = document.getElementById(this.tableId)
      const boundingClientRect = tableElement.getBoundingClientRect()

      // 30 is table header height,35 is bleow pagination height
      this.scrollY =
        document.body.clientHeight - boundingClientRect.top - 30 - 35
    },

    updateStatisticAndFilterParamas() {
      const { serverType, gdbp, serverUrl, name } = this.optionVal
      if (
        serverType === LayerType.IGSMapImage ||
        serverType === LayerType.IGSVector ||
        serverType === LayerType.IGSScene
      ) {
        let domain
        if (!!serverUrl && serverUrl.length > 0) {
          const url = new URL(serverUrl)
          domain = url.origin
        }
        this.statisticAndFilterParamas = {
          ip: this.optionVal.ip.toString(),
          port: this.optionVal.port.toString(),
          domain,
          serverName: this.optionVal.serverName,
          layerIndex: this.currentTableParams.layerIndex,
          serverType,
          gdbp,
          name,
        }
      } else if (serverType === LayerType.ArcGISMapImage) {
        this.statisticAndFilterParamas = {
          serverName: this.optionVal.serverName,
          layerIndex: this.currentTableParams.layerIndex,
          serverType,
          serverUrl,
          name,
        }
      }
    },

    fullScreenListener(e) {
      if (e.target.id === this.id) {
        this.fullScreen = !this.fullScreen
      }
    },

    inFullScreen() {
      const el = this.$refs.attributeTable
      el.classList.add('beauty-scroll')
      if (!DomUtil.inFullScreen(el)) {
        this.$message.warn('对不起，您的浏览器不支持全屏模式')
        el.classList.remove('beauty-scroll')
      }
    },

    outFullScreen() {
      DomUtil.outFullScreen()
      this.$refs.attributeTable.classList.remove('beauty-scroll')
    },

    updateCurrentMarkerId(id) {
      this.currentId = id
    },
  },
}
</script>

<style lang="less">
.mp-attribute-table {
  .mapgis-ui-table-tbody > tr > td,
  .mapgis-ui-table-thead > tr > th {
    padding: 4px 4px !important;
  }
  // .mapgis-ui-table-body {
  //   overflow: auto !important;
  // }
  // .mapgis-ui-table-header {
  //   overflow: hidden !important;
  //   margin-bottom: 0px !important;
  // }
  .mapgis-ui-table-fixed-left {
    overflow: unset !important;
    .mapgis-ui-table-body-inner {
      overflow: hidden !important;
    }
  }
}
</style>

<style lang="less" scoped>
.mp-attribute-table {
  height: 100%;
  background-color: transparent;
  .header-bar {
    padding: 0 10px 0 17px;
    .columns {
      margin: 0 8px;
      cursor: pointer;
    }
  }
}
</style>
