<template>
  <mapgis-ui-list :gutter="10">
    <template v-for="item in listData">
      <mapgis-ui-list-item
        :key="item.name"
        v-if="item.show"
        @click="item.click"
      >
        {{ item.name }}
      </mapgis-ui-list-item>
    </template>
  </mapgis-ui-list>
</template>

<script>
import layerTypeUtil from '../../mixin/layer-type-util'
import { DataFlowList } from '@mapgis/web-app-framework'
import { lineString } from '@turf/helpers'
import bbox from '@turf/bbox'

export default {
  name: 'RightPopover',
  mixins: [layerTypeUtil],
  props: {
    layerItem: {
      type: Object,
      default: () => ({}),
    },
    mapList: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    listData() {
      return [
        {
          name: '图层元数据',
          show: this.isMetaData(this.layerItem),
          click: () => this.metaDataInfo(),
        },
        {
          name: '查看属性表',
          show: this.isAttributes(this.layerItem),
          click: () => this.attributes(),
        },
        {
          name: '自定义查询',
          show:
            (this.isMetaData(this.layerItem) &&
              !this.isDataFlow(this.layerItem) &&
              this.isSubLayer(this.layerItem) &&
              !this.isVoxelLayer(this.layerItem)) ||
            this.isCustomQuery(this.layerItem),
          click: () => this.customQuery(),
        },
        {
          name: '编辑样式',
          show: this.isDataFlow(this.layerItem),
          click: () => this.editDataFlowStyle(),
        },
        {
          name: '缩放至',
          show: this.isFitbound(this.layerItem),
          click: () => this.fitBounds(),
        },
        {
          name: '切换矩阵集',
          show:
            this.layerItem.layer &&
            this.isWMTSLayer(this.layerItem.layer) &&
            this.isActiveWMTSLayer(this.layerItem),
          click: () => this.resetTilematrixSet(),
        },
        {
          name: '切换图层',
          show:
            this.isParentLayer(this.layerItem) &&
            this.isWMTSLayer(this.layerItem),
          click: () => this.openChangeActiveLayer(),
        },
        {
          name: '置顶',
          show:
            this.isParentLayer(this.layerItem) &&
            !this.isIGSScene(this.layerItem) &&
            !this.isModelCacheLayer(this.layerItem),
          click: () => this.toTop(),
        },
        // 新增地图文档和arcgis地图服务图层属性设置，只是设置图层渲染模式
        // 龚跃健-202407017
        {
          name: '高级选项',
          show:
            (!this.isParentLayer(this.layerItem) &&
              this.isIGSScene(this.layerItem)) ||
            (this.isModelCacheLayer(this.layerItem) &&
              !this.isVoxelLayer(this.layerItem)) ||
            (this.isParentLayer(this.layerItem) &&
              (this.isIgsDocLayer(this.layerItem) ||
                this.isArcgisMapLayer(this.layerItem))),
          click: () => this.showAdvancedSetting(),
        },
        {
          name: '模型变换',
          show:
            this.isParentLayer(this.layerItem) &&
            (this.isIGSScene(this.layerItem) ||
              (this.isModelCacheLayer(this.layerItem) &&
                !this.isVoxelLayer(this.layerItem))),
          click: () => this.modelEdit(),
        },
        {
          name: '图层样式',
          show:
            (!this.isParentLayer(this.layerItem) &&
              (this.isIgsDocLayer(this.layerItem) ||
                this.isFeatureLayer(this.layerItem)) &&
              this.layerItem.sublayers.length === 0) ||
            this.isGeoJsonLayer(this.layerItem),
          click: () => this.featureEdit(),
        },
        {
          name: '符号化',
          show: this.isVoxelLayer(this.layerItem),
          click: () => this.symbolization(),
        },
        {
          name: '时间轴',
          show: this.isVoxelLayer(this.layerItem),
          click: () => this.timeline(),
        },
      ]
    },
  },
  created() {
    console.log(this.$root, 'rightpopover', this)
  },
  methods: {
    // 打开符号化界面
    symbolization() {
      this.$emit('symbolization', this.layerItem)
    },
    // 打开时间轴界面
    timeline() {
      this.$emit('timeline', this.layerItem)
    },
    metaDataInfo() {
      this.$emit('meta-data-info', this.layerItem)
    },

    attributes() {
      this.$emit('attributes', this.layerItem)
    },

    editDataFlowStyle() {
      this.$emit('edit-data-flow-style', this.layerItem)
    },

    customQuery() {
      this.$emit('custom-query', this.layerItem)
    },

    fitBounds() {
      this.getDataFlowExtent(this.layerItem)
      this.$emit(
        'fit-bounds',
        this.layerItem,
        this.getDataFlowExtent(this.layerItem)
      )
    },

    showAdvancedSetting() {
      if (
        (!this.isParentLayer(this.layerItem) &&
          this.isIGSScene(this.layerItem)) ||
        (this.isModelCacheLayer(this.layerItem) &&
          !this.isVoxelLayer(this.layerItem))
      ) {
        this.$emit('change-m3d-props', this.layerItem)
      } else if (
        this.isParentLayer(this.layerItem) &&
        (this.isIgsDocLayer(this.layerItem) ||
          this.isArcgisMapLayer(this.layerItem))
      ) {
        // 新增地图文档和arcgis地图服务图层属性设置，只是设置图层渲染模式
        // 龚跃健-202407017
        this.$emit('change-layer-props', this.layerItem)
      }
    },

    modelEdit() {
      this.$emit('model-edit', this.layerItem)
    },

    featureEdit() {
      this.$emit('feature-edit', this.layerItem)
    },

    enableQuery() {
      this.$emit('query', this.layerItem)
    },

    getDataFlowExtent(layerItem) {
      if (this.isDataFlow(layerItem)) {
        const dataList = DataFlowList.getDataFlowById(layerItem.id)
        const lineArr = dataList.map((item) => {
          const {
            geometry: { coordinates },
          } = item
          return coordinates
        })
        const line = lineString(lineArr)
        const [xmin, ymin, xmax, ymax] = bbox(line)
        return {
          xmin,
          ymin,
          xmax,
          ymax,
        }
      }

      return undefined
    },

    resetTilematrixSet() {
      this.$emit('reset-tilematrix-set', this.layerItem)
    },

    openChangeActiveLayer() {
      this.$emit('open-change-active-layer', this.layerItem)
    },
    toTop() {
      this.$emit('to-top', this.layerItem)
    },
  },
}
</script>

<style></style>
