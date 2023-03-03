<template>
  <div class="mp-widget-layer-list">
    <div>
      <div v-show="showWidget">
        <ul class="top-tab-nav">
          <li
            v-for="{ key, label } in tabs"
            :key="key"
            :class="[key === tab ? 'active-color' : '']"
            @click="tab = key"
          >
            {{ label }}
          </li>
        </ul>
        <mp-tree-layer
          v-show="tab === 'tree'"
          :widgetInfo="widgetInfo"
          :widgetRouters="widgetRouters"
          :layerDocument.sync="document"
        >
        </mp-tree-layer>
        <layer-opacity
          v-show="tab === 'opacity'"
          :layers="document.defaultMap.layers()"
        />
        <mapgis-ui-list :gutter="10">
          <template v-for="item in ['aaa', 'nnn', 'ccc']">
            <mapgis-ui-list-item :key="item">
              {{ item }}
            </mapgis-ui-list-item>
          </template>
        </mapgis-ui-list>
      </div>
      <!-- 主要是空白时候的图片可能不显示的情况 -->
      <mapgis-ui-empty v-show="!showWidget" :image="simpleImage" />
    </div>
  </div>
</template>

<script lang="ts">
import { AppMixin } from '@mapgis/web-app-framework'
import { MapgisUiEmpty } from '@mapgis/webclient-vue-ui'
import { MpTreeLayer } from '../../../components'
import layerOpacity from './layer-opacity.vue'
import { api, dataCatalogManagerInstance } from '../../../model'

export default {
  name: 'MpLayerListContainer',
  components: { layerOpacity, MpTreeLayer },
  mixins: [AppMixin],
  props: {
    widgetRouters: {
      type: Array,
    },
    widgetInfo: {
      type: Object,
    },
    mode: {
      default: 'max' | 'normal',
    },
  },
  data() {
    return {
      tab: 'tree',
      dataCatalog: null,
      tabs: [
        { key: 'tree', label: '图层树' },
        { key: 'opacity', label: '透明度' },
      ],
    }
  },
  computed: {
    showWidget() {
      return (
        this.document &&
        this.document.defaultMap &&
        this.document.defaultMap.layers() &&
        this.document.defaultMap.layers().length > 0
      )
    },
  },

  beforeCreate() {
    this.simpleImage = MapgisUiEmpty.PRESENTED_IMAGE_SIMPLE
  },
  created() {
    console.log(this.$root, 'layerlist', this)
  },
}
</script>

<style lang="scss">
.mp-widget-layer-list {
  flex: 1 1 0%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  #layerListEl {
    width: 300px;
    max-width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .top-tab-nav {
    flex-shrink: 0;
    list-style: none;
    display: flex;
    height: 28px;
    margin: 0;
    padding: 0;
    margin-bottom: 8px;
    border-bottom: 1px $border-color solid;
    li {
      height: 100%;
      padding: 0 5px;
      margin-right: 21px;
      border-bottom: 2px transparent solid;
      &:hover {
        cursor: pointer;
        color: $primary-color;
      }
    }
    .active-color {
      transition: background, linear 0.5s;
      border-bottom-color: $primary-color;
    }
  }
  .mapgis-ui-empty-normal {
    margin: 8px 0;
  }
}
.layer-list-popover {
  .mapgis-ui-popover-inner {
    overflow: hidden;
    .mapgis-ui-popover-inner-content {
      padding: 0;
      .mapgis-ui-list-item {
        padding: 8px 25px;
        &:hover {
          cursor: pointer;
          background-color: $table-row-hover-bg;
        }
      }
    }
  }
}
</style>
