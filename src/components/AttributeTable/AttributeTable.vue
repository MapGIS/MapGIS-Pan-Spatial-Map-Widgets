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
      :center="panToCenter"
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
      :center="panToCenter"
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
          :exhibition="exhibition"
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
      // 三维气泡框展示位置
      popupShowType: baseConfigInstance.config.popupShowType,
    }
  },
  props: {
    // 属性表信息
    exhibition: {
      type: IAttributeTableExhibition,
    },
    // 属性表选项
    option: {
      type: IAttributeTableOption,
    },
  },
  computed: {
    // 表格所有勾选的行组成的rowKey数组
    selectedRowKeys() {
      return this.selection.map(
        (item) => (item as GFeature).properties[this.rowKey]
      )
    },
    // datastore的ip
    dataStoreIp() {
      return baseConfigInstance.config.DataStoreIp
    },
    // datastore的端口
    dataStorePort() {
      return baseConfigInstance.config.DataStorePort
    },
    // 气泡框偏移量
    popupAnchor() {
      return baseConfigInstance.config.colorConfig.label.image.popupAnchor
    },
    // 气泡框激活方式
    popupToggleType() {
      return baseConfigInstance.config.colorConfig.label.image.popupToggleType
    },
    // 勾选行数提示信息
    selectedDescription() {
      const length = this.selectedRowKeys.length

      return `${length} 已选择`
    },
    // 属性表的配置信息
    optionVal() {
      return this.option || this.exhibition.option
    },
    // 有效的表头数据
    visibleColumns() {
      return this.tableColumns.filter((col) => col.visible)
    },
    // 要素高亮样式
    highlightStyle() {
      return baseConfigInstance.config.colorConfig
    },
    // 处于不同地图模式下的组件ref引用
    markerPlottingComponent() {
      return this.is2DMapMode
        ? this.$refs.refMarkerPlotting
        : this.$refs.ref3dMarkerPlotting
    },
    // 流图层
    dataFlowList() {
      return DataFlowList
    },
    getDataFLowList() {
      const { serverType } = this.optionVal
      if (serverType === LayerType.DataFlow) {
        // 获取当前属性表展示的流图层所有要素
        const features = this.dataFlowList.getDataFlowById(this.optionVal.id)
        return features || []
      }
      return []
    },
    // 是否是场景服务图层类型
    isIGSScence() {
      const { serverType } = this.optionVal
      return serverType === LayerType.IGSScene
    },
    // 是否是模型缓存图层类型
    isModelCacheLayer() {
      const { serverType } = this.optionVal
      return serverType === LayerType.ModelCache
    },
    // 是否是IGServer三维简单要素类图层类型
    isIGSVector3dLayer() {
      const { serverType } = this.optionVal
      return serverType === LayerType.IGSVector3D
    },
    // 气泡框宽度
    popupWidth() {
      return Number(this.exhibition?.popupOption?.componentWidth || 280)
    },
    // 气泡框组件
    popupComponent() {
      return this.exhibition?.popupOption?.component || 'mapgis-3d-popup-iot'
    },
    // 气泡框配置信息
    popupOption() {
      return this.exhibition?.popupOption
    },
    // marker几何高亮类型，hover表示鼠标放到标注上高亮，default表示显示标注的时候就高亮
    markerShowType() {
      return this.hightlightSelection ? 'default' : 'hover'
    },
  },
  watch: {
    // 监听流图层要素的变化
    getDataFLowList: {
      deep: true,
      handler(newVal, oldVal) {
        if (!newVal || !newVal.length) {
          return
        }
        // 清除表格勾选
        this.clearSelection()
        // 清除地图上对应的标注
        this.removeMarkers()
        // 清除表格数据
        this.tableData = []
        // 清除表头数据
        this.tableColumns = []
        // 重新查询数据
        this.query()
      },
    },
    // 属性表配置信息变化
    optionVal: {
      deep: true,
      immediate: true,
      handler() {
        // 清除表格勾选
        this.clearSelection()
        // 清除地图上对应的标注
        this.removeMarkers()
        // 清除表格数据
        this.tableData = []
        // 清除表头数据
        this.tableColumns = []
        // 重新查询数据
        this.query()
      },
    },
  },

  created() {
    // 创建全屏事件的监听
    DomUtil.addFullScreenListener(this.fullScreenListener)
  },

  beforeDestroy() {
    // 移除全屏事件的监听
    DomUtil.removeFullScreenListener(this.fullScreenListener)
  },
  methods: {
    // 父组件面板宽高变化后重新计算table表格的高度
    onResize() {
      this.calcTableScrollY()
    },
    async onActive() {
      await this.addMarkers()
      await this.hightlightSelectionMarkers()
    },
    // 父组件中tab项切换时处关闭一个tab项中的操作
    onDeActive() {
      // 关闭过滤器窗口
      this.showFilter = false
      // 关闭统计窗口
      this.showAttrStatistics = false
      // 移除标注
      this.removeMarkers()
    },
    // 父组件中tab项被关闭
    onClose() {
      // 下面无法隐藏窗口
      // this.showFilter = false
      // this.showAttrStatistics = false
      // 直接设置窗口的style
      document.getElementById(this.filterId).style.display = 'none'
      document.getElementById(this.statisticsId).style.display = 'none'
      // 移除标注
      this.removeMarkers()
    },
    // 勾选/取消勾线某一行或多行
    async onSelectChange(selectedRowKeys, selectedRows) {
      this.selection = selectedRows
      // 无勾选项时置空ActiveResultSet和SelectedResultSet
      if (this.selectedRowKeys.length == 0) {
        ActiveResultSet.activeResultSet = {}
        SelectedResultSet.selectedResultSet =
          SelectedResultSet.selectedResultSet.filter(
            (item) => item.id != ActiveResultSet.activeResultSet.id
          )
      } else {
        // 构建geojson对象
        ActiveResultSet.activeResultSet = {
          type: 'FeatureCollection',
          features: selectedRows,
          id: this.optionVal.id,
        }
        let hasActiveResultSet = false
        // 保存对应tab页的selectedResultSet值
        for (let i = 0; i < SelectedResultSet.selectedResultSet.length; i++) {
          if (SelectedResultSet.selectedResultSet[i].id == this.optionVal.id) {
            SelectedResultSet.selectedResultSet[i] =
              ActiveResultSet.activeResultSet
            hasActiveResultSet = true
          }
        }
        // 保存新的tab页的selectedResultSet值
        if (!hasActiveResultSet) {
          SelectedResultSet.selectedResultSet.push(
            ActiveResultSet.activeResultSet
          )
        }
      }
      // 将marker图标变成高亮状态
      await this.hightlightSelectionMarkers()
    },
    // 切换分页
    onPaginationChange(page, pageSize) {
      this.pagination.current = page
      this.query(undefined, true)
    },
    // 切换当前表格每页展示数量
    onPaginationShowSizeChange(current, size) {
      this.pagination.pageSize = size
      this.pagination.current = 1
      this.query()
    },
    // 单击行
    onRowClick(row: unknown) {
      // 单击行定位到要素
      const feature = row as GFeature
      // 鼠标单击表格中某一行时，将相关信息发出
      eventBus.$emit(events.ATTRIBUTE_TABLE_CLICK_ROW, {
        fid: feature.properties[this.rowKey],
        feature,
        exhibition: this.exhibition,
      })
      // 获取当前点击行要素的边界信息
      let bound = feature.properties.specialLayerBound
      if (bound === undefined) {
        bound = Feature.getGeoJSONFeatureBound(feature)
      }
      // 获取当前行要素的中心点坐标
      this.panToCenter = [
        (bound.xmin + bound.xmax) / 2,
        (bound.ymin + bound.ymax) / 2,
      ]
    },
    // 双击行
    onRowDblclick(row: unknown) {
      // 双击缩放至要素
      const feature = row as GFeature
      // 鼠标双击表格中某一行时，将相关信息发出
      eventBus.$emit(events.ATTRIBUTE_TABLE_DOUBLE_CLICK_ROW, {
        fid: feature.properties[this.rowKey],
        feature,
        exhibition: this.exhibition,
      })
      // 获取当前双击行要素的边界信息
      let bound = feature.properties.specialLayerBound
      if (bound === undefined) {
        bound = Feature.getGeoJSONFeatureBound(feature)
      }
      // 获取当前行要素的中心点坐标
      const width = bound.xmax - bound.xmin
      const height = bound.ymax - bound.ymin
      if (width == 0 || height == 0) {
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
      }
      // 跳转范围
      this.fitBound = { ...(bound as Record<string, number>) }
    },

    // 刷新按钮
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
        false,
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
    // 全屏按钮
    onToggleScreen() {
      if (this.fullScreen) {
        this.outFullScreen()
      } else {
        this.inFullScreen()
      }
    },
    // 缩放至已选择按钮
    onZoomTo() {
      if (this.selection.length == 0) return

      // 调用对应的标注组件
      this.markerPlottingComponent &&
        this.markerPlottingComponent.zoomTo(this.selectionBound)
    },
    // 清除已选择按钮
    onClearSelection() {
      this.clearSelection()
      SelectedResultSet.selectedResultSet =
        SelectedResultSet.selectedResultSet.filter(
          (item) => item.id != ActiveResultSet.activeResultSet.id
        )
      ActiveResultSet.activeResultSet = {}
    },

    // 统计窗口打开按钮
    onStatistics() {
      // 打开统计窗口
      this.showAttrStatistics = true
      // 获取查询和统计参数
      this.updateStatisticAndFilterParamas()
    },

    // 过滤窗口打开按钮
    onFilter() {
      // 打开过滤窗口
      this.showFilter = true
      // 获取查询和统计参数
      this.updateStatisticAndFilterParamas()
    },

    // 过滤器-应用按钮
    async onUpdateWhere(val) {
      // 根据条件调用查询接口
      await this.query(val)
      // 关闭过滤器窗口
      this.showFilter = false
    },

    // 当前地图范围变化事件
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
    // 分页信息
    showPaginationTotal(total, range) {
      return `显示${range[0]}-${range[1]}条，共有 ${total}条`
    },

    // 属性表查询接口
    async query(where?: string, isPageChange?: boolean) {
      this.loading = true
      // 当并非页码改变，即重新拉框查询时，将查询页码置为1，否则可能会出现查询的页码很大而查询结果总条数很小导致查询不到数据的情况
      this.pagination.current = isPageChange ? this.pagination.current : 1
      try {
        // 清除已勾选的表格数据
        this.clearSelection()
        // 重新查询表格数据
        const attrGeoJson = await this.queryGeoJSON(
          this.filterWithMap ? this.geometry : undefined,
          where,
          isPageChange
        )
      } catch (error) {
        const e = error as Error
        // 将表头展示的列字段置空
        this.tableColumns = []
        console.error('属性表请求失败：', e)
        this.$message.warning('请求失败！')
      } finally {
        this.loading = false
        // 重新计算table表格的高度
        this.calcTableScrollY()
      }
    },

    // 清除选择集
    async clearSelection() {
      this.selection = []
      // 展示标注信息
      await this.hightlightSelectionMarkers()
    },

    // 展示标注信息
    async hightlightSelectionMarkers() {
      const selectIcon = await markerIconInstance.selectIcon()
      const unSelectIcon = await markerIconInstance.unSelectIcon()
      this.selectedMarkers = []
      this.markers.forEach((marker) => {
        if (this.selectedRowKeys.includes(marker.fid)) {
          // 表格勾选行对应的标注图标
          marker.img = selectIcon
          this.selectedMarkers.push(marker)
        } else {
          // 表格未勾选行对应的标注图标
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
          // 返回最大的边界范围
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
      // 获取未被选中的标注样式
      const unSelectIcon = await markerIconInstance.unSelectIcon()
      const tempMarkers: Record<string, any>[] = []
      // 遍历表格中的数据组装标注信息
      for (let i = 0; i < this.tableData.length; i += 1) {
        const feature = this.tableData[i]
        let center = []
        // 三维图层的要素
        if (
          this.isIGSScence ||
          this.isModelCacheLayer ||
          this.isIGSVector3dLayer
        ) {
          const { xmin, xmax, ymin, ymax } =
            feature.properties.specialLayerBound
          const longitude = (xmin + xmax) / 2
          const latitude = (ymin + ymax) / 2
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
            properties: this.setPropertiesAlias(feature.properties), // 将properties中设置了别名的字段替换成别名
            feature: feature,
          }
          tempMarkers.push(marker)
        }
      }
      if (
        (this.isIGSScence ||
          this.isModelCacheLayer ||
          this.isIGSVector3dLayer) &&
        tempMarkers.length > 0
      ) {
        // 获取中心点的高度再设置到对应的标注信息中
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

    // 获取三维模型高度方法
    getModelHeight(tempMarkers: Array<unknown>) {
      return new Promise((resolve, reject) => {
        const positions = tempMarkers.map((item) => {
          return new this.Cesium.Cartesian3.fromDegrees(
            item.coordinates[0],
            item.coordinates[1]
          )
        })
        // 构造采样高程工具类
        const sampleElevationTool = new this.Cesium.SampleElevationTool(
          this.viewer,
          positions,
          'model',
          (elevationPosition) => {
            // 采用高程结果回调
            if (elevationPosition && elevationPosition.length > 0) {
              resolve(elevationPosition)
            } else {
              resolve([])
            }
          }
        )
        // 执行高程采样
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

    // 组装统计表和过滤器的查询参数
    updateStatisticAndFilterParamas() {
      const { serverType, gdbp, serverUrl, name } = this.optionVal
      if (
        serverType === LayerType.IGSMapImage ||
        serverType === LayerType.IGSVector ||
        serverType === LayerType.IGSScene ||
        serverType === LayerType.IGSTile
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

    // 全屏/取消全屏的监听事件
    fullScreenListener(e) {
      if (e.target.id === this.id) {
        this.fullScreen = !this.fullScreen
      }
    },

    // 全屏
    inFullScreen() {
      const el = this.$refs.attributeTable
      el.classList.add('beauty-scroll')
      if (!DomUtil.inFullScreen(el)) {
        this.$message.warn('对不起，您的浏览器不支持全屏模式')
        el.classList.remove('beauty-scroll')
      }
    },

    // 取消全屏
    outFullScreen() {
      DomUtil.outFullScreen()
      this.$refs.attributeTable.classList.remove('beauty-scroll')
    },

    // 更新当前选中的标注信息id
    updateCurrentMarkerId(id) {
      this.currentId = id
    },
  },
}
</script>

<style lang="scss">
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

<style lang="scss" scoped>
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
