<template>
  <div class="change-layer-props-container">
    <mapgis-ui-form
      labelAlign="left"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
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
      <mapgis-ui-form-item v-if="showtileRenderMode">
        <span slot="label">
          显示策略
          <mapgis-ui-tooltip
            title="超过瓦片的请求层级范围后，设置拉伸瓦片还是隐藏瓦片"
          >
            <mapgis-ui-iconfont type="mapgis-info"></mapgis-ui-iconfont>
          </mapgis-ui-tooltip>
        </span>
        <a-select v-model="tileDisplayMode" @change="submit">
          <a-select-option
            v-for="item in tileDisplayModes"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </a-select-option>
        </a-select>
      </mapgis-ui-form-item>
      <mapgis-ui-form-item v-if="showtileRenderMode">
        <span slot="label">
          层级范围
          <mapgis-ui-tooltip
            title="请求瓦片的层级范围，不在这个范围内不会发送瓦片请求，当显示模式设置为拉伸时，最小层级设置过大可能有性能问题"
          >
            <mapgis-ui-iconfont type="mapgis-info"></mapgis-ui-iconfont>
          </mapgis-ui-tooltip>
        </span>
        <mapgis-ui-slider
          range
          :marks="marks"
          :default-value="layerLevelRange"
          :step="1"
          :min="0"
          :max="lods.length - 1"
          @change="changeLayerLevels"
        />
      </mapgis-ui-form-item>
    </mapgis-ui-form>
    <mapgis-ui-form-item v-if="showtileRenderMode" label="瓦片信息">
      <mapgis-ui-table
        size="small"
        :columns="columns"
        :data-source="lodSource"
        :pagination="false"
        :scroll="{ y: 240, x: 'max-content' }"
      >
        <!-- 自定义index列 -->
        <span
          slot="index"
          slot-scope="text, record"
          :style="{ color: getTextColorByLevel(record.index) }"
          :title="text"
          >{{ text }}
        </span>

        <!-- 自定义level列 -->
        <span
          slot="levelValue"
          slot-scope="text, record"
          :style="{ color: getTextColorByLevel(record.index) }"
          :title="text"
        >
          {{ text }}
        </span>

        <!-- 自定义scale列 -->
        <span
          slot="scale"
          slot-scope="text, record"
          :style="{ color: getTextColorByLevel(record.index) }"
          :title="text"
        >
          {{ text }}
        </span>
      </mapgis-ui-table>
    </mapgis-ui-form-item>
    <mp-change-extensions
      v-if="showExtensions"
      :extensions.sync="extensions"
      :type="this.layer.layer ? this.layer.layer.type : this.layer.type"
      @update:extensions="changeExtensions"
    ></mp-change-extensions>
    <div>
      <mapgis-ui-button
        class="edit-tool-button"
        type="primary"
        @click="saveConfig"
        style="width: 48%; margin-right: 4%"
      >
        保存设置
      </mapgis-ui-button>
    </div>
  </div>
</template>

