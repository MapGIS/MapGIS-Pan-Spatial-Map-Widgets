<template>
  <mapgis-ui-feature-edit
    @feature-edit-change="featureEditChange"
    @get-renderer="getRenderer"
    :fieldInfo="fieldInfo"
    :featureType="featureType"
    :layerFeatureStyle="layerFeatureStyle"
  ></mapgis-ui-feature-edit>
</template>

<script>
import featureEditUtil from '../../mixin/feature-eidt-util'
import { LayerFeatureEdit } from '@mapgis/web-app-framework'

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
    return {
      layerFeatureEdit: LayerFeatureEdit,
    }
  },
  computed: {
    featureType() {
      const layerInfo = this.getFeatureStyle()
      return layerInfo?.type
    },
    layerFeatureStyle() {
      return this.getFeatureStyle()
    },
  },
  mounted() {
    // window.getRenderer = () => this.getRenderer()
  },

  methods: {
    getFeatureStyle() {
      const { layer } = this.layer
      let layerInfo
      if (layer) {
        layerInfo = this.layerFeatureEdit.getFeatureRelation(
          layer.url,
          this.layer.url
        )
      } else {
        layerInfo = this.layerFeatureEdit.getFeatureRelation(this.layer.url)
      }
      return layerInfo
    },
    // feature-edit-change
    featureEditChange(type, params, callback) {
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
          const uniqueValueData = await this.getStatisticsResult(
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
      const {
        source: { features },
      } = this.layer
      let result
      switch (type) {
        case 'uniqueValue':
          result = this.filterFeatureSet(type, groupField.value, features)
          break
        case 'classBreak':
          result = this.filterFeatureSet(
            type,
            statisticsField[0].value,
            features
          )
          break
        default:
          break
      }
      callback(result)
    },
    getRenderer(renderer) {
      const { layer } = this.layer
      let relations
      if (layer) {
        this.layerFeatureEdit.updateFeatureRenderer(
          layer.url,
          this.layer.url,
          renderer
        )
      } else {
        this.layerFeatureEdit.updateFeatureRenderer(
          this.layer.url,
          undefined,
          renderer
        )
      }
    },
  },
}
</script>

<style></style>
