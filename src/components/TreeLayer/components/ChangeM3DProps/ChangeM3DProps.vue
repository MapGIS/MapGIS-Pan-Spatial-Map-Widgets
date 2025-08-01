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
      <mapgis-ui-form-item label="最大内存使用量">
        <mapgis-ui-input-number
          v-model="maximumMemoryUsage"
          :min="0"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="开启拾取">
        <mapgis-ui-switch v-model="enablePopup" @change="enablePopupChange" />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="开启模型包围盒">
        <mapgis-ui-switch
          v-model="enableModelBoundingBox"
          @change="enableModelBoundingBoxChange"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="开启模型坐标网格">
        <mapgis-ui-switch
          v-model="enableModelCoordinateGrid"
          @change="enableModelCoordinateGridChange"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item v-if="enableModelCoordinateGrid">
        <mapgis-ui-radio-group
          v-model="coordinateGridType"
          :options="[
            { label: '坐标类型', value: 'coordinate' },
            { label: '网格类型', value: 'grid' },
          ]"
          @change="coordinateGridTypeChange"
        >
        </mapgis-ui-radio-group>
      </mapgis-ui-form-item>
      <mapgis-ui-input-number-panel
        size="large"
        label="模型阴影区域亮度调节"
        v-model="luminanceAtZenith"
        :range="[0, 100]"
        :step="0.2"
        @change="luminanceAtZenithChange"
      />
      <mp-model-stretch-ui
        :enableModelStretch.sync="enableModelStretch"
        :scaleZ.sync="scaleZ"
        :offset.sync="offset"
        :textureScale.sync="textureScale"
      />
      <div style="textalign: right">
        <mapgis-ui-button type="primary" @click="submit">
          确认
        </mapgis-ui-button>
      </div>
    </mapgis-ui-form>
  </div>
</template>

<script lang="ts">
import { LayerType, IGSSceneSublayerType } from '@mapgis/web-app-framework'
import UnifyModifyVue from '../UnifyModify/UnifyModify.vue'
import MpModelStretchUi from '../../../ModelStretch/ModelStretchUi.vue'

