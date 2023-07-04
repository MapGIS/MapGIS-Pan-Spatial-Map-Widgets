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
      <mapgis-ui-popover v-model="showTips" trigger="click">
        <a slot="content" @click="choose" v-if="!showJson">
          <div>
            <div>文本数据格式（顺时针或逆时针顺序，不支持自相交图形）:</div>
            <div v-for="(item, index) in sample.split('\n')" :key="index">
              {{ item }}
            </div>
            <div>支持封闭与非封闭数据</div>
            <div>仅支持MultiPolygon数据</div>
          </div>
        </a>
        <div v-else slot="content">
          类型为MultiPolygon的geojson数据，不支持自相交图形
        </div>
        <mapgis-ui-ant-icon
          type="question-circle"
          class="question-circle"
        ></mapgis-ui-ant-icon>
      </mapgis-ui-popover>
    </p>
    <div class="content">
      <json-editor
        v-show="showJson"
        style="overflow: auto"
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
            @click="removeGeomtry"
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
      textarea: '',
      showTips: false,
      sample: `1,1,109.2041,30.0881
1,2,115.0268,30.0881
1,3,115.02685,32.7872
1,4,109.2041,32.7872
2,1,118.0278,30.0881
2,2,121.0475,30.0881
2,3,121.0475,32.7872
2,4,118.0278,30.0881`,
    }
  },
  methods: {
    removeGeomtry() {
      if (this.showJson) {
        this.jsonData = {}
      } else {
        this.textarea = ''
      }
    },
    choose() {
      this.textarea = this.sample
      this.showTips = false
    },
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
    border-bottom: 1px solid $primary-color;
    height: 44px;
    margin-top: -44px;
    margin-bottom: 0;
    box-sizing: border-box;
    .question-circle {
      float: right;
      font-size: 14px;
      margin: 5px 30px 0 0;
      &:hover {
        cursor: pointer;
        color: $primary-color;
      }
    }
    .icon-guanbi {
      float: right;
      &:hover {
        cursor: pointer;
        color: $primary-color;
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
      border: none !important;
    }
    .jsoneditor-text {
      background-color: $background-color-base;
      color: $text-color;
      height: 200px;
    }
    // .jsoneditor-outer
    //    * {
    //         font-family: droid sans mono, consolas, monospace, courier new, courier, sans-serif!important;
    //     }
  }
}
</style>
