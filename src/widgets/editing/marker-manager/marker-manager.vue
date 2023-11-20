<template>
  <div class="mp-widget-marker-manager">
    <mapgis-ui-toolbar>
      <mapgis-ui-toolbar-command-group>
        <mapgis-ui-toolbar-command
          v-for="item in interactiveMarkModes"
          :key="item.title"
          :title="item.title"
          :icon="item.icon"
          :active="markMode === item.mode"
          @click="onInteractiveMark(item.mode)"
        />
        <mapgis-ui-toolbar-command
          v-for="item in keyboardMarkModes"
          :key="item.title"
          :title="item.title"
          :icon="item.icon"
          @click="item.click"
        />
        <mapgis-ui-divider type="vertical" />
        <mapgis-ui-toolbar-command
          icon="save"
          title="保存"
          @click="onSaveMarkers"
        ></mapgis-ui-toolbar-command>
        <mapgis-ui-popover
          placement="bottomLeft"
          arrow-point-at-center
          trigger="hover"
          v-model="managerMenuVisible"
          overlayClassName="marker-manager-popover"
        >
          <mapgis-ui-list slot="content" :gutter="10">
            <mapgis-ui-list-item
              v-for="item in markerManagerModes"
              :key="item.title"
              @click="item.click"
            >
              {{ item.title }}
            </mapgis-ui-list-item>
          </mapgis-ui-list>

          <mapgis-ui-toolbar-command
            icon="more"
            title=""
          ></mapgis-ui-toolbar-command>
        </mapgis-ui-popover>
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-toolbar>
    <div class="marker-container">
      <mapgis-ui-group-tab :title="markerTotal">
        <mapgis-ui-toolbar slot="handle" :bordered="false">
          <mapgis-ui-toolbar-command-group remove-last-command-right-margin>
            <mapgis-ui-toolbar-command
              icon="close-square"
              title="清除选择"
              @click="onClearSelection"
              :disabled="currentMarkerId === ''"
            ></mapgis-ui-toolbar-command>
          </mapgis-ui-toolbar-command-group>
        </mapgis-ui-toolbar>
      </mapgis-ui-group-tab>
      <div
        v-if="markers.length"
        :id="markerListId"
        class="marker-list beauty-scroll"
      >
        <mp-marker-item
          :key="index"
          v-for="(item, index) in markers"
          :marker="item"
          :icons="icons"
          :active="currentMarkerId === item.markerId"
          @goto-marker="onGotoMarker"
          @delete-marker="onDeleteMarker"
        ></mp-marker-item>
      </div>
      <mapgis-ui-empty v-else :image="simpleImage" />
    </div>
    <mp-marker-plotting
      v-if="is2DMapMode"
      :markers="shownMarkers"
      :center="currentMarkerCenter"
      :highlight-style="highlightStyle"
      :popup-anchor="popupAnchor"
      :popup-toggle-type="popupToggleType"
      :selected-markers="selectedMarkers"
      :marker-show-type="markerShowType"
    >
      <template slot="popup" slot-scope="{ marker }">
        <marker-show-window :marker="marker"></marker-show-window>
      </template>
    </mp-marker-plotting>
    <mp-3d-marker-plotting
      v-else
      :markers="shownMarkers"
      :center="currentMarkerCenter"
      :highlight-style="highlightStyle"
      :popup-anchor="popupAnchor"
      :popup-toggle-type="popupToggleType"
      :selected-markers="selectedMarkers"
      :marker-show-type="markerShowType"
      @popupload="popupLoad"
    >
      <template slot="popup" slot-scope="{ marker }">
        <marker-show-window :marker="marker"></marker-show-window>
      </template>
    </mp-3d-marker-plotting>

    <marker-add
      :isActive="isActive"
      ref="markerAdd"
      @added="onAddMarker"
      @finished="onInteractiveFinished"
    />

    <marker-input
      :visible="KeyboardModalVisible"
      @added="onAddMarker"
      @finished="onInputFinished"
    />

    <marker-import
      :visible="importModalVisible"
      @added="onAddMarkers"
      @finished="importModalVisible = false"
    />

    <marker-export
      :visible="exportModalVisible"
      :markers="markers"
      @finished="exportModalVisible = false"
    />
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  UUID,
  api,
  baseConfigInstance,
  markerIconInstance,
  eventBus,
} from '@mapgis/web-app-framework'

import MarkerAdd from './components/MarkerAdd/MarkerAdd'
import MarkerShowWindow from './components/MarkerWindow/MarkerShowWindow.vue'
import MarkerInput from './components/MarkerInput/MarkerInput.vue'
import MarkerImport from './components/MarkerImport/MarkerImport.vue'
import MarkerExport from './components/MarkerExport/MarkerExport.vue'
import MpMarkerItem from './components/MarkerItem/MarkerItem.vue'
import { MapgisUiEmpty } from '@mapgis/webclient-vue-ui'

