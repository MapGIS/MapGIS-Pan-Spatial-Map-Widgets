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
import { WidgetMixin, Objects } from '@mapgis/web-app-framework'

export default {
  name: 'MpSceneModePicker',
  mixins: [WidgetMixin],
  mounted() {
    const { viewer, Cesium } = this
    this.sceneModePicker = new Cesium.SceneModePicker(
      'sceneModePickerContainer',
      viewer.scene
    )
    this.sceneModePicker.viewModel.duration = 0 // 去掉切换动画效果，保持视图位置不变

    this.sceneController = Objects.SceneController.getInstance(
      this.Cesium,
      this.vueCesium,
      this.viewer
    )

    // 监听切换成3D视图之前的事件
    this.sceneModePicker.viewModel.morphTo3D.beforeExecute.addEventListener(
      () => {
        this.getCurrentCenterAndHeight()
      }
    )
    // 监听切换成3D视图之后的事件
    this.sceneModePicker.viewModel.morphTo3D.afterExecute.addEventListener(
      () => {
        this.resetViewer()
      }
    )

    // 监听切换成2D视图之前的事件
    this.sceneModePicker.viewModel.morphTo2D.beforeExecute.addEventListener(
      () => {
        this.getCurrentCenterAndHeight()
      }
    )
    // 监听切换成2D视图之后的事件
    this.sceneModePicker.viewModel.morphTo2D.afterExecute.addEventListener(
      () => {
        this.resetViewer()
      }
    )

    // 监听切换成哥伦比亚视图之前的事件
    this.sceneModePicker.viewModel.morphToColumbusView.beforeExecute.addEventListener(
      () => {
        this.getCurrentCenterAndHeight()
      }
    )
    // 监听切换成哥伦比亚视图之后的事件
    this.sceneModePicker.viewModel.morphToColumbusView.afterExecute.addEventListener(
      () => {
        this.resetViewer()
      }
    )
  },

  methods: {
    /**
     * 获取当前视图中心点和相机高度
     */
    getCurrentCenterAndHeight() {
      const extent = this.sceneController.getCurrentExtent()
      const { xmin, ymin, xmax, ymax, height } = extent

      this.center = {
        lng: (xmin + xmax) / 2,
        lat: (ymin + ymax) / 2,
      }
      this.height = height
    },
    // 重置视图
    resetViewer() {
      if (this.center) {
        const { lng, lat } = this.center
        this.viewer.camera.setView({
          destination: this.Cesium.Cartesian3.fromDegrees(
            lng,
            lat,
            this.height
          ),
        })
      }
    },
  },
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
