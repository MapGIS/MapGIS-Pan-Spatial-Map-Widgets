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
      // 从LayerFeatureEdit获取已存在的编辑样式
      const layerInfo = this.getFeatureStyle()
      // 如果LayerFeatureEdit中不存在需要从this.layer中获取
      if (!layerInfo) {
        const geomType = this.getFeatureStyleByLayer()
        return geomType
      }
      return layerInfo.type
    },
    layerFeatureStyle() {
      return this.getFeatureStyle()
    },
  },
  mounted() {
    window.getRenderer = () => this.getRenderer()
  },

  methods: {
    getFeatureStyleByLayer() {
      const { geomType, source } = this.layer
      // geojson数据有geomType为空的情况
      if (!geomType && featureStyle) {
        const transformType = this.getGeometryType(featureStyle.type)
        return transformType
      }
      return geomType
    },
    getGeometryType(type) {
      let transformType
      switch (type) {
        case 'point':
          transformType = 'Pnt'
          break
        case 'line':
          transformType = 'Lin'
          break
        case 'polygon':
          transformType = 'Reg'
          break
        default:
          break
      }
      return transformType
    },
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
    getRenderer(renderer = {}, symbolType) {
      debugger
      const { layer } = this.layer
      let extend
      const isEdit = Object.keys(renderer).length > 0
      if (layer) {
        const hasFeatureStyle = this.layerFeatureEdit.getFeatureRelation(
          layer.url,
          this.layer.url
        )
        if (hasFeatureStyle) {
          this.layerFeatureEdit.updateFeatureRenderer(
            layer.url,
            this.layer.url,
            renderer,
            symbolType
          )
        } else {
          const relation = this.getFeatureRelation(
            layer,
            symbolType,
            renderer,
            true
          )
          this.layerFeatureEdit.setFeatureRelation(this.layer.url, realtion)
        }

        extend = layer.extend
      } else {
        const hasFeatureStyle = this.layerFeatureEdit.getFeatureRelation(
          this.layer.url
        )
        if (hasFeatureStyle) {
          this.layerFeatureEdit.updateFeatureRenderer(
            this.layer.url,
            undefined,
            renderer,
            symbolType
          )
        } else {
          const relation = this.getFeatureRelation(
            layer,
            symbolType,
            renderer,
            false
          )
          this.layerFeatureEdit.setFeatureRelation(this.layer.url, realtion)
        }

        extend = this.layer.extend
      }
      // 在extend上记录对应子图层的编辑样式
      this.changeFeatureStyle(extend, renderer, symbolType, isEdit)
      this.$emit('update:layer', this.layer)
    },
    changeFeatureStyle(extend, renderer, symbolType, isEdit) {
      if (isEdit) {
        if (!extend.featureStyle) {
          extend.featureStyle = {}
        }
        if (!extend.featureStyle[this.layer.url]) {
          extend.featureStyle[this.layer.url] = {}
        }
        extend.featureStyle[this.layer.url].renderer = renderer
        extend.featureStyle[this.layer.url].symbolType = symbolType
        extend.featureStyle[this.layer.url].type = this.featureType
      } else {
        if (extend.featureStyle && extend.featureStyle[this.layer.url]) {
          delete extend.featureStyle[this.layer.url]
        }
      }
    },
    getFeatureRelation(layer, symbolType, renderer, hasParent) {
      let relation = {}
      const sublayer = {
        id: hasParent ? layer.id : this.layer.id,
        type: this.featureType,
        symbolType: symbolType,
        renderer: renderer,
      }
      if (hasParent) {
        relation[layer.url] = sublayer
      } else {
        relation = sublayer
      }
      return relation
    },
  },
}
</script>

<style></style>
