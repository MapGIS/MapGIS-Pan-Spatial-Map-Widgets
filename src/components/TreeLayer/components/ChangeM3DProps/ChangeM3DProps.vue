<template>
  <div class="change-m3d-props-container">
    <mapgis-ui-form
      labelAlign="left"
      :label-col="{ span: 14 }"
      :wrapper-col="{ span: 10 }"
    >
      <mapgis-ui-form-item label="最大屏幕空间误差">
        <mapgis-ui-input-number
          v-model="maximumScreenSpaceError"
          :min="0"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="开启拾取">
        <mapgis-ui-switch v-model="enablePopup" />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="开启多模态切换">
        <mapgis-ui-switch v-model="enableModelSwitch" />
      </mapgis-ui-form-item>
      <mapgis-ui-input-number-panel
        size="large"
        label="模型阴影区域亮度调节"
        v-model="luminanceAtZenith"
        :range="[0, 200]"
        :step="0.2"
        @change="luminanceAtZenithChange"
      />
      <mapgis-ui-switch-panel
        size="default"
        label="模型拉伸"
        v-model="enableModelStretch"
      >
        <mapgis-ui-input-number-panel
          v-model="scaleZ"
          size="large"
          :step="0.5"
          :slider="true"
          :range="[1, 20]"
          label="拉伸级别"
        />
        <mapgis-ui-form-item label="偏移量">
          <mapgis-ui-input-number-addon
            v-model.number="offset"
            :step="0.5"
            addon-after="米"
          />
        </mapgis-ui-form-item>
      </mapgis-ui-switch-panel>
      <div style="textalign: right">
        <mapgis-ui-button type="primary" @click="submit">
          确认
        </mapgis-ui-button>
      </div>
    </mapgis-ui-form>
  </div>
</template>

<script lang="ts">
import { LayerType } from '@mapgis/web-app-framework'
import UnifyModifyVue from '../UnifyModify/UnifyModify.vue'

export default {
  name: 'MpChangeM3DProps',
  props: ['layer'],
  data() {
    return {
      maximumScreenSpaceError: this.layer.maximumScreenSpaceError,
      enableModelSwitch: false,
      enablePopup: false,
      luminanceAtZenith: 10,
      enableModelStretch: false,
      scaleZ: 1,
      offset: -2,
    }
  },
  watch: {
    layer: {
      handler: 'init',
      immediate: true,
      deep: true,
    },
    scaleZ: {
      handler(val) {
        this.$emit('update:scaleZ', { scaleZ: val, offset: this.offset })
      },
      deep: true,
    },
    enableModelStretch: {
      handler(val) {
        this.$emit('update:enableModelStretch', val)
      },
      deep: true,
    },
  },
  methods: {
    init() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      if (layer !== undefined) {
        const { layerProperty } = layer
        let { enablePopup, enableModelSwitch, luminanceAtZenith } = layer
        if (layerProperty !== undefined) {
          if (layerProperty.enablePopup !== undefined) {
            enablePopup = layerProperty.enablePopup
          }
          if (layerProperty.enableModelSwitch !== undefined) {
            enableModelSwitch = layerProperty.enableModelSwitch
          }
          if (layerProperty.luminanceAtZenith !== undefined) {
            luminanceAtZenith = layerProperty.luminanceAtZenith
          }

          this.enableModelStretch =
            layerProperty.enableModelStretch !== undefined
              ? layerProperty.enableModelStretch
              : false
          this.scaleZ =
            layerProperty.scaleZ !== undefined ? layerProperty.scaleZ : 1
          this.offset =
            layerProperty.offset !== undefined ? layerProperty.offset : -2

          // layerProperty = {
          //   enableModelStretch: false,
          //   enableModelSwitch: false,
          //   enablePopup: false,
          //   luminanceAtZenith: 2,
          //   maximumScreenSpaceError: 16,
          //   offset: -2,
          //   opacity: 100,
          //   scaleX: 1,
          //   scaleY: 1,
          //   scaleZ: 1,
          // }
        }
        this.enablePopup = enablePopup !== undefined ? enablePopup : false
        this.enableModelSwitch =
          enableModelSwitch !== undefined ? enableModelSwitch : false

        this.luminanceAtZenith =
          luminanceAtZenith !== undefined ? luminanceAtZenith : 10
      }
    },
    submit() {
      console.log(this.layer)
      if (this.layer.maximumScreenSpaceError !== undefined) {
        this.layer.maximumScreenSpaceError = this.maximumScreenSpaceError
      }
      if (this.layer.luminanceAtZenith !== undefined) {
        this.layer.luminanceAtZenith = this.luminanceAtZenith
      }
      if (this.layer.layer) {
        this.layer.layer.enablePopup = this.enablePopup
        this.layer.layer.enableModelSwitch = this.enableModelSwitch
      } else {
        this.layer.enablePopup = this.enablePopup
        this.layer.enableModelSwitch = this.enableModelSwitch
      }
      this.$emit('update:layer', this.layer)
    },

    luminanceAtZenithChange() {
      this.layer.luminanceAtZenith = this.luminanceAtZenith
      this.$emit('update:luminanceAtZenith', this.layer)
    },
  },
}
</script>

<style lang="less" scoped>
.select-tilematrixSet {
  margin: 0.5em;
}
.top-02em {
  margin-top: 0.2em;
}
</style>