export default {
  name: 'MpChangeM3DProps',
  components: { 'mp-model-stretch-ui': MpModelStretchUi },
  props: ['layer'],
  data() {
    return {
      maximumScreenSpaceError: 16,
      maximumMemoryUsage: 512,
      enablePopup: false,
      luminanceAtZenith: 10,
      enableModelStretch: false,
      scaleZ: 1,
      offset: -2,
      // 是否开启纹理拉伸
      textureScale: false,
      enableModelBoundingBox: false,
      enableModelCoordinateGrid: false,
      coordinateGridType: 'coordinate',
    }
  },
  computed: {
    /**
     * 判断是否是三维图层
     * @returns boolean
     */
    isIGSScene() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      if (layer.type === LayerType.IGSScene) {
        if (layer.activeScene) {
          const { type } = layer.activeScene.sublayers[0]
          if (type === IGSSceneSublayerType.modelCache) {
            // 模型拉伸只支持模型
            return true
          }
        }
      }
      return false
    },
  },
  watch: {
    layer: {
      // 深度监听传入的layer对象，处理enablePopup属性
      handler() {
        this.handelEnablePopupChange()
      },
      immediate: false,
      deep: true,
    },
    scaleZ: {
      handler(val) {
        this.$emit('update:scaleZ', {
          enableModelStretch: this.enableModelStretch,
          scaleZ: this.scaleZ,
          offset: this.offset,
          textureScale: this.textureScale,
        })
      },
      deep: true,
    },
    enableModelStretch: {
      handler(val) {
        this.$emit('update:enableModelStretch', {
          enableModelStretch: this.enableModelStretch,
          scaleZ: this.scaleZ,
          offset: this.offset,
          textureScale: this.textureScale,
        })
      },
      deep: true,
    },
    textureScale: {
      handler(val) {
        this.$emit('update:textureScale', {
          enableModelStretch: this.enableModelStretch,
          scaleZ: this.scaleZ,
          offset: this.offset,
          textureScale: this.textureScale,
        })
      },
      deep: true,
    },
  },
  created() {
    this.init()
  },
  methods: {
    init() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      if (layer) {
        const { layerProperty } = layer
        // 后续这些属性直接取layerProperty中的属性
        let { enablePopup, luminanceAtZenith, maximumScreenSpaceError } = layer
        if (layerProperty) {
          if (layerProperty.maximumScreenSpaceError !== undefined) {
            maximumScreenSpaceError = layerProperty.maximumScreenSpaceError
          }
          if (layerProperty.enablePopup !== undefined) {
            enablePopup = layerProperty.enablePopup
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
          this.textureScale =
            layerProperty.textureScale !== undefined
              ? layerProperty.textureScale
              : false
          this.maximumMemoryUsage =
            layerProperty.maximumMemoryUsage !== undefined
              ? layerProperty.maximumMemoryUsage
              : this.maximumMemoryUsage
        }
        this.maximumScreenSpaceError =
          maximumScreenSpaceError !== undefined ? maximumScreenSpaceError : 16

        this.enablePopup = enablePopup !== undefined ? enablePopup : false

        this.luminanceAtZenith =
          luminanceAtZenith !== undefined ? luminanceAtZenith : 10

        if (this.enableModelStretch) {
          this.$emit('update:scaleZ', {
            enableModelStretch: this.enableModelStretch,
            scaleZ: this.scaleZ,
            offset: this.offset,
            textureScale: this.textureScale,
          })
        }
      }
    },
    submit() {
      if (this.layer.maximumScreenSpaceError !== undefined) {
        this.layer.maximumScreenSpaceError = this.maximumScreenSpaceError
      }
      if (this.layer.luminanceAtZenith !== undefined) {
        this.layer.luminanceAtZenith = this.luminanceAtZenith
      }
      if (this.layer.layer) {
        this.layer.layer.enablePopup = this.enablePopup
      } else {
        this.layer.enablePopup = this.enablePopup
      }
      const layer = this.layer.layer ? this.layer.layer : this.layer
      if (layer) {
        const { layerProperty } = layer
        if (layerProperty) {
          layerProperty.maximumScreenSpaceError = this.maximumScreenSpaceError
          layerProperty.maximumMemoryUsage = this.maximumMemoryUsage
          layerProperty.luminanceAtZenith = this.luminanceAtZenith
          layerProperty.enablePopup = this.enablePopup
          layerProperty.enableModelStretch = this.enableModelStretch
          layerProperty.scaleZ = this.scaleZ
          layerProperty.offset = this.offset
          layerProperty.textureScale = this.textureScale
        }
      }
      this.$emit('update:layer', this.layer)
    },

    luminanceAtZenithChange() {
      if (this.layer.luminanceAtZenith === this.luminanceAtZenith) return
      this.layer.luminanceAtZenith = this.luminanceAtZenith
      if (this.layer.layerProperty !== undefined) {
        this.layer.layerProperty.luminanceAtZenith = this.luminanceAtZenith
      }
      this.$emit('update:luminanceAtZenith', this.layer)
    },
    enableModelBoundingBoxChange(val) {
      this.$emit('update:modelBoundingBox', val, this.layer.id)
    },
    enableModelCoordinateGridChange(val) {
      this.$emit(
        'update:modelCoordinateGrid',
        val,
        this.coordinateGridType,
        this.layer.id
      )
    },
    coordinateGridTypeChange(val) {
      this.$emit(
        'update:modelCoordinateGrid',
        true,
        val.target.value,
        this.layer.id
      )
    },
    handelEnablePopupChange() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      if (layer) {
        const { layerProperty } = layer
        let { enablePopup } = layer
        if (layerProperty) {
          if (layerProperty.enablePopup !== undefined) {
            enablePopup = layerProperty.enablePopup
          }
          this.enablePopup = enablePopup !== undefined ? enablePopup : false
        }
      }
    },
    enablePopupChange() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      this.$emit('update:pick', layer.id, this.enablePopup)
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
