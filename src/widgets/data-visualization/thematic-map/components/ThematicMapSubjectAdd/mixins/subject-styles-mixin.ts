import { UUID, Feature } from '@mapgis/web-app-framework'
import dep from '../store/dep'
import fieldInstance from '../store/fields'

export default {
  props: {
    value: {
      type: Object,
    },
  },
  data() {
    return {
      id: UUID.uuid(),
      customFormRef: null,
      dataSource: null,
    }
  },
  computed: {
    field() {
      return this.value.field
    },
  },
  watch: {
    field(nV) {
      fieldInstance
        .getFieldGeoJson({
          fields: nV,
          ...this.value,
        })
        .then((geojson) => (this.dataSource = geojson))
    },
  },
  methods: {
    /**
     * 保存时获取配置数据
     * @param {string} [key='themeStyle'] key 保存的字段名
     */
    getFormResult(key = 'themeStyle') {
      if (this.customFormRef) {
        return {
          [key]: this.customFormRef.$_getForm(),
        }
      }
      return {}
    },
  },

  mounted() {
    dep.addSub(this)
  },

  beforeDestroy() {
    dep.removeSub(this)
  },
}