<script lang="ts">
import { LayerType, api } from '@mapgis/web-app-framework'
import MpChangeExtensions from '../ChangeExtensions/ChangeExtensions.vue'
import { TileInfoUtil } from '@mapgis/webclient-common'

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
      tileDisplayModes: [
        { label: '超出瓦片层级后拉伸', value: 'stretch' },
        { label: '超出瓦片层级后隐藏', value: 'hide' },
      ],
      tileDisplayMode: 'stretch',
      renderMode: 'tile',
      enablePopup: false,
      layerLevelRange: [0, 22],
      marks: {
        0: '0',
        22: '22',
      },
      columns: [
        {
          title: '层级',
          dataIndex: 'index',
          /**
           * fix(30079): 对于从第3级开始的WMTS服务，高级属性中查看比例尺信息，始终从0开始
           * 修改说明：渲染列表时，设置固定宽度，避免渲染table列错位
           * 修改人：杨琨
           * 日期：2022-12-5
           */
          width: '25%',
          key: 'index',
          scopedSlots: { customRender: 'index' },
        },
        {
          title: '层级值',
          dataIndex: 'levelValue',
          key: 'levelValue',
          width: '25%',
          scopedSlots: { customRender: 'levelValue' },
        },
        {
          title: '比例尺',
          dataIndex: 'scale',
          key: 'scale',
          width: '50%',
          scopedSlots: { customRender: 'scale' },
        },
      ],
      extensions: '{}',
    }
  },
  computed: {
    /**
     * 是否显示渲染模式设置，只支持IGS地图服务和ArcGIS地图服务
     * @returns boolean
     */
    showRenderMode() {
      return (
        this.targetLayer.type === LayerType.IGSMapImage ||
        this.targetLayer.type === LayerType.ArcGISMapImage
      )
    },
    showPopupSwitch() {
      return (
        this.targetLayer.type === LayerType.IGSMapImage ||
        this.targetLayer.type === LayerType.IGSVector
      )
    },
    showExtensions() {
      return (
        this.targetLayer.type === LayerType.IGSTile ||
        this.targetLayer.type === LayerType.VectorTile ||
        this.targetLayer.type === LayerType.ArcGISTile ||
        this.targetLayer.type === LayerType.OGCWMTS ||
        this.targetLayer.type === LayerType.WebTile
      )
    },
    showtileRenderMode() {
      return (
        this.targetLayer.type === LayerType.IGSTile ||
        this.targetLayer.type === LayerType.VectorTile ||
        this.targetLayer.type === LayerType.ArcGISTile ||
        this.targetLayer.type === LayerType.OGCWMTS ||
        this.targetLayer.type === LayerType.WebTile
      )
    },
    lods() {
      const tileInfo = TileInfoUtil.getTileInfoByLayer(
        this.targetLayer._innerLayer
      )
      return tileInfo.lods
    },
    lodSource() {
      const lodSource = []
      this.lods.forEach((lod, index) => {
        lodSource.push({
          key: index,
          index: index,
          /**
           * fix(30079): 对于从第3级开始的WMTS服务，高级属性中查看比例尺信息，始终从0开始
           * 修改说明：渲染层级值列时，使用lod.levelValue来渲染
           * 修改人：yangkun
           * 日期：2022-12-5
           */
          levelValue: lod.levelValue,
          scale: '1:' + lod.scale,
        })
      })
      return lodSource
    },
    targetLayer() {
      return this.layer.layer ? this.layer.layer : this.layer
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
      if (this.targetLayer) {
        const { layerProperty } = this.targetLayer
        if (layerProperty) {
          if (layerProperty.renderMode !== undefined) {
            this.renderMode = layerProperty.renderMode
          }
          if (layerProperty.enablePopup !== undefined) {
            this.enablePopup = layerProperty.enablePopup
          }
        }
        if (this.showtileRenderMode) {
          const startLevel =
            layerProperty.startLevel >= 0 ? layerProperty.startLevel : 0
          const endLevel =
            layerProperty.endLevel >= 0 ? layerProperty.endLevel : 22
          this.layerLevelRange = [startLevel, endLevel]
          this.marks = {
            0: 0,
          }
          this.marks[this.lods.length - 1] = this.lods.length - 1
          this.tileDisplayMode =
            layerProperty.tileDisplayMode || this.tileDisplayMode
        }
      }
      this.extensions = this.targetLayer.layerProperty?.extensions || '{}'
    },
    /**
     * 更新配置
     */
    submit() {
      if (this.targetLayer) {
        const { layerProperty } = this.targetLayer
        if (layerProperty) {
          layerProperty.renderMode = this.renderMode
          layerProperty.enablePopup = this.enablePopup
          if (this.showtileRenderMode) {
            layerProperty.tileDisplayMode = this.tileDisplayMode
            this.extensions = JSON.parse(this.extensions)
            if (this.extensions.hasOwnProperty('isStretchImage')) {
              this.extensions.isStretchImage =
                this.tileDisplayMode === 'stretch'
            }
            this.extensions = JSON.stringify(this.extensions)
            layerProperty.extensions = this.extensions
          }
        }
      }
      this.$emit('update:layer', this.layer)
    },
    changeExtensions(val) {
      this.targetLayer.layerProperty.extensions = val
      const extensions = JSON.parse(val)
      if (extensions.hasOwnProperty('isStretchImage')) {
        if (extensions.isStretchImage) {
          this.tileDisplayMode = 'stretch'
        } else {
          this.tileDisplayMode = 'hide'
        }
        this.targetLayer.layerProperty.tileDisplayMode = this.tileDisplayMode
      }
      this.$emit('update:layer', this.layer)
    },
    changeLayerLevels(val) {
      if (this.targetLayer) {
        const { layerProperty } = this.targetLayer
        if (layerProperty) {
          layerProperty.startLevel = val[0]
          layerProperty.endLevel = val[1]
          this.layerLevelRange = [val[0], val[1]]
        }
      }
      this.$emit('update:layer', this.layer)
    },
    getTextColorByLevel(level) {
      let color = 'gray'
      if (
        level >= this.layerLevelRange[0] &&
        level <= this.layerLevelRange[1]
      ) {
        color = ''
      }
      return color
    },
    saveConfig() {
      api
        .updateData({
          dataId: this.targetLayer.dataId,
          layerProperty: this.targetLayer.layerProperty,
        })
        .then((response) => {
          if (response.code === 200) {
            this.$message.success('保存成功')
          }
        })
    },
  },
}
</script>

<style lang="less" scoped>
.mapgis-ui-form-item {
  margin-bottom: 10px;
}
</style>
