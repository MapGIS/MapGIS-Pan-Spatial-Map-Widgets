<template>
  <div class="split-screen-setting">
    <mp-group-tab size="small" title="设置" :has-top-margin="false">
      <mp-toolbar slot="handle" :bordered="false">
        <mp-toolbar-command
          title="全屏"
          :icon="fullScreen ? 'fullscreen-exit' : 'fullscreen'"
          @click="onToggleScreen"
        />
      </mp-toolbar>
    </mp-group-tab>
    <mp-setting-form layout="vertical" size="small">
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
    </mp-setting-form>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Watch, Prop } from 'vue-property-decorator'
import { DomUtil, Layer } from '@mapgis/web-app-framework'

enum ScreenLabel {
  '一' = 0,
  '二',
  '三',
  '四',
  '五',
  '六',
}
@Component({})
export default class SplitScreenSetting extends Vue {
  @Prop({ default: 12 }) readonly mapSpan!: number

  @Prop() readonly screenNum!: number

  @Prop({ default: () => [] }) readonly layerIds!: string[]

  @Prop({ default: () => [] }) readonly layers!: Layer[]

  private visible = true

  private screenLabel = ScreenLabel

  private screenCount: number | null = null

  private fullScreen = false

  // 设置面板的收缩开关icon
  get handleIcon() {
    return this.visible ? 'right' : 'left'
  }

  /**
   * 监听: 分屏数量变化
   */
  @Watch('screenNum', { immediate: true })
  screenNumChanged(nV: number) {
    this.screenCount = nV || null
  }

  created() {
    DomUtil.addFullScreenListener(this.fullScreenListener)
  }

  beforeDestroy() {
    DomUtil.removeFullScreenListener(this.fullScreenListener)
  }

  /**
   * 屏数变化
   * @param screenCount
   */
  onScreenCountChange(screenCount: number) {
    this.screenCount = screenCount
    this.$emit('on-screen-count-change', screenCount)
  }

  /**
   * 图层选择变化
   * @param layerId
   * @param index
   */
  onLayerChange(layerId: string, index: number) {
    this.$emit('on-layer-change', layerId, index)
  }

  /**
   * 全屏
   */
  onToggleScreen() {
    if (this.fullScreen) {
      this.$emit('out-full-screen')
    } else {
      this.$emit('in-full-screen')
    }
  }

  private fullScreenListener(e) {
    if (e.target.id === this.id) {
      this.fullScreen = !this.fullScreen
    }
  }
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
