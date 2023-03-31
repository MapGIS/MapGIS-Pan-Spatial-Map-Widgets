<template>
  <div>
    <template v-for="t in subjectLayers">
      <component
        v-if="subjectType === t"
        @highlight="setLinkage"
        @clear-highlight="resetLinkage"
        :key="t"
        :is="t"
        :marker="marker"
        :geojson="geojson"
        :subject-data="subjectData"
      />
    </template>
  </div>
</template>
<script lang="ts">
import { Feature, AppMixin } from '@mapgis/web-app-framework'
import { getMarker, IMarker } from '../../utils'
import {
  subjectTypeList,
  mapGetters,
  mapMutations,
  LayerServiceType,
} from '../../store'
import mapboxLayers from './components/Mapbox'
import CesiumLayers from './components/Cesium'

export default {
  name: 'ThematicMapLayers',
  mixins: [AppMixin],
  components: {
    ...mapboxLayers,
    ...CesiumLayers,
  },
  computed: {
    ...mapGetters(['loading', 'subjectData', 'linkageFid']),
    prefix() {
      return this.is2DMapMode ? 'Mapbox' : 'Cesium'
    },
    // 获取专题类别
    subjectType() {
      return this.subjectData
        ? `${this.prefix}${this.subjectData?.subjectType}`
        : ''
    },
    // 获取渲染的子专题图层组件name集合
    subjectLayers() {
      return subjectTypeList.map(({ value }) => `${this.prefix}${value}`)
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
    ...mapMutations(['setFeaturesQuery', 'setLinkage', 'resetLinkage']),
    /**
     * 清除高亮
     */
    onClearHighlight() {
      this.marker = {}
    },

    /**
     * 高亮
     * @param {string} fid 要素fid
     */
    onHighlight(fid: string) {
      getMarker(this.geojson, fid, this.propertiesOption).then((marker) => {
        this.marker = marker
      })
    },

    /**
     * 设置高亮
     * @param {string} fid 要素fid
     */
    setHighlight(fid: string) {
      this.onClearHighlight()
      this.onHighlight(fid)
    },
  },
  inject: ['map'],
  data() {
    return {
      // 高亮选项的标注点
      marker: {},
      // 要素数据
      geojson: null,
    }
  },
  watch: {
    /**
     * 监听: 专题数据变化
     */
    subjectData: {
      deep: true,
      handler(nV) {
        this.geojson = null
        if (nV) {
          this.setFeaturesQuery({
            isCache: false,
            onSuccess: (geojson) => (this.geojson = geojson),
          })
          if (nV.layerServiceType === LayerServiceType.igsScene) {
            if (this.is2DMapMode) {
              this.switchMapMode()
            }
          }
        }
      },
    },
    /**
     * 监听: 联动项变化
     */
    linkageFid(nV) {
      this.setHighlight(nV)
    },
  },

  beforeDestroy() {
    this.resetLinkage()
  },
}
</script>
