<template>
  <mapgis-ui-setting-form class="swipe-setting" layout="vertical" size="small">
    <mapgis-ui-form-item :label="`${directionLayerTitle.aboveTitle}图层`">
      <mapgis-ui-select :value="aboveLayer.id" @change="onAboveChange">
        <mapgis-ui-select-option
          v-for="p in aboveLayers"
          :key="p.id"
          :value="p.id"
          :title="p.title"
          >{{ p.title }}</mapgis-ui-select-option
        >
      </mapgis-ui-select>
    </mapgis-ui-form-item>
    <mapgis-ui-form-item :label="`${directionLayerTitle.belowTitle}图层`">
      <mapgis-ui-select :value="belowLayer.id" @change="onBelowChange">
        <mapgis-ui-select-option
          v-for="p in belowLayers"
          :key="p.id"
          :value="p.id"
          :title="p.title"
          >{{ p.title }}</mapgis-ui-select-option
        >
      </mapgis-ui-select>
    </mapgis-ui-form-item>
    <mapgis-ui-form-item label="类型">
      <mapgis-ui-radio-group :value="direction" @change="onDirectionChange">
        <mapgis-ui-radio value="vertical"> 垂直 </mapgis-ui-radio>
        <mapgis-ui-radio value="horizontal"> 水平 </mapgis-ui-radio>
      </mapgis-ui-radio-group>
    </mapgis-ui-form-item>
  </mapgis-ui-setting-form>
</template>

<script lang="ts">
export default {
  name: 'SwipeSetting',
  inject: {
    swipe: {
      from: 'swipe',
      default: () => ({}),
    },
  },
  computed: {
    // 卷帘方向
    direction() {
      return this.swipe.direction || 'vertical'
    },
    // 卷帘方向变化，同步更改图层选择框的标题
    directionLayerTitle(): {
      aboveTitle: string
      belowTitle: string
    } {
      let aboveTitle = '左侧'
      let belowTitle = '右侧'
      if (this.direction !== 'vertical') {
        aboveTitle = '上层'
        belowTitle = '下层'
      }
      return {
        aboveTitle,
        belowTitle,
      }
    },
    // 上级(左侧)图层
    aboveLayer() {
      return this.swipe.aboveLayer || {}
    },
    // 下级(右侧)图层
    belowLayer() {
      return this.swipe.belowLayer || {}
    },

    // 上级(左侧)图层列表
    aboveLayers() {
      return this.swipe.aboveLayers || []
    },

    // 下级(右侧)图层列表
    belowLayers() {
      return this.swipe.belowLayers || []
    },
  },
  methods: {
    /**
     * 上层(左侧)图层变化
     */
    onAboveChange(value: string) {
      this.swipe.onAboveChange(value)
    },

    /**
     * 下层(右侧)图层变化
     */
    onBelowChange(value: string) {
      this.swipe.onBelowChange(value)
    },

    /**
     * 卷帘方向变化
     */
    onDirectionChange(e) {
      this.swipe.onDirectChange(e.target.value)
    },
  },
}
</script>
<style lang="less" scoped>
.swipe-setting {
  width: 100%;
  height: 100%;
  .mapgis-ui-form-item {
    margin-bottom: 0;
  }
}
</style>
