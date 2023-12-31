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
import * as turf from '@turf/turf'

export default {
  name: 'RightPopover',
  mixins: [layerTypeUtil],
  props: {
    layerItem: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      listData: [
        {
          name: '图层元数据',
          show:
            this.isMetaData(this.layerItem) &&
            this.isParentLayer(this.layerItem),
          click: () => this.metaDataInfo(),
        },
        {
          name: '查看属性',
          show: this.isAttributes(this.layerItem),
          click: () => this.attributes(),
        },
        {
          name: '自定义查询',
          show:
            this.isMetaData(this.layerItem) &&
            !this.isDataFlow(this.layerItem) &&
            !this.isParentLayer(this.layerItem),
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
            !this.isIGSScene(this.layerItem),
          click: () => this.toTop(),
        },
        {
          name: '属性设置',
          show:
            (!this.isParentLayer(this.layerItem) &&
              this.isIGSScene(this.layerItem)) ||
            this.isModelCacheLayer(this.layerItem),
          click: () => this.changeM3DProps(),
        },
        {
          name: '模型编辑',
          show:
            this.isParentLayer(this.layerItem) &&
            this.isIGSScene(this.layerItem),
          click: () => this.modelEdit(),
        },
      ],
    }
  },
  created() {
    console.log(this.$root, 'rightpopover', this)
  },
  methods: {
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

    changeM3DProps() {
      this.$emit('change-m3d-props', this.layerItem)
    },

    modelEdit() {
      this.$emit('model-edit', this.layerItem)
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
        const line = turf.lineString(lineArr)
        const [xmin, ymin, xmax, ymax] = turf.bbox(line)
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
