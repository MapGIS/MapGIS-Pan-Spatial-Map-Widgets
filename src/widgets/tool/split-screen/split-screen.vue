<template>
  <div class="mp-widget-split-screen" :class="mode" v-if="isOpen">
    <!-- 分屏地图 -->
    <split-screen-map
      :map-span="mapSpan"
      :layer-ids="layerIds"
      :layers="layers"
      :resize="resize"
      ref="splitScreenMap"
    />
    <!-- 分屏设置 -->
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
      <split-screen-setting
        @in-full-screen="onInFullScreen"
        @out-full-screen="onOutFullScreen"
        @on-screen-count-change="onScreenCountChange"
        @on-layer-change="onLayerChange"
        :screen-num="screenNum"
        :map-span="mapSpan"
        :layer-ids="layerIds"
        :layers="layers"
      />
    </mapgis-ui-drawer>
  </div>
</template>

<script lang="ts">
import { DomUtil, WidgetMixin, Layer } from '@mapgis/web-app-framework'
import SplitScreenMap from './components/SplitScreenMap'
import SplitScreenSetting from './components/SplitScreenSetting'

enum Mode {
  normal = 'normal',
  max = 'max',
}

export default {
  name: 'MpSplitScreen',
  components: {
    SplitScreenMap,
    SplitScreenSetting,
  },
  mixins: [WidgetMixin],
  data() {
    return {
      isOpen: false,

      resize: '',

      mode: Mode.max,

      // 分屏数量
      screenNum: 0,

      // 屏索引和图层id的数据集合
      layerIds: [],

      // 目录树可见图层
      layers: [],

      // 弹框开关
      settingPanelVisible: true,
    }
  },
  computed: {
    // 地图排列
    mapSpan() {
      let span = 24
      if (!isNaN(this.screenNum)) {
        if (this.screenNum >= 5) {
          span = 8
        } else if (this.screenNum >= 2) {
          span = 12
        }
      }
      return span
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
        padding: '0 12px 12px 12px',
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
  methods: {
    /**
     * 屏数变化
     * @param screenCount
     */
    onScreenCountChange(screenCount: number) {
      if (this.screenNum >= screenCount) {
        this.layerIds.splice(screenCount - this.screenNum)
      } else {
        this.layers
          .slice(this.screenNum - 1)
          .map(({ id }) => id)
          .forEach((id) => {
            if (!this.layerIds.includes(id)) {
              this.layerIds.push(id)
            }
          })
      }
      this.screenNum = screenCount
      this.setResize()
    },

    /**
     * 图层选择变化
     * @param layerId
     * @param index
     */
    onLayerChange(layerId: string, index: number) {
      this.layerIds.splice(index, 1, layerId)
    },

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
     * 进入全屏
     */
    onInFullScreen() {
      this.settingPanelVisible = false
      const el = this.$refs.splitScreenMap.$el
      if (!DomUtil.inFullScreen(el)) {
        this.$message.warn('对不起，您的浏览器不支持全屏模式')
      }
    },

    /**
     * 退出全屏
     */
    onOutFullScreen() {
      DomUtil.outFullScreen()
    },

    /**
     * 清除
     */
    onClear() {
      this.screenNum = 0
      this.layerIds = []
    },

    /**
     * 弹框开启
     */
    onOpen() {
      this.isOpen = true
      this.initLayers()
    },

    /**
     * 弹框关闭
     */
    onClose() {
      this.isOpen = false
      this.onClear()
    },

    /**
     * 面板窗口size变化
     */
    onWindowSize(mode: keyof Mode) {
      if (this.mode !== mode) {
        this.mode = mode
        this.setResize()
      }
    },

    /**
     * 设置是否resize
     */
    setResize() {
      this.resize = `${(Math.random() * 10000).toFixed(0)}`
    },

    /**
     * 初始化图层
     */
    initLayers() {
      this.layers = this.document.defaultMap
        .clone()
        .getFlatLayers()
        .filter((v) => !!v.isVisible)
      const { length } = this.layers
      if (length) {
        this.screenNum = length < 7 ? length : 6
        this.layerIds = new Array(this.screenNum)
          .fill()
          .map((v, i) => this.layers[i].id)
      } else {
        this.onClear()
      }
    },
  },
  watch: {
    'document.defaultMap': {
      deep: true,
      handler() {
        if (this.isOpen) {
          this.initLayers()
        }
      },
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-split-screen {
  width: 100%;
  position: relative;
  // ::v-deep {
  .mapgis-ui-drawer-right.mapgis-ui-drawer-open {
    .mapgis-ui-drawer-content-wrapper {
      box-shadow: none;
      border-left: 1px solid $primary-color;
    }
  }
  // }
  .drawer-handle {
    background-color: $base-bg-color;
    border: 1px solid $primary-color;
    &:hover {
      color: white;
      background: $primary-color;
      position: absolute;
      height: 64px;
      top: calc(50% - 32px);
      left: -16px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      border-radius: 4px 0 0 4px;
      border-right-color: transparent;
      cursor: pointer;
    }
  }
  &.max {
    height: 100%;
  }
  &.normal {
    height: 500px;
  }
}
</style>
