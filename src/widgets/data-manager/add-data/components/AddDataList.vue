<template>
  <div class="mp-widget-add-data beauty-scroll">
    <mapgis-ui-toolbar class="add-data-toolbar">
      <add-data-category-select
        :categories="categories"
        :value="categoryName"
        @select="onCategorySelect"
        size="small"
        class="add-data-category-select"
      />
      <mapgis-ui-toolbar-command-group>
        <mapgis-ui-toolbar-command
          title="添加分类"
          icon="plus"
          @click="onAddCategory"
        >
        </mapgis-ui-toolbar-command>
      </mapgis-ui-toolbar-command-group>
      <mapgis-ui-toolbar-space></mapgis-ui-toolbar-space>
      <mapgis-ui-divider type="vertical" />
      <mapgis-ui-toolbar-command-group>
        <mapgis-ui-toolbar-command title="保存" icon="save" @click="onSaveData">
        </mapgis-ui-toolbar-command>
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-toolbar>
    <mapgis-ui-space direction="vertical" class="full-width">
      <mapgis-ui-row>
        <mapgis-ui-table
          class="data-table"
          :columns="columns"
          :data-source="categoryDataList"
          :pagination="pagination"
          :row-selection="{
            columnWidth: 40,
            selectedRowKeys: selectedRowKeys,
            onChange: onSelectChange,
          }"
          :rowKey="
            (record, index) => {
              return record.id
            }
          "
          @change="onTableChange"
          size="small"
        >
          <div
            slot="filterDropdown"
            slot-scope="{
              setSelectedKeys,
              selectedKeys,
              confirm,
              clearFilters,
              column,
            }"
            style="padding: 8px"
          >
            <mapgis-ui-input
              v-mapgis-ui-ref="(c) => (searchInput = c)"
              :placeholder="`请输入${column.title}`"
              :value="selectedKeys[0]"
              style="width: 188px; margin-bottom: 8px; display: block"
              @change="
                (e) => setSelectedKeys(e.target.value ? [e.target.value] : [])
              "
              @pressEnter="
                () => onSearch(selectedKeys, confirm, column.dataIndex)
              "
            />
            <mapgis-ui-button
              type="primary"
              icon="search"
              size="small"
              style="width: 90px; margin-right: 8px"
              @click="() => onSearch(selectedKeys, confirm, column.dataIndex)"
            >
              搜索
            </mapgis-ui-button>
            <mapgis-ui-button
              size="small"
              style="width: 90px"
              @click="() => onSearchReset(clearFilters)"
            >
              重置
            </mapgis-ui-button>
          </div>
          <mapgis-ui-iconfont
            slot="filterIcon"
            slot-scope="filtered"
            type="mapgis-search"
            :style="{ color: filtered ? '#108ee9' : undefined }"
          />
          <template
            slot="customRenderName"
            slot-scope="text, record, index, column"
          >
            <span
              v-if="searchText && searchedColumn === column.dataIndex"
              :title="text"
            >
              <template
                v-for="(fragment, i) in text
                  .toString()
                  .split(
                    new RegExp(`(?<=${searchText})|(?=${searchText})`, 'i')
                  )"
              >
                <mark
                  v-if="fragment.toLowerCase() === searchText.toLowerCase()"
                  :key="i"
                  class="highlight"
                  >{{ fragment }}</mark
                >
                <template v-else>{{ fragment }}</template>
              </template>
            </span>

            <!-- 编辑时 -->
            <mapgis-ui-input
              v-if="record.editable"
              size="small"
              style="margin: -5px 0"
              :value="text"
              @change="
                (e) =>
                  handleChangeData(
                    e.target.value,
                    record.editableKey,
                    column.key
                  )
              "
            />
            <template v-else>
              <span :title="text">{{ text }}</span>
            </template>
          </template>
          <template slot="expandedRowRender" slot-scope="record">
            <div class="data-content">
              <mapgis-ui-textarea
                id="url"
                class="data-url"
                :value="record.url"
                :disabled="editingKey !== record.editableKey"
                @change="
                  (e) =>
                    handleChangeData(e.target.value, record.editableKey, 'url')
                "
                auto-size
              ></mapgis-ui-textarea>
              <mapgis-ui-toolbar class="data-content-toolbar">
                <mapgis-ui-toolbar-command-group>
                  <mapgis-ui-popconfirm
                    title="确认删除?"
                    @confirm="() => onDeleteData(record)"
                  >
                    <mapgis-ui-toolbar-command
                      title="删除"
                      icon="delete"
                    ></mapgis-ui-toolbar-command>
                  </mapgis-ui-popconfirm>
                </mapgis-ui-toolbar-command-group>
              </mapgis-ui-toolbar>
            </div>
          </template>
          <template slot="customRenderType" slot-scope="text">
            <span :title="typeDescription(text)">{{
              typeDescription(text)
            }}</span>
          </template>
          <!-- 编辑栏 -->
          <template slot="operation" slot-scope="text, record">
            <div class="editable-row-operations">
              <span v-if="record.editable">
                <a @click="() => handleSaveData(record.editableKey)">保存</a>
                <a @click="() => handleCancelEdit(record.editableKey)">取消</a>
              </span>
              <span v-else>
                <!-- 当editingkey有值的时候，说明有行正在编辑，其他行的编辑就变为不可用状态 -->
                <a
                  :disabled="editingKey !== ''"
                  @click="() => handleEditData(record.editableKey)"
                  >编辑</a
                >
              </span>
            </div>
          </template>
          <!-- <mapgis-ui-empty class="mapgis-ui-empty-normal" :image="simpleImage" /> -->
        </mapgis-ui-table>
      </mapgis-ui-row>
    </mapgis-ui-space>
    <add-data-category
      :categories="categories"
      :visible="addCategoryVisible"
      @finished="onAddCategoryFinished"
      @added="onAddCategoryOk"
    ></add-data-category>
  </div>
