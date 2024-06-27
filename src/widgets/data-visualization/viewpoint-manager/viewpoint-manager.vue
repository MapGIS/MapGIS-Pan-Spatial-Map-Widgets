<template>
  <div>
    <mapgis-3d-viewpoint-manager
      @loaded="loaded"
      @change="configSave"
      :viewpoint-config="iconfig"
    >
      <template slot="saveCurrentViewPointAsInit">
        <mapgis-ui-button
          type="primary"
          class="save-as-init-view-point-btn"
          @click="saveAsInitViewPoint(null)"
          >将当前视点设为初始视点</mapgis-ui-button
        >
      </template>
      <template slot="saveAsInitViewPoint" slot-scope="{ viewPoint }">
        <mapgis-ui-tooltip placement="top" title="设为初始视点">
          <mapgis-ui-iconfont
            type="mapgis-kejian"
            @click.stop="saveAsInitViewPoint(viewPoint)"
          />
        </mapgis-ui-tooltip>
      </template>
    </mapgis-3d-viewpoint-manager>
    <mp-window-wrapper :visible="openPromptWindow">
      <template v-slot:default="slotProps">
        <mp-window
          title="提示"
          :verticalOffset="10"
          :visible.sync="openPromptWindow"
          anchor="top-center"
          v-bind="slotProps"
          style="z-index: 9999"
        >
          <template>
            视点信息

            <p class="info" v-if="viewPoint">
              经度：{{ viewPoint.destination.x }}<br />
              纬度：{{ viewPoint.destination.y }}<br />
              高度：{{ viewPoint.destination.z }}<br />
              方位角：{{ viewPoint.orientation.heading }}<br />
              俯仰角：{{ viewPoint.orientation.pitch }}<br />
              翻滚角：{{ viewPoint.orientation.roll }}<br />
            </p>

            是否将该视点设置为初始视点，并同步到服务器？
            <mapgis-ui-setting-footer>
              <mapgis-ui-button @click="cancel"> 取消 </mapgis-ui-button>
              <mapgis-ui-button @click="ok" type="primary">
                确定
              </mapgis-ui-button>
            </mapgis-ui-setting-footer>
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>
  </div>
</template>

<script lang="ts">
import { WidgetMixin, api, baseConfigInstance } from '@mapgis/web-app-framework'

export default {
  name: 'MpViewpointManager',
  mixins: [WidgetMixin],

  data() {
    return {
      openPromptWindow: false,
      viewPoint: undefined,
    }
  },

  computed: {
    iconfig() {
      return this.widget.config
    },
  },

  methods: {
    /**
     * 获取当前视点信息
     */
    getCurrentViewPoint() {
      const { Cesium, viewer } = this
      const cartesian3 = viewer.camera.position
      const ellipsoid = viewer.scene.globe.ellipsoid
      const cartographic = ellipsoid.cartesianToCartographic(cartesian3)
      const latitude = Cesium.Math.toDegrees(cartographic.latitude)
      const longitude = Cesium.Math.toDegrees(cartographic.longitude)
      const height = cartographic.height

      const heading = Cesium.Math.toDegrees(viewer.camera.heading)
      const pitch = Cesium.Math.toDegrees(viewer.camera.pitch)
      const roll = Cesium.Math.toDegrees(viewer.camera.roll)

      const currentView = {
        destination: {
          x: longitude,
          y: latitude,
          z: height,
        },
        orientation: {
          heading,
          pitch,
          roll,
        },
      }
      return currentView
    },
    /**
     * 获取要设置为初始视点的视点信息
     */
    saveAsInitViewPoint(viewPoint) {
      if (!viewPoint) {
        viewPoint = this.getCurrentViewPoint()
      }
      this.viewPoint = viewPoint
      // 打开提示窗
      this.openPromptWindow = true
    },
    /**
     * 点击提示窗 确定 按钮 事件
     */
    async ok() {
      // 更新基础配置里的参数
      const baseConfig = baseConfigInstance.config
      const { destination, orientation } = this.viewPoint
      baseConfig.center = `${destination.x},${destination.y}`
      baseConfig.initAltitude = destination.z
      baseConfig.initOrientation = { ...orientation }

      // 更新数据库里对应的配置
      const res = await api.getBaseConfig('app.display')
      const appDisplay = res.data
      const displayConfigValue = JSON.parse(appDisplay.configValue)
      displayConfigValue.center = `${destination.x},${destination.y}`
      displayConfigValue.initAltitude = destination.z
      displayConfigValue.initOrientation = { ...orientation }

      api.saveBaseConfig({
        ...appDisplay,
        configValue: JSON.stringify(displayConfigValue),
      })

      // 关闭提示窗
      this.openPromptWindow = false
    },
    /**
     * 点击提示窗 取消 按钮 事件
     */
    cancel() {
      // 关闭提示窗
      this.openPromptWindow = false
    },
    configSave(newConfig) {
      api.saveWidgetConfig({
        name: 'viewpoint-manager',
        config: JSON.stringify(newConfig),
      })
    },

    /**
     * 微件打开时
     */
    onOpen() {
      this.viewpoint.mount()
    },

    /**
     * 微件关闭时
     */
    onClose() {
      this.viewpoint.unmount()
    },

    loaded(viewpoint) {
      this.viewpoint = viewpoint
    },
  },
}
</script>

<style lang="scss" scoped>
.info {
  font-size: 14px;
  margin-left: 15px;
}

.info-window {
  z-index: 9999;
}

.save-as-init-view-point-btn {
  width: 100%;
}
</style>
