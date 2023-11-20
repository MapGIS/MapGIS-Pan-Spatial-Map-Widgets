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
          :action="action"
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
import { WidgetMixin, UrlUtil } from '@mapgis/web-app-framework'
import AddDataCategorySelect from './AddDataCategorySelect.vue'
import AddDataTypeSelect from './AddDataTypeSelect.vue'

export default {
  name: 'AddDataFile',
  mixins: [WidgetMixin],
  components: {
    AddDataCategorySelect,
    AddDataTypeSelect,
  },
  props: {
    categories: { type: Array },
    fileDataTypes: { type: Array },
    config: { type: Object },
  },

  data() {
    return {
      isDisabled: true,
      categoryName: this.categories.length ? this.categories[0].name : '',
      fileDataType: {},
      file: '',
      name: '',
      // 上传提示信息
      label: '单击或将文件拖到该区域以上传',
      // 接受的上传文件类型
      accept: '',
    }
  },

  watch: {
    // 二三维地图模式切换时
    is2DMapMode: {
      immediate: true,
      handler: 'mapRenderChange',
    },
    fileDataType(newVal) {
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
        case 'GeoJson':
          this.accept = '.geojson,.json'
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
    },
  },
  computed: {
    domain() {
      const protocol = window.location.protocol
      const domain = `${protocol}//${this.config.igsIp}:${this.config.igsPort}`
      return domain
    },
    action() {
      if (['TIF', 'SHP', '6X'].includes(this.fileDataType.value)) {
        return `${this.domain}/igs/rest/resource/upload`
      } else {
        return `${this.baseUrl}/psmap/rest/services/system/ResourceServer/files`
      }
    },
  },

  created() {
    this.fileDataType = this.fileDataTypes.length ? this.fileDataTypes[0] : null
  },

  methods: {
    // 二三维地图模式切换时
    mapRenderChange(newVal) {
      this.fileDataType = this.fileDataTypes.length
        ? this.fileDataTypes[0]
        : null
    },

    onCategorySelect(val) {
      this.categoryName = val
    },

    onDataTypeSelect(val) {
      this.fileDataType = val
    },

    onAdd() {
      if (!UrlUtil.isUrlValid(this.file)) {
        this.$message.warn('请上传正确的文件')
        return false
      }
      let type = 'IGSVector'
      switch (this.fileDataType.value) {
        case 'TIF':
        case 'SHP':
        case '6X':
          type = 'IGSVector'
          break
        case 'GeoJson':
          type = 'GeoJson'
          break
        case 'KML':
          type = 'KML'
          break
        case 'KMZ':
          type = 'KMZ'
          break
        case 'CZML':
          type = 'CZML'
          break
        default:
          break
      }
      const data = {
        name: this.categoryName,
        data: { type, url: this.file, name: this.name },
      }
      this.$emit('added', data)
    },

    handleChange(info) {
      if (info.file.status === 'done') {
        let path = ''
        this.isDisabled = false
        // console.log(info)
        if (['TIF', 'SHP', '6X'].includes(this.fileDataType.value)) {
          if (info.file.name.endsWith('.zip')) {
            // 上传的是zip压缩包(即shp类型文件)
            const shpItem = info.file.response.data.find((item) =>
              item.url.endsWith('shp')
            )
            path = shpItem.path
          } else {
            path = info.file.response.data[0].path
          }

          this.file = `${this.domain}/igs/rest/mrms/layers?gdbps=${path}`
        } else {
          this.file = `${window.location.origin}${info.file.response.url}`
        }

        // console.log(this.file)
      }
    },
  },
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
