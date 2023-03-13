import { UUID, Feature } from '@mapgis/web-app-framework'
import { hasHighlightSubjectList, ISubjectData } from '../../../store'

interface IMarker {
  img: string
  feature: Feature.GFeature
  properties: Feature.GFeature['properties']
  coordinates: number[]
  fid: string
  markerId: string
}
// BaseMixin
export default {
  props: {
    // 高亮的标注信息
    marker: {
      type: Object,
      default: () => ({}),
    },
    // 某专题配置
    subjectData: {
      type: Object,
      default: () => ({}),
    },
    // 某专题某年度的要素GeoJson数据
    geojson: {
      type: Object,
      default: () => ({}),
    },
  },
  watch: {
    /**
     * 监听: 要素geojson数据变化
     */
    geojson: {
      deep: true,
      handler() {
        this.removeLayer()
        this.showLayer()
      },
    },
  },
  data() {
    return {
      id: UUID.uuid(),
    }
  },
  computed: {
    // 是否支持图属高亮
    hasHighlight() {
      return this.subjectData
        ? hasHighlightSubjectList.includes(this.subjectData.subjectType)
        : false
    },

    // 获取统计属性
    field() {
      return this.subjectData?.field
    },

    popup() {
      return this.subjectData ? this.subjectData.popup : undefined
    },

    propertiesOption() {
      let propertiesOption
      if (this.popup) {
        const { showFields, showFieldsTitle } = this.popup
        if (showFields && showFields.length > 0) {
          propertiesOption = {
            fields: showFields,
            fieldsTitle: showFieldsTitle,
          }
        }
      }
      return propertiesOption
    },
  },
  methods: {
    /**
     * 专题图鼠标移入高亮
     * @param {string} fid 要素fid
     */
    emitHighlight(fid: string) {
      if (this.hasHighlight) {
        this.$emit('highlight', fid)
      }
    },
    /**
     * 清除专题图高亮
     */
    emitClearHighlight() {
      if (this.hasHighlight) {
        this.$emit('clear-highlight')
      }
    },
    /**
     * 显示图层
     */
    showLayer() {},
    /**
     * 移除图层
     */
    removeLayer() {},
  },

  created() {
    this.showLayer()
  },

  beforeDestroy() {
    this.removeLayer()
  },
}
