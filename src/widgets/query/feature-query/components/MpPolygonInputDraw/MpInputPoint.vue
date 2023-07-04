<template>
  <div class="param-table">
    <div style="position: relative; height: calc(100% - 36px)">
      <mapgis-ui-table
        v-if="!ctype"
        :data-source="tableData"
        bordered
        :pagination="false"
        :style="{ width: width, 'padding-bottom': '10px' }"
        :height="maxHeight"
      >
        <mapgis-ui-table-column
          key="longitude"
          data-index="longitude"
          title="经度"
        >
          <template slot-scope="text, record, index">
            <mp-translate-lonlat
              :key="record.key"
              :lonlat="record.longitude"
              :type="'longitude'"
              @getLonlat="setLonlat($event, 'longitude', index)"
            >
            </mp-translate-lonlat>
          </template>
        </mapgis-ui-table-column>
        <mapgis-ui-table-column
          key="latitude"
          data-index="latitude"
          title="纬度"
        >
          <template slot-scope="text, record, index">
            <mp-translate-lonlat
              :key="record.key"
              :lonlat="record.latitude"
              :type="'latitude'"
              @getLonlat="setLonlat($event, 'latitude', index)"
            >
            </mp-translate-lonlat>
          </template>
        </mapgis-ui-table-column>
        <mapgis-ui-table-column key="action" title="" :width="40">
          <template slot-scope="{ key }">
            <span>
              <mapgis-ui-ant-icon
                type="minus-circle"
                @click="deleteRow(key)"
              ></mapgis-ui-ant-icon>
            </span>
          </template>
        </mapgis-ui-table-column>
      </mapgis-ui-table>
      <mapgis-ui-table
        v-else
        :data-source="tableData"
        bordered
        :pagination="false"
        :style="{ width: width, 'padding-bottom': '10px' }"
        :height="maxHeight"
      >
        <mapgis-ui-table-column
          key="longitude"
          data-index="longitude"
          title="经度"
        >
          <template slot-scope="text, record">
            <mapgis-ui-input-number
              v-model="record.longitude"
              :min="-180"
              :max="180"
              style="width: 100%"
            >
            </mapgis-ui-input-number>
          </template>
        </mapgis-ui-table-column>
        <mapgis-ui-table-column
          key="latitude"
          data-index="latitude"
          title="纬度"
        >
          <template slot-scope="text, record">
            <mapgis-ui-input-number
              v-model="record.latitude"
              :min="-90"
              :max="90"
              style="width: 100%"
            >
            </mapgis-ui-input-number>
          </template>
        </mapgis-ui-table-column>
        <mapgis-ui-table-column key="action" title="" :width="40">
          <template slot-scope="{ key }">
            <span>
              <mapgis-ui-ant-icon
                type="minus-circle"
                @click="deleteRow(key)"
              ></mapgis-ui-ant-icon>
            </span>
          </template>
        </mapgis-ui-table-column>
      </mapgis-ui-table>
      <p
        title="切换方式"
        class="icon-qiehuan"
        style="position: absolute; right: 10px; top: 4px; width: 20px"
        @click="ctype = !ctype"
      >
        <mapgis-ui-ant-icon type="swap"></mapgis-ui-ant-icon>
      </p>
    </div>
    <div class="bottom">
      <mapgis-ui-ant-icon
        type="plus-circle"
        @click="addRow"
      ></mapgis-ui-ant-icon>
      <mapgis-ui-ant-icon
        type="exclamation"
        v-show="showErrorMsg"
        style="margin-left: 20px"
      ></mapgis-ui-ant-icon>
      <i class="err-warning" v-show="showErrorMsg">{{ errorMsg }}</i>
      <mapgis-ui-ant-icon
        type="delete"
        class="icon-btn"
        title="清空"
        style="float: right"
        @click="_initTable()"
      ></mapgis-ui-ant-icon>
    </div>
  </div>
</template>

<script>
import MpTranslateLonlat from './MpTranslateLonlat.vue'

export default {
  name: 'MpInputPoint', // 逐点输入，
  components: {
    MpTranslateLonlat,
  },
  props: {
    width: {
      type: String,
      default: '580px',
    },
  },
  data() {
    return {
      ctype: true,
      tableData: [],
      // editData:{},
      minNum: 3,
      maxNum: 50,
      showErrorMsg: false,
      errorMsg: '',
      maxHeight: '100%',
    }
  },
  watch: {
    ctype() {
      this._initTable()
    },
  },
  methods: {
    getGuid() {
      return 'xxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0
        const v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    },
    addRow() {
      if (this.tableData.length >= this.maxNum) {
        return
      }
      this.tableData.push({
        key: this.getGuid(),
        longitude: '',
        latitude: '',
      })
    },
    deleteRow(index) {
      // console.log(this.tableData);
      if (this.tableData.length <= this.minNum) {
        return
      }
      const key = this.tableData.findIndex((item) => {
        return item.key === index
      })
      this.tableData.splice(key, 1)
      console.log(this.tableData)
      // this.update = !this.update
    },
    setLonlat(value, type, index) {
      this.tableData[index][type] = value
      this.showErrorMsg = false
      this.errorMsg = ''
    },
    _initTable() {
      this.tableData = []
      this.showErrorMsg = false
      // eslint-disable-next-line
      this.tableData = Object.keys(Array.apply(null, { length: 3 })).map(
        (item, idx) => {
          return {
            key: this.getGuid(),
            longitude: '',
            latitude: '',
          }
        }
      )
    },
    getData() {
      const data = []
      const geometry = {}
      // eslint-disable-next-line
      this.tableData.map((o) => {
        if (!this.isEmpty(o.longitude) && !this.isEmpty(o.latitude)) {
          data.push([Number(o.longitude), Number(o.latitude)])
        }
      })
      // 区
      if (data.length < 3) {
        this.showErrorMsg = true
        this.errorMsg = '请至少输入三个点'
        return
      }
      data.push(data[0])
      this.showErrorMsg = false
      return {
        type: 'Polygon',
        coordinates: [data],
      }
    },
    isEmpty(str) {
      // var str = "adsfdsag";
      if (typeof str == 'undefined' || str == null || str == '') {
        // 为空
        return true
      } else {
        // 不为空
        return false
      }
    },
  },
  mounted() {
    //    debugger
    this._initTable()
  },
}
</script>
<style lang="scss" scoped>
.param-table {
  .el-table:before {
    background: transparent !important;
  }
  ::v-deep .mapgis-ui-table-wrapper {
    .mapgis-ui-table-tbody > tr > td,
    .mapgis-ui-table-thead > tr > th {
      padding: 4px 10px;
    }
  }
  .icon-qiehuan,
  .icon-btn {
    &:hover {
      cursor: pointer;
    }
  }
  .err-warning {
    font-size: 12px;
    color: #f56464;
  }
  .bottom {
    font-size: 20px;
    padding: 5px 0;
  }
}
</style>
