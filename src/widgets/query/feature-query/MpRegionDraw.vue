<template>
  <div class="gm-tool-content tool-region">
    <p class="header">
      行政区选择
      <span class="icon-guanbi" title="关闭" @click="$emit('close')">
        <mapgis-ui-ant-icon type="close"></mapgis-ui-ant-icon>
      </span>
    </p>
    <div class="content">
      <mp-region-location
        ref="regionLocation"
        class="region-location"
        :baseUrl="baseUrl"
        :regionsUrl="regionsUrl"
        @update:visible="$emit('close')"
        @select="selectArea"
      >
      </mp-region-location>
    </div>
  </div>
</template>

<script>
import { UUID } from '@mapgis/web-app-framework'
import MpRegionLocation from './MpRegionLocation.vue'

export default {
  name: 'MpRegionDraw',
  components: { MpRegionLocation },
  props: {
    is2DMapMode: Boolean,
    name: {
      type: String,
      default: 'region',
    },
    baseUrl: {
      type: String,
    },
    regionsUrl: {
      type: String,
    },
  },

  data() {
    return {
      container: null,
    }
  },
  methods: {
    selectArea(obj) {
      const shapeInfo = {
        id: UUID.uuid(),
        type: this.name,
        city: obj.city,
        geometry: {
          'type': 'MultiPolygon',
          'coordinates': obj.borders,
        },
      }
      // 绘制完成就向外抛事件
      if (this.is2DMapMode) {
        this.$emit('draw-shape', shapeInfo)
      } else {
        this.$emit('draw-shape-3d', shapeInfo)
      }
      this.$emit('close')
    },

    clear() {
      this.$refs.regionLocation && this.$refs.regionLocation.removeHighlight()
    },
  },
}
</script>
<style lang="scss" scoped>
.gm-tool-content {
  padding-top: 44px;
  .header {
    padding: 12px;
    font-size: 14px;
    height: 44px;
    margin-top: -44px;
    margin-bottom: 0;
    box-sizing: border-box;
    .icon-guanbi {
      float: right;
      &:hover {
        cursor: pointer;
      }
    }
  }
  .content {
    padding: 10px;
    font-size: 14px;
    height: 100%;
    box-sizing: border-box;
    .region-location {
      height: 100%;
      ::v-deep .gm-region-location__main {
        height: 100%;
        width: 100%;
        .header {
          display: none;
        }
        .main,
        .region-location-main {
          width: 100%;
          // height: 100%;
          .citys-content {
            width: 100%;
            height: calc(100% - 80px);
          }
          .citys {
            width: 100%;
            height: 100%;
            box-sizing: border-box;
          }
          .search-div {
            // position: relative;
            // .current-city{
            //     position: absolute;
            //     top: 11px;
            //     left: 17px;
            //     right: 15px;
            // }
            .mapgis-ui-row {
              // margin-left: 12%!important;
              // width: 80%!important;
              .icon-qiehuan {
                margin-top: 9px;
                display: inline-block;
              }
            }
          }
        }
        .location-select-function {
          display: none;
        }
      }
    }
  }
}
</style>
