<template>
  <div>
    <mapgis-3d-scene-setting
      @loaded="loaded"
      :initialStatebar="initialStatebar"
      :initParams="config"
      ref="sceneSetting"
    >
    </mapgis-3d-scene-setting>
    <mapgis-ui-setting-footer>
      <mapgis-ui-button @click="syncToServer" type="primary" class="full-width">
        同步到服务器
      </mapgis-ui-button>
    </mapgis-ui-setting-footer>
  </div>
</template>

<script lang="ts">
import { WidgetMixin, api } from '@mapgis/web-app-framework'

export default {
  name: 'MpSceneSetting',
  mixins: [WidgetMixin],
  data() {
    return {
      // 页面布局方式
      layout: 'horizontal',
      initialStatebar: true,
    }
  },

  computed: {
    config() {
      let { config } = this.widgetInfo
      if (window.localStorage.sceneSetting) {
        config = JSON.parse(window.localStorage.sceneSetting)
      }
      return config
    },
  },

  methods: {
    /**
     * 微件打开时
     */
    onOpen() {
      this.setting.mount()
    },

    /**
     * 微件关闭时
     */
    onClose() {
      this.setting.unmount()
      this.syncToLocalStorage()
    },

    // 微件失活时
    onDeActive() {
      this.syncToLocalStorage()
    },

    loaded(setting) {
      this.setting = setting
    },

    syncToServer() {
      const self = this
      this.$confirm({
        title: '提示',
        content: '是否将配置同步到服务器?',
        onOk() {
          self.saveConfig()
        },
        onCancel() {},
      })
    },

    syncToLocalStorage() {
      const config = this.getConfig()
      window.localStorage.sceneSetting = JSON.stringify(config)
    },

    getConfig() {
      const {
        initBasicSetting,
        initCameraSetting,
        initLightSetting,
        initWeatherSetting,
        initEffectSetting,
      } = this.$refs.sceneSetting
      const config = {
        basicSetting: initBasicSetting,
        cameraSetting: initCameraSetting,
        lightSetting: initLightSetting,
        weatherSetting: initWeatherSetting,
        effectSetting: initEffectSetting,
      }
      return config
    },

    saveConfig() {
      const config = this.getConfig()
      console.log(config)
      api
        .saveWidgetConfig({
          name: 'scene-setting',
          config: JSON.stringify(config),
        })
        .then(() => {
          // this.$message.success('更新场景设置配置成功')
          // console.log('更新场景设置配置成功')
        })
        .catch(() => {
          // this.$message.error('更新场景设置配置失败')
          // console.log('更新场景设置配置失败')
        })
    },
  },
}
</script>

<style lang="less" scoped>
.full-width {
  width: 100%;
}
</style>
