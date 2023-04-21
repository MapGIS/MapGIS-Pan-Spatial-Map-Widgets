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
            <template v-else>
              <span :title="text">{{ text }}</span>
            </template>
          </template>
          <template slot="expandedRowRender" slot-scope="record">
            <div class="data-content">
              <mapgis-ui-textarea
                class="data-url"
                disabled
                :value="record.url"
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
  },

  beforeCreate() {
    this.simpleImage = MapgisUiEmpty.PRESENTED_IMAGE_SIMPLE
  },

  methods: {
    changeCategory() {
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
