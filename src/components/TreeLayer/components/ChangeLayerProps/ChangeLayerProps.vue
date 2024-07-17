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
    </mapgis-ui-form>
  </div>
</template>

<script lang="ts">
import { LayerType } from '@mapgis/web-app-framework'

export default {
  name: 'MpChangeLayerProps',
  props: ['layer'],
  data() {
    return {
      renderModes: [
        { label: '瓦片', value: 'tile' },
        { label: '图片', value: 'image' },
      ],
      renderMode: 'tile',
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
  },
  created() {
    this.init()
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
        }
      }
      this.$emit('update:layer', this.layer)
    },
  },
}
</script>

<style lang="less" scoped></style>
