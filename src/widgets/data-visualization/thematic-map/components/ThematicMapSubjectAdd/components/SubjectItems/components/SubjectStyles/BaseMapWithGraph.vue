<template>
  <!-- 统计专题图 -->
  <div class="base-map-with-graph">
    <!-- <mapgis-ui-empty :image-style="emptyImageStyle" description="暂无配置" /> -->
    <mapgis-ui-row-flex label="统计图类型" :label-width="120">
      <mapgis-ui-select
        autoWidth
        :options="graphTypeList"
        v-model="graphType"
        :dropdownMenuStyle="{ maxHeight: '150px' }"
        placeholder="请选择统计图类型"
      />
    </mapgis-ui-row-flex>
  </div>
</template>
<script lang="ts">
const graphTypeList = [
  { value: 'point', label: '散点图' },
  { value: 'pie', label: '饼图' },
  { value: 'bar', label: '柱状图' },
  { value: 'bar3d', label: '3D 柱状图' },
  { value: 'line', label: '折线图' },
  { value: 'ring', label: '环状图' },
]

export default {
  name: 'BaseMapWithGraph',
  data() {
    return {
      graphTypeList,
      defaultGraphType: 'bar',
    }
  },
  props: {
    value: {
      type: Object,
    },
  },
  created() {
    if (!this.value || !this.value.graphType) {
      this.emitChange(this.defaultGraphType)
    }
  },
  computed: {
    // emptyImageStyle() {
    //   return {
    //     height: '50px'
    //   }
    // }
    graphType: {
      get: function () {
        return (this.value && this.value.graphType) || this.defaultGraphType
      },
      set: function (nV) {
        this.emitChange(nV)
      },
    },
  },
  methods: {
    emitChange(graphType) {
      this.$emit('change', { graphType })
    },
  },
}
</script>
<style lang="less" scoped>
.base-map-with-graph {
  padding: 12px 0 4px;
  .mapgis-ui-row-flex {
    margin-bottom: 0px;
  }
}
</style>
