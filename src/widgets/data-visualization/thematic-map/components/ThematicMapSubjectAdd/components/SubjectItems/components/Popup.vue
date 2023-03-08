<template>
  <editable-field-table
    @change="onChange"
    :data="tableData"
    :columns="tableColumns"
    :subject-config="subjectConfig"
    :emptyVisible="emptyVisible"
  >
    <mp-row-flex slot="top" label="标题" :label-width="50">
      <mapgis-ui-input
        v-model="title"
        @change="onInputChange()"
        placeholder="请填写"
        size="small"
      />
    </mp-row-flex>
  </editable-field-table>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { INewSubjectConfig } from '../../../../../store'
import EditableFieldTable from '../../../common/EditableFieldTable.vue'

interface ITableDataItem {
  index: number
  field: string
  alias: string
}

interface IPopup {
  showFields: string[]
  showFieldsTitle: Record<string, string>
}

@Component({
  components: {
    EditableFieldTable,
  },
})
export default class Popup extends Vue {
  @Prop({ default: () => ({}) }) readonly subjectConfig!: INewSubjectConfig

  title = ''

  tableData: ITableDataItem[] = []

  emptyVisible = false

  get tableColumns() {
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
  }

  @Watch('subjectConfig.popup', { deep: true })
  tableDataChange({ showFields = [], showFieldsTitle } = {}) {
    if (showFields.length === this.tableData.length) {
      this.setTableData(showFields, showFieldsTitle)
    }
  }

  mounted() {
    this.initTableData()
  }

  /**
   * 回显表格数据
   */
  initTableData() {
    if (!this.subjectConfig.popup) return

    const { showFields = [], showFieldsTitle, title } = this.subjectConfig.popup
    this.title = title
    if (showFields.length) {
      this.setTableData(showFields, showFieldsTitle)
      this.emptyVisible = true
    }
  }

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
  }

  /**
   * 属性配置变化
   */
  onChange(data: ITableDataItem[] = []) {
    const popup: ?IPopup =
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
    this.$emit('change', { popup })
  }

  /**
   * 输入框修改内容后保存
   */
  onInputChange() {
    const popup = this.subjectConfig.popup
    popup.title = this.title
    this.$emit('change', { popup })
  }
}
</script>
<style lang="less" scoped>
::v-deep .mp-row-flex {
  padding-bottom: 8px;
}
</style>
