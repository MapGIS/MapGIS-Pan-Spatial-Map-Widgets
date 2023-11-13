<template></template>

<script>
import featureEditUtil from '../../mixin/feature-eidt-util'
export default {
  name: 'FeatureEdit',
  mixins: [featureEditUtil],
  props: {
    layer: {
      type: Object,
    },
    fieldInfo: {
      type: Array,
      deafult: () => [],
    },
  },
  data() {
    return {}
  },
  methods: {
    // feature-edit-change
    featureEditChange() {
      const gdbpUrl = this.isGdbpType(this.currentLayerInfo.url)
      if (gdbpUrl) {
        this.featureChangeByGdbp(type, params, callback)
      } else {
        this.featureChangeByUrl(type, params, callback)
      }
    },
    featureChangeByGdbp(type, params, callback) {
      const { statisticsField, groupField } = params
      const maxStatisticsType = {
        label: '最大值',
        value: 'FUNCTION_MAX',
        type: 'max',
      }
      const minStatisticsType = {
        label: '最小值',
        value: 'FUNCTION_MIN',
        type: 'min',
      }
      let result
      switch (type) {
        // 一值一类
        case 'uniqueValue':
          const uniqueValueData = this.getStatisticsResult(
            this.currentLayerInfo,
            'single',
            statisticsField,
            groupField,
            maxStatisticsType
          )
          result = this.transformStatisticsData('uniqueValue', uniqueValueData)
          break
        // 分类
        case 'classBreak':
          const minData = this.getStatisticsResult(
            this.currentLayerInfo,
            'single',
            statisticsField,
            groupField,
            minStatisticsType
          )
          const maxData = this.getStatisticsResult(
            this.currentLayerInfo,
            'single',
            statisticsField,
            groupField,
            maxStatisticsType
          )
          result = [
            ...this.transformStatisticsData('classBreakMin', minData),
            ...this.transformStatisticsData('classBreakMax', maxData),
          ]
          break
      }
      callback(result)
    },
    featureChangeByUrl(type, params, callback) {
      // 从geojson数据中过滤一值一类只需要分组字段即可，统计字段不使用,分段则反之
      const { statisticsField, groupField } = params
      let result
      switch (type) {
        case 'uniqueValue':
          result = this.filterFeatureSet(type, groupField.value)
          break
        case 'classBreak':
          result = this.filterFeatureSet(type, statisticsField.value)
          break
      }
      callback(result)
    },
  },
}
</script>

<style></style>
