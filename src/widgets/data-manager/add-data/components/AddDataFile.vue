<template>
  <div class="add-data-file-wrapper beauty-scroll">
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
          :types="fileDataTypes"
          :value="fileDataType"
          @select="onDataTypeSelect"
          class="full-width"
        />
      </mapgis-ui-row>
      <mapgis-ui-row>
        <label>地址</label>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-textarea v-model="file" auto-size :disabled="isDisabled">
        </mapgis-ui-textarea>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <label>名称</label>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-input v-model="name"> </mapgis-ui-input>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-upload-dragger
          name="file"
          :action="`http://${config.igsIp}:${config.igsPort}/igs/rest/resource/upload`"
          :accept="accept"
          @change="handleChange"
        >
          <div class="upload-content">
            <mapgis-ui-iconfont
              type="mapgis-upload"
              :style="{ fontSize: '36px' }"
            />
            <p>{{ label }}</p>
          </div>
        </mapgis-ui-upload-dragger>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-button
          type="primary"
          @click="onAdd"
          class="full-width"
          style="margin-top: 10px"
          :disabled="file.length == 0 || name.length == 0"
        >
          添加
        </mapgis-ui-button>
      </mapgis-ui-row>
    </mapgis-ui-space>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import { WidgetMixin, UrlUtil } from '@mapgis/web-app-framework'
import AddDataCategorySelect from './AddDataCategorySelect.vue'
import AddDataTypeSelect from './AddDataTypeSelect.vue'

@Component({
  name: 'AddDataFile',
  components: {
    AddDataCategorySelect,
    AddDataTypeSelect,
  },
})
export default class AddDataFile extends Mixins(WidgetMixin) {
  @Prop({ type: Array }) categories

  @Prop({ type: Array }) fileDataTypes

  @Prop({ type: Object }) config

  private isDisabled = true

  private categoryName = this.categories.length ? this.categories[0].name : ''

  private fileDataType = {}

  private file = ''

  private name = ''

  // 上传提示信息
  private label = '单击或将文件拖到该区域以上传'

  // 接受的上传文件类型
  private accept = ''

  // 二三维地图模式切换时
  @Watch('is2DMapMode', { immediate: true })
  mapRenderChange(newVal) {
    this.fileDataType = this.fileDataTypes.length ? this.fileDataTypes[0] : null
  }

  @Watch('fileDataType')
  onFileTypeChange(newVal) {
    switch (newVal.value) {
      case 'TIF':
        this.accept = '.tif,.tiff,.ovr'
        break
      case 'SHP':
        this.accept = '.zip'
        break
      case '6X':
        this.accept = '.wp,.wt,.wl'
        break
      case 'KML':
        this.accept = '.kml'
        break
      case 'KMZ':
        this.accept = '.kmz'
        break
      case 'CZML':
        this.accept = '.czml'
        break
      default:
        break
    }
  }

  created() {
    this.fileDataType = this.fileDataTypes.length ? this.fileDataTypes[0] : null
  }

  onCategorySelect(val) {
    this.categoryName = val
  }

  onDataTypeSelect(val) {
    this.fileDataType = val
  }

  onAdd() {
    if (!UrlUtil.isUrlValid(this.file)) {
      this.$message.warn('请上传正确的文件')
      return false
    }
    const data = {
      name: this.categoryName,
      data: { type: 'IGSVector', url: this.file, name: this.name },
    }
    this.$emit('added', data)
  }

  private handleChange(info) {
    if (info.file.status === 'done') {
      let path = ''
      this.isDisabled = false
      console.log(info)
      if (info.file.name.endsWith('.zip')) {
        // 上传的是zip压缩包(即shp类型文件)
        const shpItem = info.file.response.data.find((item) =>
          item.url.endsWith('shp')
        )
        path = shpItem.path
      } else {
        path = info.file.response.data[0].path
      }

      this.file = `http://${this.config.igsIp}:${this.config.igsPort}/igs/rest/mrms/layers?gdbps=${path}`

      console.log(this.file)
    }
  }
}
</script>

<style lang="scss" scoped>
.add-data-file-wrapper {
  display: flex;
  overflow: auto;
  .full-width {
    width: 100%;
  }
}
</style>