</template>

<script lang="ts">
import AddDataCategorySelect from './AddDataCategorySelect.vue'
import AddDataCategory from './AddDataCategory.vue'
import { MapgisUiEmpty } from '@mapgis/webclient-vue-ui'

export default {
  name: 'AddDataList',
  components: {
    AddDataCategorySelect,
    AddDataCategory,
  },
  props: {
    dataList: Array,
    dataTypes: Array,
    categories: Array,
  },

  data() {
    return {
      categoryName: this.categories.length ? this.categories[0].name : '',
      categoryDataList: [],
      pagination: {
        current: 1,
        showSizeChanger: true,
        size: 'small',
        // total: this.categoryDataList.length,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
        pageSizeOptions: ['5', '10', '15', '20'],
        pageSize: 10,
      },
      searchText: '',
      searchInput: null,
      searchedColumn: '',
      pageSizeOptions: ['5', '10', '15', '20'],
      selectedRowKeys: [],
      preSelectedRowKeys: [],
      addCategoryVisible: false,

      count: 0,
      // 正在编辑的当前行的key，它的作用是保持只有当前选中行是开启编辑状态，其他行的编辑按钮不可用
      editingKey: '',
      // 缓存数据，主要用于编辑后取消数据更新
      cacheData: [],
      category: [],
    }
  },

  computed: {
    'pagination.total'() {
      return this.categoryDataList.length
    },
    columns() {
      return [
        {
          title: '名称',
          dataIndex: 'name',
          sorter: (a, b) => a.name < b.name,
          ellipsis: true,
          scopedSlots: {
            filterDropdown: 'filterDropdown',
            filterIcon: 'filterIcon',
            customRender: 'customRenderName',
          },
          onFilter: (value, record) =>
            record.name.toString().toLowerCase().includes(value.toLowerCase()),
          onFilterDropdownVisibleChange: (visible) => {
            if (visible) {
              setTimeout(() => {
                this.searchInput.focus()
              }, 0)
            }
          },
        },
        {
          title: '类型',
          dataIndex: 'type',
          sorter: (a, b) =>
            this.typeDescription(a.type) < this.typeDescription(b.type),
          ellipsis: true,
          scopedSlots: { customRender: 'customRenderType' },
          filters: this.dataTypes,
          onFilter: (value, record) => record.type.indexOf(value) === 0,
        },
        {
          title: '操作',
          width: '20%',
          dataIndex: 'operation',
          scopedSlots: { customRender: 'operation' },
        },
      ]
    },

    typeDescription() {
      return function (typeVal) {
        const type = this.dataTypes.find((item) => {
          return item.value === typeVal
        })
        return type ? type.text : ''
      }
    },
  },

  watch: {
    categoryName: {
      immediate: true,
      handler() {
        this.changeCategory()
      },
    },
    categoryDataList: {
      handler(next) {
        this.count = 0
        next.forEach((item) => {
          item.editableKey = this.count++
        })
        this.cacheData = JSON.parse(JSON.stringify(next))
      },
      immediate: true,
    },
  },

  beforeCreate() {
    this.simpleImage = MapgisUiEmpty.PRESENTED_IMAGE_SIMPLE
  },

  methods: {
    changeCategory() {
      // 检查是否有编辑状态的数据
      const flag = this.checkCategoryDatalistSave()
      if (!flag) return
      this.queryData()
    },

    onCategorySelect(val) {
      this.categoryName = val
    },

    onAddCategory() {
      this.addCategoryVisible = true
    },

    onSaveData() {
      this.$emit('save')
    },

    onTableChange(pagination) {
      this.pagination = { ...pagination }
    },

    onSearch(selectedKeys, confirm, dataIndex) {
      confirm()
      this.searchText = selectedKeys[0]
      this.searchedColumn = dataIndex
    },

    onSearchReset(clearFilters) {
      clearFilters()
      this.searchText = ''
    },

    onSelectChange(selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys
      let newChecked = []
      let newUnChecked = []
      // 区分哪些是新选中的，哪些是新取消选中的
      if (this.preSelectedRowKeys.length === 0) {
        newChecked = this.selectedRowKeys
      } else if (this.selectedRowKeys.length === 0) {
        newUnChecked = this.preSelectedRowKeys
      } else {
        newChecked = this.selectedRowKeys.reduce((result, item) => {
          if (this.preSelectedRowKeys.includes(item) === false) {
            result.push(item)
          }
          return result
        }, [])

        newUnChecked = this.preSelectedRowKeys.reduce((result, item) => {
          if (this.selectedRowKeys.includes(item) === false) {
            result.push(item)
          }
          return result
        }, [])
      }

      for (let i = 0; i < this.categoryDataList.length; i++) {
        const dataItem = this.categoryDataList[i]
        if (
          newChecked.some((item) => item === dataItem.id) &&
          dataItem.visible === false
        ) {
          dataItem.visible = true
          this.addLayer(dataItem)
        }
        if (
          newUnChecked.some((item) => item === dataItem.id) &&
          dataItem.visible === true
        ) {
          dataItem.visible = false
          this.removeLayer(dataItem)
        }
      }

      this.preSelectedRowKeys = JSON.parse(JSON.stringify(this.selectedRowKeys))
    },

    onAddCategoryFinished() {
      this.addCategoryVisible = false
    },

    onAddCategoryOk({ name, description }) {
      this.$emit('add-category', { name, description })
      this.categoryName = name
    },

    onDeleteData(dataItem) {
      const selected = this.selectedRowKeys.find((key) => key === dataItem.id)
      if (selected) {
        // 需要从文档中移除
        this.removeLayer(dataItem)
      }
      this.editingKey = ''
      const index = this.categoryDataList.findIndex(
        (item) => item.id == dataItem.id
      )

      if (index >= 0) {
        this.categoryDataList.splice(index, 1)
      }
    },

    queryData() {
      const category = this.dataList.find((category) => {
        return category.name === this.categoryName
      })

      if (!category) {
        return []
      }
      this.categoryDataList = category.children
    },

    selectData(name, data) {
      this.categoryName = name
      this.queryData()
      this.selectedRowKeys.push(data.id)
      this.onSelectChange(this.selectedRowKeys)
    },

    unSelectData(id) {
      const index = this.selectedRowKeys.findIndex((item) => item === id)

      this.selectedRowKeys.splice(index, 1)
      this.onSelectChange(this.selectedRowKeys)
    },

    addLayer(dataItem) {
      this.$emit('add-layer', dataItem)
    },

    removeLayer(dataItem) {
      this.$emit('remove-layer', dataItem)
    },

    // 开启编辑
    handleEditData(key) {
      // 这个key就是当前选中行的editablekey
      // categoryDataList就是当前选中分类中所包含的数据列表，从列表中找到当前选中行（也就是选中要编辑的数据），给他添加一个editable的属性，并且属性值为true，表明要开始编辑该行，editable这个属性的作用是控制在编辑状态下开启的输入框等显示
      this.categoryDataList.forEach((item) => {
        if (item.editableKey === key) {
          this.$set(item, 'editable', true)
        }
      })
      this.editingKey = key
    },
    handleChangeData(value, key, column) {
      this.categoryDataList.forEach((item) => {
        if (item.editableKey === key) {
          item[column] = value
        }
      })
    },
    // 取消编辑
    handleCancelEdit(key) {
      // 清空正在编辑的值，表明没有行正在参与编辑，使所有行的编辑状态恢复正常
      this.editingKey = ''
      // 删除开启编辑状态时当前行设置的编辑状态（true），editable属性会控制名称栏编辑状态下显示的input输入框
      this.categoryDataList.forEach((item) => {
        if (item.editableKey === key) {
          this.$set(item, 'editable', false)
        }
      })
      this.cacheData.forEach((item) => {
        if (item.editableKey === key) {
          this.$set(item, 'editable', false)
        }
      })
      // 取消后数据恢复
      this.categoryDataList = JSON.parse(JSON.stringify(this.cacheData))
    },
    // 保存编辑
    handleSaveData(key) {
      const flag = this.checkSave()
      if (!flag) return

      this.editingKey = ''
      this.categoryDataList.forEach((item) => {
        if (item.editableKey === key) {
          this.$set(item, 'editable', false)
        }
      })
      this.cacheData = JSON.parse(JSON.stringify(this.categoryDataList))
    },
    // 检查列表是否可保存
    checkSave() {
      let result = true
      this.categoryDataList.forEach((item) => {
        if (item.editable && item.editable === true) {
          if (item.name === '' || item.url === '') {
            result = false
            this.$message.error('名称、服务地址不能为空！')
          }
        }
      })
      return result
    },
    /* 验证当前底图项下的数据列表是否全部保存 */
    checkCategoryDatalistSave() {
      let result = true
      this.categoryDataList.forEach((item) => {
        if (item.editable && item.editable === true) {
          result = false
          this.$message.error('请保存目录树中编辑状态的数据！')
        }
      })
      return result
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-add-data {
  .add-data-toolbar {
    margin-bottom: 10px;
    .add-data-category-select {
      min-width: 120px;
      padding-right: 6px;
    }
  }
  .full-width {
    width: 100%;
  }
  overflow: auto;
  .data-table {
    .data-content {
      display: flex;
      flex-direction: column;
      .data-url {
        color: $text-color-secondary;
        padding: 3px 0;
        word-break: break-all;
        white-space: break-spaces;
        font-size: 12px;
        &.mapgis-ui-input {
          border: none;
          background-color: transparent;
          resize: none;
        }
      }
      .data-content-toolbar {
        flex-direction: row-reverse;
      }
    }

    ::v-deep .mapgis-ui-table-thead > tr:first-child > th:first-child {
      border-right: 0;
      width: 0;
    }
    ::v-deep .mapgis-ui-table-thead > tr:first-child > th:last-child {
      border-right: 0;
    }
  }
}
</style>
