<template>
  <div class="editable-field-table">
    <mapgis-ui-empty v-if="!visible" :image-style="emptyImageStyle">
      <span slot="description" @click="showTable" class="description">
        点击开始配置
      </span>
    </mapgis-ui-empty>
    <mapgis-ui-editable-table
      v-else
      :columns="tableColumns"
      :data.sync="tableData"
      :tools="tools"
      :title="title"
    >
      <template #top>
        <slot name="top" />
      </template>
    </mapgis-ui-editable-table>
  </div>
</template>
<script lang="ts">
import { INewSubjectConfig } from '../../../store'
import FieldInstance from '../store/fields'

interface IColumn extends ColumnProps {
  type?: 'Select' | 'Input' | 'InputNumber' | 'ColorPicker' | string
  options?: Array<any>
  props?: Record<string, any>
}

export default {
  name: 'EditableFieldTable',
  props: {
    title: {
      default: '配置列表',
    },
    columns: {
      type: Array,
      default: () => [],
    },
    data: {
      type: Array,
      default: () => [],
    },
    subjectConfig: {
      type: Object,
      default: () => ({}),
    },
    emptyVisible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      visible: false,

      fieldList: [],
    }
  },
  computed: {
    closeTool() {
      return {
        title: '取消配置',
        icon: 'close',
        method: this.onClose,
      }
    },
    tools() {
      return (add, batchDel) => {
        const _tools = [add, this.closeTool]
        if (this.tableData && this.tableData.length) {
          _tools.splice(1, 0, batchDel)
        }
        return _tools
      }
    },

    emptyImageStyle() {
      return {
        height: '50px',
      }
    },

    tableColumns() {
      return [
        ...this.columns.map((v) => {
          const options = v.dataIndex === 'field' ? this.fieldList : undefined
          return {
            ...v,
            props: {
              options,
            },
            scopedSlots: {
              customRender: v.dataIndex,
            },
          }
        }),
      ]
    },
    tableData: {
      get() {
        return this.data
      },
      set(data) {
        this.$emit('change', data)
      },
    },
  },
  methods: {
    /**
     * 隐藏配置面板
     */
    hideTable() {
      if (this.visible) {
        this.visible = false
      }
    },

    /**
     * 显示配置面板
     */
    showTable() {
      // const { ip, port, src } = this.subjectConfig
      // if (!(ip && port) && !src) {
      //   this.$message.warning('未配置服务地址')
      //   return
      // }
      this.visible = true
    },

    /**
     * 设置属性列表
     */
    setFields() {
      FieldInstance.getFields(this.subjectConfig).then((fields) => {
        this.fieldList = fields.map(({ alias, value }) => ({
          label: alias,
          value,
        }))
        this.$emit('fields-loaded', this.fieldList)
      })
    },

    /**
     * 取消
     */
    onClose() {
      this.tableData = undefined
      this.hideTable()
    },
  },
  watch: {
    'subjectConfig.field': {
      immediate: true,
      handler(nV) {
        if (nV) {
          this.setFields()
        }
      },
    },
    emptyVisible: {
      immediate: true,
      handler(nV) {
        this.visible = nV
      },
    },
  },
}
</script>

<style lang="scss" scoped>
.editable-field-table {
  padding: 8px;
  .description {
    color: $primary-color;
    cursor: pointer;
    font-size: $font-size-sm;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