export default {
  name: 'MpMarkerManager',
  mixins: [WidgetMixin],
  components: {
    MarkerAdd,
    MarkerInput,
    MarkerImport,
    MarkerExport,
    MarkerShowWindow,
    MpMarkerItem,
  },

  data() {
    return {
      icons: {
        Point: 'environment',
        LineString:
          '<svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><style/></defs><path d="M883.2 238.933c-53.333 0-98.133 44.8-98.133 98.134 0 19.2 6.4 36.266 14.933 51.2L680.533 507.733c-14.933-10.666-32-14.933-51.2-14.933-27.733 0-53.333 12.8-70.4 29.867l-87.466-51.2v-8.534c0-53.333-44.8-98.133-98.134-98.133s-96 44.8-96 98.133c0 14.934 4.267 27.734 8.534 40.534L192 608c-14.933-8.533-29.867-12.8-46.933-12.8-53.334 0-98.134 44.8-98.134 98.133s44.8 96 98.134 96 98.133-44.8 98.133-98.133c0-21.333-6.4-40.533-19.2-57.6l87.467-96c17.066 14.933 38.4 23.467 61.866 23.467 36.267 0 66.134-19.2 83.2-49.067l78.934 46.933c-4.267 10.667-6.4 19.2-6.4 29.867 0 53.333 44.8 98.133 98.133 98.133s98.133-44.8 98.133-98.133c0-19.2-6.4-36.267-14.933-51.2l119.467-119.467c14.933 10.667 32 14.934 51.2 14.934 53.333 0 98.133-44.8 98.133-98.134s-42.667-96-96-96z"/></svg>',
        Polygon:
          '<svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><style/></defs><path d="M429.15 14.897c-45.775 0-82.85 37.076-82.85 82.85v2.61L136.562 232.38a83.223 83.223 0 0 0-38.815-10.357c-45.775 0-82.85 37.076-82.85 82.85 0 30.573 16.652 56.795 41.425 71.21v478.918c-24.773 14.416-41.426 40.597-41.426 71.21 0 45.775 37.076 82.85 82.85 82.85 30.573 0 56.795-16.653 71.21-41.425H689.3c14.416 24.772 40.597 41.425 71.21 41.425 45.775 0 82.85-37.075 82.85-82.85 0-16.487-4.556-32.353-12.966-45.32l101.036-203.19a83.058 83.058 0 0 0 10.357-164.417l-78.957-236.87c13.09-14.747 21.997-33.222 21.997-54.39 0-45.775-37.076-82.851-82.85-82.851-21.21 0-39.644 8.906-54.392 21.997L510.757 80.93a83.348 83.348 0 0 0-81.607-66.033zm54.39 144.989l236.87 77.672c6.338 33.347 32.726 59.694 66.032 66.032L865.4 539.175a82.436 82.436 0 0 0-21.997 55.675c0 17.15 5.344 33.348 14.25 46.604l-102.28 201.948a82.353 82.353 0 0 0-66.032 41.425H169a82.063 82.063 0 0 0-29.826-29.785V376.125c24.772-14.416 41.425-40.596 41.425-71.21v-2.61l209.736-132.022c11.6 6.131 24.731 10.357 38.816 10.357 20.878 0 39.768-7.913 54.39-20.713z"/></svg>',
      },
      // 鼠标交互模块
      // interactiveMarkModes: [
      //   {
      //     mode: 'draw-point',
      //     title: '点',
      //     // icon: this.icons.Point,
      //   },
      //   {
      //     mode: 'draw-polyline',
      //     title: '线',
      //     // icon: this.icons.LineString,
      //   },
      //   {
      //     mode: 'draw-polygon',
      //     title: '区',
      //     // icon: this.icons.Polygon,
      //   },
      // ],
      // 键盘导入模块
      keyboardMarkModes: [
        {
          title: '输入坐标',
          icon: '<svg class="icon" viewBox="0 0 1152 1024" xmlns="http://www.w3.org/2000/svg" width="144" height="128"><defs><style/></defs><path d="M1056 128H96c-53.02 0-96 42.98-96 96v576c0 53.02 42.98 96 96 96h960c53.02 0 96-42.98 96-96V224c0-53.02-42.98-96-96-96zm16 672c0 8.822-7.178 16-16 16H96c-8.822 0-16-7.178-16-16V224c0-8.822 7.178-16 16-16h960c8.822 0 16 7.178 16 16v576zM340 540v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm192 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm192 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm192 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zM244 704v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm768 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zM244 376v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm192 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm192 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm192 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zm192 0v-56c0-13.254-10.746-24-24-24h-56c-13.254 0-24 10.746-24 24v56c0 13.254 10.746 24 24 24h56c13.254 0 24-10.746 24-24zM816 692v-32c0-13.254-10.746-24-24-24H360c-13.254 0-24 10.746-24 24v32c0 13.254 10.746 24 24 24h432c13.254 0 24-10.746 24-24z"/></svg>',
          click: this.onKeyboardMark,
        },
        {
          title: '导入',
          icon: 'download',
          click: this.onImportMarkers,
        },
      ],
      // 标注点管理模块
      markerManagerModes: [
        {
          title: '导出标注',
          icon: 'export',
          click: this.onExportMarkers,
        },
        {
          title: '清空标注',
          icon: 'delete',
          click: this.onClearMarkers,
        },
      ],
      // 标注交互的模式
      markMode: '',
      // 全部标注
      // private markers: any[] = []
      markers: [],
      currentMarkerCenter: null,
      currentMarkerId: '',
      // 键盘对话框的显隐
      KeyboardModalVisible: false,
      // 导入对话框的显隐
      importModalVisible: false,
      // 导出对话框的显隐
      exportModalVisible: false,
      // 是否是关闭状态
      stateClosed: true,
      // 管理菜单状态
      managerMenuVisible: false,
      // 标注列表元素id
      markerListId: `${new Date().getTime()}-${Math.floor(
        Math.random() * 10
      )}-marker-list`,
      // 判断微件是否执行了失活onDeActive函数
      doDeActive: false,
    }
  },

  computed: {
    // 鼠标交互模块
    interactiveMarkModes() {
      return [
        {
          mode: 'draw-point',
          title: '点',
          icon: this.icons.Point,
        },
        {
          mode: 'draw-polyline',
          title: '线',
          icon: this.icons.LineString,
        },
        {
          mode: 'draw-polygon',
          title: '区',
          icon: this.icons.Polygon,
        },
      ]
    },

    markerTotal() {
      return `${this.markers.length}个标注`
    },

    highlightStyle() {
      return baseConfigInstance.config.colorConfig
    },

    shownMarkers() {
      return this.stateClosed ? [] : this.markers
    },

    markerShowType() {
      return this.widgetInfo.config.markerShowType
    },

    selectedMarkers() {
      return !this.stateClosed &&
        this.widgetInfo.config.markerShowType === 'default'
        ? this.markers
        : []
    },

    popupAnchor() {
      return baseConfigInstance.config.colorConfig.label.image.popupAnchor
    },

    popupToggleType() {
      return baseConfigInstance.config.colorConfig.label.image.popupToggleType
    },

    isActive() {
      return this.widget.state === 'active'
    },
  },

  watch: {
    // 二三维地图模式切换时
    mapRender() {
      this.closeMark()
    },
    async currentMarkerId() {
      await this.hightlightSelectionMarkers()
    },
  },

  beforeCreate() {
    this.simpleImage = MapgisUiEmpty.PRESENTED_IMAGE_SIMPLE
  },

  async mounted() {
    this.$message.config({ top: '100px', duration: 2, maxCount: 1 })

    const unSelectIcon = await markerIconInstance.unSelectIcon()

    if (!this.widgetInfo.config.markers) {
      this.markers = []
    } else {
      // 下面的操作都是为了兼容老版的三个标注点的数据(因为老版标注点的构造和新版的标注点构造不一样)
      this.markers = this.widgetInfo.config.markers.reduce((result, item) => {
        if (Object.keys(item).includes('ftype')) {
          // 老版标注点包含'ftype'属性
          let coordinates = []
          switch (item.fileType) {
            case 'Polygon':
              coordinates = [item.coordinates]
              break
            case 'LineString':
              coordinates = item.coordinates
              break
            default:
              coordinates = item.point
              break
          }
          const geoJsonFeature = {
            geometry: {
              coordinates: coordinates,
              type: item.fileType || 'Point',
            },
            properties: {},
            type: 'Feature',
          }
          const marker = {
            markerId: UUID.uuid(),
            title: item.name,
            description: item.info,
            coordinates: item.point,
            img: unSelectIcon,
            properties: geoJsonFeature.properties,
            feature: geoJsonFeature,
          }
          result.push(marker)
        } else {
          // 新版标注点不包含'ftype'属性
          const marker = {
            markerId: item.id,
            title: item.title,
            description: item.description,
            coordinates: item.center,
            img: unSelectIcon,
            properties: item.feature.properties,
            feature: item.feature,
            picture: item.picture,
          }
          result.push(marker)
        }
        return result
      }, [])
    }
  },

  methods: {
    // @Watch('currentMarkerId')
    // async currentMarkerIdChange() {
    //   await this.hightlightSelectionMarkers()
    // },

    // 微件打开时
    onOpen() {
      this.stateClosed = false
    },

    // 微件激活时
    onActive() {
      this.doDeActive = false
      this.map.getCanvas().style.cursor = this.widgetInfo.config.cursorType
    },

    // 微件关闭时
    onClose() {
      this.stateClosed = true
      this.onClearMark()
      if (!this.doDeActive) {
        this.map.getCanvas().style.cursor = 'grab'
      }
    },

    // 微件失活时
    onDeActive() {
      this.closeMark()
      this.doDeActive = true
      this.map.getCanvas().style.cursor = 'grab'
    },

    // 点击不同类型标注图标回调事件
    onInteractiveMark(mode) {
      this.markMode = mode

      this.$refs.markerAdd && this.$refs.markerAdd.openMark(mode)
    },

    // 清除并关闭绘制
    onClearMark() {
      // 关闭标注工具
      this.closeMark()

      // 清除选择项
      this.currentMarkerId = ''
    },

    // 完成添加
    onInteractiveFinished() {
      this.markMode = ''
      this.closeMark()
    },

    onInputFinished() {
      this.KeyboardModalVisible = false
    },

    // 添加标注
    onAddMarker(marker: any) {
      this.markers.push(marker)

      this.onGotoMarker(marker)

      this.scrollToMarkerListBottom()
    },

    // 通过文件导入添加标注
    onAddMarkers(markers: any[]) {
      if (markers.length) {
        this.markers = this.markers.concat(markers)

        this.onGotoMarker(this.markers[this.markers.length - 1])

        this.scrollToMarkerListBottom()
      }
    },

    // 键盘按钮回调事件
    onKeyboardMark() {
      this.KeyboardModalVisible = true
    },

    // 导入按钮回调事件
    onImportMarkers() {
      this.importModalVisible = true
    },

    // 导出按钮回调事件
    onExportMarkers() {
      this.exportModalVisible = true
      this.managerMenuVisible = false
    },

    // 清除按钮回调事件
    onClearMarkers() {
      this.markers = []
      this.managerMenuVisible = false
    },

    // 选择标注
    onGotoMarker(marker) {
      // 点击标注跳转
      this.currentMarkerCenter = marker.coordinates
      this.currentMarkerId = marker.markerId
    },

    // 删除标注
    onDeleteMarker(marker) {
      this.markers = this.markers.reduce((result, item) => {
        if (marker.markerId !== item.markerId) {
          result.push(item)
        }
        return result
      }, [])
    },

    // 清除选择
    onClearSelection() {
      this.currentMarkerId = ''
    },

    // 保存按钮回调事件
    onSaveMarkers() {
      const this_ = this

      const savedMarkers = this.markers.map((marker) => {
        const { markerId, title, description, coordinates, feature, picture } =
          marker

        return {
          id: markerId,
          title,
          description,
          center: coordinates,
          feature,
          picture,
        }
      })

      const newConfig = { ...this.widgetInfo.config, markers: savedMarkers }

      api
        .saveWidgetConfig({
          name: 'marker-manager',
          config: JSON.stringify(newConfig),
        })
        .then(() => {
          this_.$message.success('保存成功')
        })
        .catch(() => {
          this_.$message.error('保存失败')
        })
    },

    // 关闭标注工具
    closeMark() {
      this.markMode = ''
      this.$refs.markerAdd && this.$refs.markerAdd.closeMark()
    },

    // 高亮选中的标注图标
    async hightlightSelectionMarkers() {
      const selectIcon = await markerIconInstance.selectIcon()
      const unSelectIcon = await markerIconInstance.unSelectIcon()
      this.markers.forEach((marker) => {
        if (this.currentMarkerId === marker.markerId) {
          marker.img = selectIcon
        } else {
          marker.img = unSelectIcon
        }
      })
    },

    // 为三维popup内部的按钮绑定事件
    popupLoad(markerId) {
      const editBtn = document.getElementsByClassName(
        'marker-manager-toolbar-edit-button'
      )

      for (const button of editBtn) {
        button.addEventListener(
          'click',
          this.handleMarkerEditButtonClick.bind(this, markerId)
        )
      }
    },

    // 点击三维popup内部的编辑按钮响应事件
    handleMarkerEditButtonClick(markerId) {
      eventBus.$emit('marker-manager-toolbar-edit-button-click', markerId)
    },

    scrollToMarkerListBottom() {
      this.$nextTick(() => {
        const markerListElement = document.getElementById(this.markerListId)
        markerListElement.scrollTop = markerListElement.scrollHeight
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-marker-manager,
.marker-container {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: $text-color;
  .marker-list {
    flex: 1 1 0%;
    overflow: auto;
  }
  ::v-deep .mapgis-ui-empty-normal {
    margin: 8px 0;
  }
}
.mapgis-ui-list-item {
  &:hover {
    background: $list-item-hover-bg;
  }
}
.mapgis-ui-divider {
  background-color: $border-color-base;
}
</style>
