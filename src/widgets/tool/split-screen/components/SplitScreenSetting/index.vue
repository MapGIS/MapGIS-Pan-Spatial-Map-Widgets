<template>
  <div class="split-screen-setting">
    <mapgis-ui-group-tab size="small" title="设置" :has-top-margin="false">
      <mapgis-ui-toolbar slot="handle" :bordered="false">
        <mapgis-ui-toolbar-command
          title="全屏"
          :icon="fullScreen ? 'fullscreen-exit' : 'fullscreen'"
          @click="onToggleScreen"
        />
      </mapgis-ui-toolbar>
    </mapgis-ui-group-tab>
    <mapgis-ui-setting-form layout="vertical" size="small">
      <mapgis-ui-form-item label="屏数">
        <mapgis-ui-select :value="screenCount" @change="onScreenCountChange">
          <mapgis-ui-select-option
            v-for="(l, i) in layers"
            :key="i"
            :value="i + 1"
          >
            {{ i + 1 }}
          </mapgis-ui-select-option>
        </mapgis-ui-select>
      </mapgis-ui-form-item>
      <template v-if="!!screenCount">
        <mapgis-ui-form-item label="图示">
          <mapgis-ui-row class="diagram-grid">
            <mapgis-ui-col
              v-for="s in screenCount"
              :key="s"
              :span="mapSpan"
              class="diagram-col"
            >
              {{ s }}
            </mapgis-ui-col>
          </mapgis-ui-row>
        </mapgis-ui-form-item>
        <mapgis-ui-form-item
          v-for="(s, i) in screenCount"
          :key="s"
          :label="`第${screenLabel[i]}屏`"
        >
          <mapgis-ui-select
            :value="layerIds[i]"
            @change="onLayerChange($event, i)"
          >
            <mapgis-ui-select-option
              v-for="{ id, title } in layers"
              :key="id"
              :value="id"
              :title="title"
            >
              {{ title }}
            </mapgis-ui-select-option>
          </mapgis-ui-select>
        </mapgis-ui-form-item>
      </template>
    </mapgis-ui-setting-form>
  </div>
</template>

<script lang="ts">
import { DomUtil, Layer } from '@mapgis/web-app-framework'

enum ScreenLabel {
  '一' = 0,
  '二',
  '三',
  '四',
  '五',
  '六',
}

export default {
  name: 'SplitScreenSetting',
  props: {
    mapSpan: {
      type: Number,
      default: 12,
    },
    screenNum: Number,
    layerIds: {
      type: Array,
      default: () => [],
    },
    layers: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      visible: true,

      screenLabel: ScreenLabel,

      screenCount: null,

      fullScreen: false,
    }
  },
  computed: {
    // 设置面板的收缩开关icon
    handleIcon() {
      return this.visible ? 'right' : 'left'
    },
  },
  watch: {
    /**
     * 监听: 分屏数量变化
     */
    screenNum: {
      immediate: true,
      handler(nV) {
        this.screenCount = nV || null
      },
    },
  },

  created() {
    DomUtil.addFullScreenListener(this.fullScreenListener)
  },

  beforeDestroy() {
    DomUtil.removeFullScreenListener(this.fullScreenListener)
  },
  methods: {
    /**
     * 屏数变化
     * @param screenCount
     */
    onScreenCountChange(screenCount: number) {
      this.screenCount = screenCount
      this.$emit('on-screen-count-change', screenCount)
    },

    /**
     * 图层选择变化
     * @param layerId
     * @param index
     */
    onLayerChange(layerId: string, index: number) {
      this.$emit('on-layer-change', layerId, index)
    },

    /**
     * 全屏
     */
    onToggleScreen() {
      if (this.fullScreen) {
        this.$emit('out-full-screen')
      } else {
        this.$emit('in-full-screen')
      }
    },

    fullScreenListener(e) {
      if (e.target.id === this.id) {
        this.fullScreen = !this.fullScreen
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.split-screen-setting {
  .diagram-col {
    color: $text-color;
    border: 1px solid $border-color;
    background-color: $base-bg-color;
  }
}
</style>

<style lang="less" scoped>
@import './index.less';
</style>
