<template>
  <!-- 蜂窝图 -->
  <mapgis-3d-mapv-layer
    v-if="geojson && geojson.features && !!geojson.features.length"
    :geojson="geojson"
    :options="options"
    :count-field="field"
  />
</template>
<script lang="ts">
import BaseMixin from '../../mixins/base'

export default {
  name: 'CesiumHexBin',
  mixins: [BaseMixin],
  computed: {
    // 蜂窝图配置项
    // 新旧版本的样式设置对比参照 https://shimowendang.com/docs/gO3oxMwgNmHJddqD
    // 此处只对新版的样式兼容，旧版的每个字段没有具体说明，无法和新版对应起来
    options() {
      return {
        cesium: {
          postRender: true,
          postRenderFrame: 0,
        },
        context: '2d',
        draw: 'honeycomb',
        ...(this.subjectData?.themeStyle || {}),
      }
    },
  },
}
</script>
