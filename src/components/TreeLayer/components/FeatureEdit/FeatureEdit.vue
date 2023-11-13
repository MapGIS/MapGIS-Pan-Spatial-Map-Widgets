<template>
  <mapgis-ui-feature-edit
    @feature-edit-change="featureEditChange"
    @get-renderer="getRenderer"
    :fieldInfo="fieldInfo"
    :featureType="featureType"
  ></mapgis-ui-feature-edit>
</template>

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
  computed: {
    featureType() {
      return this.layer.geomType
    },
  },
  methods: {
    // feature-edit-change
    featureEditChange(type, params, callback) {
      debugger
      const gdbpUrl = this.isGdbpType(this.layer.url)
      if (gdbpUrl) {
        this.featureChangeByGdbp(type, params, callback)
      } else {
        this.featureChangeByUrl(type, params, callback)
      }
    },
    async featureChangeByGdbp(type, params, callback) {
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
            this.layer,
            'single',
            statisticsField,
            groupField,
            maxStatisticsType
          )
          result = this.transformStatisticsData('uniqueValue', uniqueValueData)
          break
        // 分类
        case 'classBreak':
          const minData = await this.getStatisticsResult(
            this.layer,
            'single',
            statisticsField,
            groupField,
            minStatisticsType
          )
          const maxData = await this.getStatisticsResult(
            this.layer,
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
        default:
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
        default:
          break
      }
      callback(result)
    },
    getRenderer(renderer) {
      console.log(renderer, 'renderer')
    },
  },
}
</script>

<style></style>
