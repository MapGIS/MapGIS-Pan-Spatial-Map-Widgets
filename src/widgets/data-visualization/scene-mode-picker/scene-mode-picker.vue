<template>
  <div class="mp-widget-scene-mode-picker">
    <mapgis-ui-tooltip
      title="场景模式切换"
      placement="top"
      :overlay-style="{ zIndex: 1000 }"
    >
      <div id="sceneModePickerContainer" v-show="!is2DMapMode"></div>
    </mapgis-ui-tooltip>
  </div>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpSceneModePicker',
  mixins: [WidgetMixin],
  computed: {},
  mounted() {
    const { viewer, Cesium } = this
    const sceneModePicker = new Cesium.SceneModePicker(
      'sceneModePickerContainer',
      viewer.scene
    )
    sceneModePicker.viewModel.duration = 0 // 去掉切换动画效果，保持视图位置不变
  },

  methods: {},
}
</script>

<style lang="scss" scoped>
.mp-widget-scene-mode-picker {
  white-space: nowrap;
  ::v-deep span.cesium-sceneModePicker-wrapper {
    margin: 0px;
    .cesium-sceneModePicker-selected {
      border: none;
      box-shadow: none;
    }
    .cesium-button {
      fill: $text-color;
      background: $btn-theme-bg;
      border: none;
      &:hover {
        color: $primary-color;
        fill: $primary-color;
        // background: rgb(48, 51, 54);
        border: none;
        box-shadow: none;
        -webkit-box-shadow: none;
      }
      .cesium-svgPath-svg {
        width: 65%;
        margin-left: 5px;
      }
    }
  }
}
</style>
