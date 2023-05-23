<template>
  <div class="gm-tool-content tool-inputString">
    <p class="header">
      坐标串输入
      <mapgis-ui-button
        type="text"
        size="small"
        @click="showJson = false"
        :class="!showJson ? 'active' : null"
        >text文本</mapgis-ui-button
      >
      <mapgis-ui-button
        type="text"
        size="small"
        @click="showJson = true"
        :class="showJson ? 'active' : null"
        >geojson</mapgis-ui-button
      >
      <span class="icon-guanbi" title="关闭" @click="$emit('close')">
        <mapgis-ui-ant-icon type="close"></mapgis-ui-ant-icon>
      </span>
    </p>
    <div class="content">
      <json-editor
        v-show="showJson"
        style="min-height: 230px; overflow: auto"
        v-model="jsonData"
        :mode="'code'"
        :showBtns="false"
        :expandedOnStart="true"
      ></json-editor>

      <mapgis-ui-input
        v-show="!showJson"
        style="min-height: 230px; overflow: auto"
        type="textarea"
        placeholder="请输入内容"
        v-model="textarea"
      ></mapgis-ui-input>
      <div>
        <mapgis-ui-button
          size="small"
          style="margin-top: 10px"
          @click="submitJson"
          >确定输入</mapgis-ui-button
        >
        <span style="float: right; margin-top: 16px">
          清空
          <mapgis-ui-ant-icon
            type="delete"
            class="icon-btn"
            title="清空"
            @click=";(jsonData = {}), removeGeomtry()"
          ></mapgis-ui-ant-icon>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
// @ts-nocheck
import JsonEditor from 'vue-json-editor'
import { UUID } from '@mapgis/web-app-framework'

export default {
  name: 'MpGeoJsonInputDraw',
  components: { JsonEditor },

  props: {
    is2DMapMode: Boolean,
    // 线或点的缓冲半径，单位为米
    radius: {
      type: Number,
      default: 1000, // 默认1000米
    },
    color: {
      type: String,
      default: '#3388ff', // 默认颜色
    },
    name: {
      type: String,
      default: 'inputString',
    },
  },

  data() {
    return {
      container: null,

      jsonData: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [109.2041015625, 30.088107753367257],
              [115.02685546875, 30.088107753367257],
              [115.02685546875, 32.7872745269555],
              [109.2041015625, 32.7872745269555],
              [109.2041015625, 30.088107753367257],
            ],
          ],
        ],
      },
      showJson: false,
      textarea: `1,1,115.33,25.55
1,2,116.43,26.66
1,3,117.53,27.77
1,4,120.63,28.88
2,1,112.33,27.55
2,2,113.43,26.66
2,3,114.53,25.77
2,4,119.63,24.88`,
    }
  },
  methods: {
    submitJson() {
      const shapeInfo = {
        type: this.name,
        geometry: null,
      }

      if (this.showJson) {
        shapeInfo.geometry = this.jsonData
        shapeInfo.id = UUID.uuid()
      } else {
        const text = this.textarea
        const rows = text.split('\n')
        const coordinates = []
        let curIndex
        rows.forEach((item, i) => {
          const data = item.trim().split(',')
          if (data.length < 4) {
            return
          }
          const index = data[0]

          if (curIndex !== index) {
            // eslint-disable-next-line
            if (!!coordinates.length) {
              coordinates[coordinates.length - 1][0].push(
                coordinates[coordinates.length - 1][0][0]
              )
            }
            curIndex = index
            const p = []
            p.push([Number(data[2]), Number(data[3])])
            coordinates.push([p])
          } else {
            if (!curIndex) {
              coordinates[0][0].push([Number(data[2]), Number(data[3])])
            } else {
              coordinates[coordinates.length - 1][0].push([
                Number(data[2]),
                Number(data[3]),
              ])
            }
          }
        })

        // eslint-disable-next-line
        if (!!coordinates.length) {
          coordinates[coordinates.length - 1][0].push(
            coordinates[coordinates.length - 1][0][0]
          )
        }
        shapeInfo.geometry = {
          type: 'MultiPolygon',
          coordinates: coordinates,
        }
        shapeInfo.id = UUID.uuid()

        console.log(shapeInfo)
      }
      if (this.is2DMapMode) {
        this.$emit('draw-shape', shapeInfo)
      } else {
        this.$emit('draw-shape-3d', shapeInfo)
      }

      this.$emit('close')
    },

    clear() {},
  },
  watch: {},
  mounted() {},
}
</script>

<style lang="scss" scoped>
.gm-tool-content {
  padding-top: 44px;
  .header {
    padding: 12px;
    font-size: 14px;
    border-bottom: 1px solid #3d59a3;
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
    .active {
      background: #66b1ff;
      color: #fff;
    }
    .el-button {
      padding: 5px !important;
    }
  }
  ::v-deep .content {
    padding: 10px;
    font-size: 14px;
    height: 100%;
    box-sizing: border-box;

    .jsoneditor-poweredBy,
    .jsoneditor-modes {
      display: none;
    }
    .jsoneditor {
      border: none;
    }
    .jsoneditor-vue {
      height: 100%;
    }
    .jsoneditor-menu {
      background-color: transparent !important;
      border: nonre !important;
    }
    // .jsoneditor-outer
    //    * {
    //         font-family: droid sans mono, consolas, monospace, courier new, courier, sans-serif!important;
    //     }
  }
}
</style>
