<template>
  <div class="change-layer-props-container">
    <mapgis-ui-form
      labelAlign="left"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <a-form-item label="渲染模式" v-if="showRenderMode">
        <a-select v-model="renderMode" @change="submit">
          <a-select-option
            v-for="item in renderModes"
            :key="item.label"
            :value="item.value"
          >
            {{ item.label }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <mapgis-ui-form-item label="开启拾取" v-if="showPopupSwitch">
        <mapgis-ui-switch v-model="enablePopup" @change="submit" />
      </mapgis-ui-form-item>
    </mapgis-ui-form>
    <mp-change-extensions
      v-if="showExtensions"
      :extensions.sync="extensions"
      :type="this.layer.layer ? this.layer.layer.type : this.layer.type"
    ></mp-change-extensions>
  </div>
</template>

<script lang="ts">
import { LayerType } from '@mapgis/web-app-framework'
import MpChangeExtensions from '../ChangeExtensions/ChangeExtensions.vue'

export default {
  name: 'MpChangeLayerProps',
  components: { MpChangeExtensions },
  props: ['layer'],
  data() {
    return {
      renderModes: [
        { label: '瓦片', value: 'tile' },
        { label: '图片', value: 'image' },
      ],
      renderMode: 'tile',
      enablePopup: false,
    }
  },
  computed: {
    /**
     * 是否显示渲染模式设置，只支持IGS地图服务和ArcGIS地图服务
     * @returns boolean
     */
    showRenderMode() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      return (
        layer.type === LayerType.IGSMapImage ||
        layer.type === LayerType.ArcGISMapImage
      )
    },
    showPopupSwitch() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      return (
        layer.type === LayerType.IGSMapImage ||
        layer.type === LayerType.IGSVector
      )
    },
    extensions: {
      get() {
        const layer = this.layer.layer ? this.layer.layer : this.layer
        return layer.layerProperty?.extensions || '{}'
      },
      set(val) {
        const layer = this.layer.layer ? this.layer.layer : this.layer
        layer.layerProperty.extensions = val
        this.$emit('update:layer', this.layer)
      },
    },
    showExtensions() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      return (
        layer.type === LayerType.IGSTile ||
        layer.type === LayerType.VectorTile ||
        layer.type === LayerType.ArcGISTile ||
        layer.type === LayerType.WMTS ||
        layer.type === LayerType.WebTile
      )
    },
  },
  watch: {
    layer: {
      handler() {
        this.init()
      },
      deep: true,
      immediate: true,
    },
  },
  created() {
    // this.init()
  },
  methods: {
    /**
     * 初始化
     */
    init() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      if (layer) {
        const { layerProperty } = layer
        if (layerProperty) {
          if (layerProperty.renderMode !== undefined) {
            this.renderMode = layerProperty.renderMode
          }
          if (layerProperty.enablePopup !== undefined) {
            this.enablePopup = layerProperty.enablePopup
          }
        }
      }
    },
    /**
     * 更新配置
     */
    submit() {
      const layer = this.layer.layer ? this.layer.layer : this.layer
      if (layer) {
        const { layerProperty } = layer
        if (layerProperty) {
          layerProperty.renderMode = this.renderMode
          layerProperty.enablePopup = this.enablePopup
        }
      }
      this.$emit('update:layer', this.layer)
    },
  },
}
</script>

<style lang="less" scoped></style>
