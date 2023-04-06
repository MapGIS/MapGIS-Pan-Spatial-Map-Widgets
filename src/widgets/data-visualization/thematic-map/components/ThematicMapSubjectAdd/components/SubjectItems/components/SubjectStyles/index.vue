<template>
  <component :is="subjectType" v-model="subject" @change="onChange" />
</template>
<script lang="ts">
import { INewSubjectConfig } from '../../../../../../store'
import SubSectionMap from './SubSectionMap.vue' // 分段专题图
import BaseMapWithGraph from './BaseMapWithGraph.vue' // 统计专题图
import StatisticLabel from './StatisticLabel.vue' // 等级符号专题图
import Label from './Label.vue' // 聚合标注专题图
import HeatMap from './HeatMap.vue' // 热力图
import HexBin from './HexBin.vue' // 蜂窝图

export default {
  name: 'SubjectStyles',
  components: {
    BaseMapWithGraph,
    HeatMap,
    HexBin,
    Label,
    StatisticLabel,
    SubSectionMap,
  },
  props: {
    subjectType: String,
    subjectConfig: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    subject: {
      get() {
        return this.subjectConfig
      },
      set(nV) {
        this.$emit('change', nV)
      },
    },
  },
  methods: {
    onChange(data) {
      console.warn('尝试发送', data)
      this.$emit('change', data)
    },
  },
}
</script>
<style lang="less" scoped></style>
