<template>
  <div class="swipe-mapbox-compare">
    <!-- 空数据提示 -->
    <div class="swipe-mapbox-empty" v-if="!showCompare">
      <mapgis-ui-empty description="卷帘分析功能至少需要选择2个图层" />
    </div>
    <!-- 卷帘组件 -->
    <mapgis-compare v-else :orientation="direction">
      <mp-web-map-pro
        slot="beforeMap"
        @map-load="handleLoad"
        :document="aboveDocument"
      />
      <mp-web-map-pro
        slot="afterMap"
        @map-load="handleLoad"
        :document="belowDocument"
      />
    </mapgis-compare>
    <!-- 图层设置 -->
    <mapgis-ui-drawer
      title="设置"
      placement="right"
      :closable="false"
      :get-container="false"
      :width="240"
      :visible="settingPanelVisible"
      :wrap-style="drawerWrapStyle"
      :header-style="drawerHeaderStyle"
      :body-style="drawerBodyStyle"
      :maskStyle="drawerMaskStyle"
      @close="onSettingPanelClose"
    >
      <div class="drawer-handle" slot="handle" @click="onToggleSettingPanel">
        <mapgis-ui-iconfont
          :type="settingPanelVisible ? 'mapgis-right' : 'mapgis-left'"
        />
      </div>
      <swipe-setting />
    </mapgis-ui-drawer>
  </div>
</template>
<script lang="ts">
import { Document, Layer } from '@mapgis/web-app-framework'
import SwipeSetting from './SwipeSetting'

export default {
  name: 'MapboxCompare',
  components: {
    SwipeSetting,
  },
  inject: {
    swipe: {
      from: 'swipe',
      default: () => ({}),
    },
  },
  data() {
    return {
      // 上级(左侧)地图Document
      aboveDocument: new Document(),

      // 下级(右侧)地图Document
      belowDocument: new Document(),

      // 弹框开关
      settingPanelVisible: true,
    }
  },
  computed: {
    // 卷帘方向
    direction() {
      return this.swipe.direction || 'vertical'
    },
    // 上级(左侧)图层
    aboveLayer() {
      return this.swipe.aboveLayer || {}
    },

    // 下级(右侧)图层
    belowLayer() {
      return this.swipe.belowLayer || {}
    },

    // 是否展示卷帘
    showCompare() {
      return this.aboveLayer.id && this.belowLayer.id
    },

    // 弹框wrap样式
    drawerWrapStyle() {
      return {
        position: 'absolute',
      }
    },

    // 弹框头部样式
    drawerHeaderStyle() {
      return {
        display: 'none',
      }
    },

    // 弹框内容样式
    drawerBodyStyle() {
      return {
        display: 'flex',
        padding: '12px',
      }
    },

    /**
     * 遮罩层样式
     */
    drawerMaskStyle() {
      return {
        backgroundColor: 'transparent',
      }
    },
  },
  watch: {
    /**
     * 监听: 上级(左侧)图层
     */
    'aboveLayer.id': {
      immediate: true,
      handler() {
        this.addLayerToMap('above')
      },
    },
    /**
     * 监听: 下级(右侧)图层
     */
    'belowLayer.id': {
      immediate: true,
      handler() {
        this.addLayerToMap('below')
      },
    },
  },
  methods: {
    /**
     * 点击遮罩层关闭面板
     */
    onSettingPanelClose() {
      this.settingPanelVisible = false
    },
    /**
     * 面板开关
     */
    onToggleSettingPanel() {
      this.settingPanelVisible = !this.settingPanelVisible
    },
    /**
     * 添加图层
     */
    addLayerToMap(type: 'above' | 'below') {
      const { defaultMap } = this[`${type}Document`]
      const layer = this[`${type}Layer`]
      if (layer) {
        defaultMap.removeAll()
        defaultMap.add(layer)
      }
    },
    handleLoad(payLoad) {
      const { map } = payLoad
      const fullExtent =
        this.aboveLayer.fullExtent || this.belowLayer.fullExtent
      const { xmin, ymin, xmax, ymax } = fullExtent
      setTimeout(function () {
        map.fitBounds([
          [xmin, ymin],
          [xmax, ymax],
        ])
      }, 300)
    },
  },
}
</script>

<style lang="scss" scoped>
::v-deep .mapgis-ui-drawer-right.mapgis-ui-drawer-open {
  .mapgis-ui-drawer-content-wrapper {
    box-shadow: none;
    border-left: 1px solid $primary-color;
  }
}
.swipe-mapbox-compare {
  width: 100%;
  height: 100%;
  position: relative;
  ::v-deep .mapgis-compare-bar {
    width: 100%;
    height: 100%;
    min-width: 77vw;
    min-height: 77vh;
  }
}
.drawer-handle {
  background-color: $base-bg-color;
  border: 1px solid $primary-color;
  border-right-color: transparent;
  cursor: pointer;
  position: absolute;
  height: 64px;
  top: calc(50% - 32px);
  left: -16px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-radius: 4px 0 0 4px;

  &:hover {
    color: white;
    background: $primary-color;
  }
}
.swipe-mapbox-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
