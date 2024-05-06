<template>
  <div class="mp-attribute-table-column-setting" ref="root">
    <mapgis-ui-popover
      v-model="visible"
      placement="bottomRight"
      trigger="click"
      :get-popup-container="() => $refs.root"
    >
      <div slot="title">
        <mapgis-ui-checkbox
          :indeterminate="indeterminate"
          :checked="checkAll"
          @change="onCheckAllChange"
          class="check-all"
        />列展示
        <mapgis-ui-button
          @click="resetColumns"
          style="float: right"
          type="link"
          size="small"
          >重置</mapgis-ui-button
        >
      </div>
      <div
        style="overflow-y: auto; max-height: 180px"
        class="beauty-scroll"
        slot="content"
      >
        <mapgis-ui-list
          style="width: 100%"
          size="small"
          :key="i"
          v-for="(col, i) in columns"
        >
          <mapgis-ui-list-item class="column-item">
            <mapgis-ui-checkbox
              v-model="col.visible"
              @change="(e) => onCheckChange(e, col)"
            />
            <template v-if="col.title"> {{ col.title }}</template>
            <slot
              v-else-if="col.slots && col.slots.title"
              :name="col.slots.title"
            ></slot>
          </mapgis-ui-list-item>
        </mapgis-ui-list>
      </div>
      <mapgis-ui-toolbar-command title="列配置" icon="setting" />
    </mapgis-ui-popover>
  </div>
</template>

<script>
import cloneDeep from 'lodash.clonedeep'

export default {
  name: 'MpAttributeTableColumnSetting',
  props: ['columns'],
  data() {
    return {
      // ‘列配置’是否展示
      visible: false,
      // 是否展示checkbox的半选状态
      indeterminate: false,
      // 是否勾选全部
      checkAll: true,
      // ‘列配置’勾选的数量
      checkedCounts: this.columns.length,
      // 初始化时展示的‘列配置’
      backColumns: cloneDeep(this.columns),
    }
  },
  watch: {
    // ‘列配置’勾选的数量变化
    checkedCounts(val) {
      // 是否全选
      this.checkAll = val === this.columns.length
      // 是否展示半选
      this.indeterminate = val > 0 && val < this.columns.length
    },
    // 属性表表格展示的列变化
    columns(newVal, oldVal) {
      if (newVal != oldVal) {
        // 改变勾选的列数量
        this.checkedCounts = newVal.length
        // 重新设置表格的列
        this.formatColumns(newVal)
      }
    },
  },
  created() {
    // 初始化设置表格的列
    this.formatColumns(this.columns)
  },
  methods: {
    // 勾选/取消勾选列
    onCheckChange(e, col) {
      if (!col.visible) {
        this.checkedCounts -= 1
      } else {
        this.checkedCounts += 1
      }
    },
    // 重置‘列配置’
    resetColumns() {
      const { columns, backColumns } = this
      let counts = columns.length
      // 重置成初始化时的‘列配置’
      backColumns.forEach((back, index) => {
        const column = columns[index]
        column.visible = back.visible === undefined || back.visible
        if (!column.visible) {
          counts -= 1
        }
      })
      this.checkedCounts = counts
      // 关闭‘列配置’
      this.visible = false
      this.$emit('reset')
    },
    // 勾选/取消勾选全部列
    onCheckAllChange(e) {
      if (e.target.checked) {
        this.checkedCounts = this.columns.length
        this.columns.forEach((col) => (col.visible = true))
      } else {
        this.checkedCounts = 0
        this.columns.forEach((col) => (col.visible = false))
      }
    },
    // 初始化‘列配置’的勾选
    formatColumns(columns) {
      for (const col of columns) {
        if (col.visible === undefined) {
          this.$set(col, 'visible', true)
        }
        if (!col.visible) {
          this.checkedCounts -= 1
        }
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-attribute-table-column-setting {
  display: inline-block;
  .check-all {
    margin-right: 8px;
  }
  .left,
  .right {
    transform: rotate(-90deg);
  }
  .mapgis-ui-list-item.column-item {
    padding: 4px 0;
  }
  .active {
    color: $primary-color;
  }
}
</style>
