<template>
  <div class="add-data-url-wrapper beauty-scroll">
    <mapgis-ui-space direction="vertical" style="flex: 1">
      <mapgis-ui-row>
        <label>分类</label>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <add-data-category-select
          :categories="categories"
          :value="categoryName"
          @select="onCategorySelect"
          class="full-width"
        />
      </mapgis-ui-row>
      <mapgis-ui-row>
        <label>类型</label>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <add-data-type-select
          :types="urlDataTypes"
          :value="urlDataType"
          @select="onDataTypeSelect"
          class="full-width"
        />
      </mapgis-ui-row>
      <mapgis-ui-row>
        <label>地址</label>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-textarea v-model="url" auto-size> </mapgis-ui-textarea>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-textarea
          class="url-example"
          disabled
          :value="`示例 : ${this.urlDataType.example}`"
          auto-size
        ></mapgis-ui-textarea>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <label>名称</label>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-input v-model="name"> </mapgis-ui-input>
      </mapgis-ui-row>
      <template v-if="hasToken">
        <mapgis-ui-row>
          <label>令牌</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-input v-model="token"> </mapgis-ui-input>
        </mapgis-ui-row>
      </template>
      <mapgis-ui-row>
        <mapgis-ui-button
          type="primary"
          @click="onAdd"
          class="full-width"
          style="margin-top: 10px"
          :disabled="url.length == 0 || name.length == 0"
        >
          添加
        </mapgis-ui-button>
      </mapgis-ui-row>
    </mapgis-ui-space>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { UrlUtil } from '@mapgis/web-app-framework'
import AddDataCategorySelect from './AddDataCategorySelect.vue'
import AddDataTypeSelect from './AddDataTypeSelect.vue'

@Component({
  name: 'AddDataUrl',
  components: {
    AddDataCategorySelect,
    AddDataTypeSelect,
  },
})
export default class AddDataUrl extends Vue {
  @Prop({ type: Array }) urlDataTypes

  @Prop({ type: Array }) categories

  private categoryName = this.categories.length ? this.categories[0].name : ''

  private urlDataType = this.urlDataTypes.length ? this.urlDataTypes[0] : null

  private url = ''

  private name = ''

  private token = ''

  get hasToken() {
    return (
      (this.urlDataType && this.urlDataType.value === 'IMAGEARCGIS') || false
    )
  }

  onCategorySelect(val) {
    this.categoryName = val
  }

  onDataTypeSelect(val) {
    this.urlDataType = val
  }

  onAdd() {
    if (!UrlUtil.isUrlValid(this.url)) {
      this.$message.warn('请输入正确的数据地址')
      return
    }

    // 应该要对地址进行解析，判断是否有效
    const data = {
      name: this.categoryName,
      data: { type: this.urlDataType.value, url: this.url, name: this.name },
    }
    if (this.hasToken) {
      this.$set(data.data, 'token', this.token)
    }
    this.$emit('added', data)
  }
}
</script>

<style lang="scss" scoped>
.add-data-url-wrapper {
  overflow: auto;
  display: flex;
  .full-width {
    width: 100%;
  }
  .url-example {
    padding: 3px 0;
    color: $text-color-secondary;
    word-break: break-all;
    white-space: break-spaces;
    font-size: 12px;
    &.mapgis-ui-input {
      border: none;
      background-color: transparent;
      resize: none;
      min-height: 24px;
    }
  }
}
</style>
