<template>
  <div class="mp-alpha-table">
    <mapgis-ui-table
      bordered
      size="small"
      :pagination="false"
      :columns="tableColumns"
      :data-source="tableData"
      :scroll="{ y: 350 }"
    >
      <template slot="alpha" slot-scope="text, record">
        <span v-if="!record.editAlpha" @click="showAlphaChange(record, true)">{{
          record.alpha
        }}</span>
        <mapgis-ui-input-number
          v-else
          v-model="record.alpha"
          autoFocus
          :min="0"
          :max="1"
          :step="0.1"
          @blur="showAlphaChange(record, false)"
        ></mapgis-ui-input-number>
      </template>
      <template slot="num" slot-scope="text, record, index">
        <span
          v-if="!record.editNum"
          @click="showNumChange(record, index, true)"
          >{{ record.num }}</span
        >
        <mapgis-ui-input-number
          v-else
          :value="record.num"
          autoFocus
          @blur="showNumChange(record, index, false)"
          @change="
            (val) => {
              onNumberChange(val, record, index)
            }
          "
        ></mapgis-ui-input-number>
      </template>
      <template slot="operation" slot-scope="text, record, index">
        <mapgis-ui-tooltip
          placement="top"
          title="删除"
          v-if="index !== 0 && index !== tableData.length - 1"
        >
          <mapgis-ui-iconfont
            class="mapgis-ui-iconfont"
            type="mapgis-delete"
            @click="remove(index)"
          ></mapgis-ui-iconfont>
        </mapgis-ui-tooltip>
        <mapgis-ui-tooltip
          placement="top"
          title="向下插入一行"
          v-if="index !== tableData.length - 1"
        >
          <mapgis-ui-iconfont
            type="mapgis-plus"
            @click="add(index)"
          ></mapgis-ui-iconfont>
        </mapgis-ui-tooltip>
      </template>
    </mapgis-ui-table>
  </div>
</template>

<script>
import { UUID } from '@mapgis/web-app-framework'

export default {
  name: 'MpAlphaTable',
  props: {
    value: { type: Array },
    // 属性最大值
    maxValue: {
      type: Number,
      default: 1000,
    },
    // 属性最小值
    minValue: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      defaultAlpha: 1,
      tableColumns: [
        {
          title: '透明度',
          dataIndex: 'alpha',
          align: 'center',
          scopedSlots: { customRender: 'alpha' },
        },
        {
          title: '数值',
          dataIndex: 'num',
          align: 'center',
          scopedSlots: { customRender: 'num' },
        },
        {
          title: '操作',
          align: 'center',
          scopedSlots: { customRender: 'operation' },
        },
      ],
      countMax: 100,
      countMin: 0,
      tableData: [],
      emitValue: [],
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler() {
        if (JSON.stringify(this.value) !== JSON.stringify(this.emitValue)) {
          this.initTableData()
          this.$emit('change', this.value)
        }
      },
    },
    tableData: {
      handler: function () {
        let flag = false
        this.emitValue = this.tableData.map(({ num, alpha }) => {
          if (num.toString().endsWith('.') || alpha.toString().endsWith('.')) {
            flag = true
          }
          return {
            num,
            alpha,
          }
        })
        if (!flag) {
          this.$emit('change', this.emitValue)
          this.$emit('input', this.emitValue)
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    initTableData() {
      this.tableData = this.value.map(({ alpha, num }) => ({
        key: UUID.uuid(),
        num,
        alpha,
        editNum: false,
        editAlpha: false,
      }))
    },
    remove(index) {
      this.tableData.splice(index, 1)
    },
    add(index) {
      const min = this.tableData[index].num
      const max = this.tableData[index + 1].num
      const num = Math.floor((max + min) / 2)
      const node = {
        key: UUID.uuid(),
        alpha: this.defaultAlpha,
        num,
        editNum: false,
        editAlpha: false,
      }
      this.tableData.splice(index + 1, 0, node)
    },
    // 改变输入框时对输入值进行限制
    onNumberChange(val, record, index) {
      if (val >= this.countMax) {
        const length = this.tableData.length
        record.num = index === length - 1 ? this.maxValue : this.countMax - 1
      } else if (val <= this.countMin) {
        record.num = index === 0 ? this.minValue : this.countMin + 1
      } else {
        record.num = val
      }
    },
    // 控制输入框是否显示，同时点击的时候确定输入框的最大最小值
    showNumChange(record, index, val) {
      record.editNum = val
      if (record.editNum === true) {
        if (index === 0) {
          this.countMax = this.tableData[index + 1].num
          this.countMin = this.tableData[index].num
        } else if (index === this.tableData.length - 1) {
          this.countMax = this.tableData[index].num
          this.countMin = this.tableData[index - 1].num
        } else {
          this.countMin = this.tableData[index - 1].num
          this.countMax = this.tableData[index + 1].num
        }
      }
    },
    showAlphaChange(record, val) {
      record.editAlpha = val
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-alpha-table {
  /deep/ td {
    padding: 0px !important;
  }
  /deep/ th {
    padding: 4px 8px 4px 8px !important;
  }
  .mapgis-ui-input-number {
    border: none;
  }
}
</style>
