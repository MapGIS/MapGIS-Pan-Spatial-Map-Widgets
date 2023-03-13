<template>
  <editable-field-table
    @change="onChange"
    :columns="tableColumns"
    :data="tableData"
    :subject-config="subjectConfig"
    :emptyVisible="emptyVisible"
  />
</template>
<script lang="ts">
import { INewSubjectConfig } from '../../../../../store'
import EditableFieldTable from '../../../common/EditableFieldTable.vue'

interface ITableDataItem {
  index: number
  field: string
  alias: string
}

interface ITable {
  showFields: string[]
  showFieldsTitle: Record<string, string>
}

export default {
  name: 'AttributeTable',
  components: {
    EditableFieldTable,
  },
  props: {
    subjectConfig: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      tableData: [],

      emptyVisible: false,
    }
  },
  computed: {
    tableColumns() {
      return [
        {
          type: 'Select',
          title: '属性字段',
          dataIndex: 'field',
          width: 160,
        },
        {
          type: 'Input',
          title: '属性别名',
          dataIndex: 'alias',
        },
      ]
    },
  },
  watch: {
    'subjectConfig.table': {
      deep: true,
      handler({ showFields = [], showFieldsTitle } = {}) {
        if (showFields.length === this.tableData.length) {
          this.setTableData(showFields, showFieldsTitle)
        }
      },
    },
  },

  mounted() {
    this.initTableData()
  },
  methods: {
    /**
     * 回显表格数据
     */
    initTableData() {
      if (!this.subjectConfig.table) return
      const { showFields = [], showFieldsTitle } = this.subjectConfig.table
      if (showFields.length) {
        this.setTableData(showFields, showFieldsTitle)
        this.emptyVisible = true
      }
    },

    /**
     * 调整表格数据格式
     */
    setTableData(showFields, showFieldsTitle) {
      const addNum = 1000
      this.tableData = showFields.map((f, i) => ({
        index: addNum + i,
        field: f,
        alias: showFieldsTitle[f],
      }))
    },

    /**
     * 属性配置变化
     */
    onChange(data: ITableDataItem[] = []) {
      const table =
        data.length && data.some(({ field }) => !!field)
          ? data.reduce(
              ({ showFields, showFieldsTitle }, { field, alias }) => {
                if (field) {
                  if (!showFields.includes(field)) {
                    showFields.push(field)
                  }
                  showFieldsTitle[field] = alias
                }
                return { showFields, showFieldsTitle }
              },
              {
                showFields: [],
                showFieldsTitle: {},
              }
            )
          : undefined
      this.tableData = data
      this.$emit('change', { table })
    },
  },
}
</script>
