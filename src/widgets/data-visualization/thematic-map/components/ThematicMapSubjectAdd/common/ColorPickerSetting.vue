<template>
  <mapgis-ui-dropdown :visible="dropdownVisible" :trigger="['click']">
    <span
      class="color-view"
      :style="{ background }"
      @click.stop="showDropdown"
    />
    <mp-card slot="overlay" :box-shadow="true" title="颜色设置" :tools="tools">
      <mapgis-ui-table
        bordered
        :row-selection="{
          columnWidth: 32,
          selectedRowKeys,
          onChange: selectChange,
        }"
        :pagination="false"
        :columns="tableColumns"
        :data-source="tableData"
      >
        <template slot="color" slot-scope="text, record">
          <mapgis-ui-sketch-color-picker-confirm
            v-model="record.color"
            :border-radius="false"
            class="color-picker-confirm"
          />
        </template>
        <template slot="percent" slot-scope="text, record">
          <mapgis-ui-input-number
            v-model="record.percent"
            :min="0"
            :max="100"
            :precision="0"
            :formatter="(value) => `${value}%`"
            :parser="(value) => value.replace('%', '')"
          />
        </template>
        <template slot="operation" slot-scope="text, record, index">
          <mapgis-ui-iconfont type="mapgis-delete" @click="removeRow(index)" />
        </template>
      </mapgis-ui-table>
    </mp-card>
  </mapgis-ui-dropdown>
</template>
<script lang="ts">
import { UUID } from '@mapgis/web-app-framework'

interface ITableDataItem {
  color: string
  percent: number
}

export default {
  name: 'ColorPickerSetting',
  props: ['value'],
  // {0.25: rgb(0,0,255), 0.55: rgb(0,0,255)}
  data() {
    return {
      defaultColor: 'rgb(64,169,255)',

      dropdownVisible: false,

      selectedRowKeys: [],

      tableColumns: [
        {
          title: '颜色',
          dataIndex: 'color',
          align: 'center',
          scopedSlots: { customRender: 'color' },
        },
        {
          title: '占比',
          dataIndex: 'percent',
          scopedSlots: { customRender: 'percent' },
        },
        {
          title: '操作',
          align: 'center',
          scopedSlots: { customRender: 'operation' },
        },
      ],

      tableData: [],

      tools: [
        {
          title: '新增',
          icon: 'plus',
          method: this.add,
        },
        {
          title: '批量删除',
          icon: 'delete',
          method: this.batchRemove,
        },
        {
          title: '确认',
          icon: 'check',
          method: this.confirm,
        },
        {
          title: '关闭',
          icon: 'close',
          method: this.close,
        },
      ],
    }
  },
  watch: {
    value: {
      immediate: true,
      deep: true,
      handler() {
        this.initTableData()
      },
    },
  },
  computed: {
    background() {
      if (this.value) {
        const gradientColors = Object.entries(this.value)
          .sort((a, b) => a[0] - b[0])
          .map(([percent, color]) => `${color} ${percent * 100}%`)
          .join(',')
        return `linear-gradient(to right,${gradientColors})`
      }
      return this.defaultColor
    },
  },
  methods: {
    /**
     * 初始化列表数据
     */
    initTableData() {
      if (
        !this.value ||
        Object.keys(this.value).some((n) => isNaN(Number(n)))
      ) {
        return
      }
      this.tableData = Object.entries(this.value).map(([percent, color]) => ({
        color,
        key: UUID.uuid(),
        percent: percent * 100,
      }))
    },

    /**
     * 打开选择器
     */
    showDropdown() {
      this.dropdownVisible = true
      this.initTableData()
    },
    /**
     * 关闭选择器
     */
    hideDropdown() {
      this.dropdownVisible = false
    },

    /**
     * 选择
     */
    selectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys
    },

    /**
     * 删除
     */
    removeRow(index: number) {
      this.tableData.splice(index, 1)
    },

    /**
     * 添加
     */
    add() {
      const node = {
        key: UUID.uuid(),
        color: this.defaultColor,
        percent: 0,
      }
      this.tableData.push(node)
    },

    /**
     * 批量删除
     */
    batchRemove() {
      if (!this.selectedRowKeys.length) {
        this.$message.warning('请勾选数据')
      } else {
        this.selectedRowKeys.forEach((k) =>
          this.removeRow(this.tableData.findIndex(({ key }) => key === k))
        )
        this.selectedRowKeys = []
      }
    },

    /**
     * 确认
     */
    confirm() {
      const colorObj = this.tableData.reduce<Record<string, string>>(
        (obj, { color, percent }) => {
          const _percent = `${percent / 100}`
          const key = percent % 100 === 0 ? `${_percent}.0` : _percent
          obj[key] = color
          return obj
        },
        {}
      )
      this.$emit('input', colorObj)
      this.close()
    },

    /**
     * 关闭
     */
    close() {
      this.hideDropdown()
      this.selectChange([])
    },
  },
}
</script>

<style lang="scss" scoped>
.color-view {
  border-radius: $border-radius-base;
  width: 88px;
  height: 32px;
  line-height: 32px;
  display: inline-block;
  vertical-align: middle;
  border: 1px solid transparent;
  cursor: pointer;
}
.color-picker-confirm {
  width: 100px;
}
::v-deep .mapgis-ui-table {
  th {
    padding: 4px 8px;
  }
  td {
    padding: 0;
  }
  .anticon {
    cursor: pointer;
    &:hover {
      color: $primary-color;
    }
  }
  .mapgis-ui-input-number {
    border: none;
    border-radius: 0;
    &-focused {
      box-shadow: none;
      border-color: $border-color-base;
    }
  }
}
</style>
