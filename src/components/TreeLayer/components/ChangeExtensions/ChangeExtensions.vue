<template>
  <div class="change-extensions">
    <mapgis-ui-form
      labelAlign="left"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <mapgis-ui-form-item label="高级属性">
        <mapgis-ui-input
          v-model="extensions"
          placeholder="请输入高级属性"
          type="textarea"
          allow-clear
          @click="extensionsEditVisible = true"
        />
        <mapgis-ui-button
          style="float: right"
          type="primary"
          size="small"
          @click="editExtensions"
        >
          编辑
        </mapgis-ui-button>
      </mapgis-ui-form-item>
    </mapgis-ui-form>
    <mapgis-ui-pop-jsoneditor-dialog
      title="编辑高级属性"
      width="65%"
      :visible="extensionsEditVisible"
      :config="extensionsObject"
      :markdown="markdownText"
      :moreInfoUrl="moreInfoUrl"
      @ok="updateExtensions"
      @cancel="extensionsEditVisible = false"
    >
    </mapgis-ui-pop-jsoneditor-dialog>
  </div>
</template>

<script lang="ts">
import { LayerType } from '@mapgis/web-app-framework'
import { tiles3DMarkdownText, imageryMarkdownText } from '../markdown/markdown'

export default {
  name: 'MpChangeExtensions',
  props: {
    // 高级属性
    extensions: { type: String, default: '{}' },
    // 图层类型
    type: { type: Number, default: 0 },
  },
  data() {
    return {
      extensionsEditVisible: false,
    }
  },
  computed: {
    /**
     * 图层属性中的高级属性
     */
    extensionsObject() {
      return JSON.parse(this.extensions || '{}')
    },
    /**
     * 高级属性对应的参数说明文档
     */
    markdownText() {
      if ([LayerType.IGSScene, LayerType.ModelCache].includes(this.type)) {
        return tiles3DMarkdownText
      } else if (
        [
          LayerType.IGSTile,
          LayerType.VectorTile,
          LayerType.ArcGISTile,
          LayerType.WMTS,
          LayerType.WebTile,
        ].includes(this.type)
      ) {
        return imageryMarkdownText
      }
      return undefined
    },
    /**
     * 高级属性中参数说明中的更多参数说明链接
     */
    moreInfoUrl() {
      if ([LayerType.IGSScene, LayerType.ModelCache].includes(this.type)) {
        return 'http://webclient.smaryun.com/static/modules/cesium/api/cesium/Cesium3DTileset.html#.ConstructorOptions'
      }
      return undefined
    },
  },
  methods: {
    /** 编辑图层属性中的扩展属性 */
    editExtensions() {
      this.extensionsEditVisible = true
    },
    /**
     * 更新图层属性中的其他属性
     * 新增的extensions属性，以支持通过对象的方式批量传入图层属性，
     * 但是优先级低于单个传入属性，即如果单个属性有传入值，优先使用传入的值，
     * 如果没有传入，但是extensions中有该属性，则使用extensions里对应的值
     * 修改者：龚跃健 2024/10/28
     */
    updateExtensions({ config }) {
      let tempConfig = config
      if (typeof config === 'object') {
        tempConfig = JSON.stringify(config, null, 2)
      }
      this.$emit('update:extensions', tempConfig)
      this.extensionsEditVisible = false
    },
  },
}
</script>

<style lang="less" scoped></style>
