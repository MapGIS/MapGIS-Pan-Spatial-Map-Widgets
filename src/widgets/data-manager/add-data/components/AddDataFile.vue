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
        <!-- 走IGS服务要这种方式 -->
        <mapgis-ui-upload-dragger
          v-if="['TIF', 'SHP', '6X'].includes(fileDataType.value)"
          name="file"
          :action="action"
          :accept="accept"
          drag
          :limit="1"
          :file-list="fileList"
          :remove="handleRemove"
          :before-upload="beforeUpload"
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
        <!-- 走一张图服务服务要这种方式 -->
        <mapgis-ui-upload-dragger
          v-else
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
import {
  WidgetMixin,
  UrlUtil,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import AddDataCategorySelect from './AddDataCategorySelect.vue'
import AddDataTypeSelect from './AddDataTypeSelect.vue'
import axios from 'axios'

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
      fileList: [],
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
      let ip
      let port
      if (!!this.config && !!this.config.igsIp && !!this.config.igsPort) {
        ip = this.config.igsIp
        port = this.config.igsPort
      } else {
        ip = baseConfigInstance.config.ip
        port = baseConfigInstance.config.port
      }
      const domain = `http://${ip}:${port}`
      return domain
    },
    action() {
      if (['TIF', 'SHP', '6X'].includes(this.fileDataType.value)) {
        return `${this.domain}/igs/rest/services/system/ResourceServer/files`
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
    beforeUpload(file) {
      if (!this.accept.includes(file.name.split('.')[1])) {
        this.$message.error('文件格式错误')
        return false
      }
      this.handleUpload(file)
      return false
    },
    uploadFile(param) {
      return axios.post(this.action, param, {
        headers: { 'Content-type': 'multipart/form-data' },
      })
    },
    async handleUpload(file) {
      const formData = new FormData()
      formData.append('files', file)
      if (this.fileDataType.value === 'SHP') {
        formData.append('unZip', true)
      }
      try {
        const res = await this.uploadFile(formData)
        if (res.status === 200) {
          this.fileList = [...this.fileList, file]
          let path = ''
          this.isDisabled = false
          if (res.data.uploadFiles[0].name.endsWith('.zip')) {
            // 上传的是zip压缩包(即shp类型文件)
            const shpItem = res.data.uploadFiles.find((item) =>
              item.path.endsWith('shp')
            )
            path = shpItem.path
          } else {
            path = res.data.uploadFiles[0].path
          }
          this.file = `${this.domain}/igs/rest/mrms/layers?gdbps=${path}`
        } else {
          this.$message.error('上传失败')
        }
      } catch (e) {
        this.$message.error('上传失败')
      }
    },
    handleRemove(file) {
      const index = this.fileList.findIndex((item) => item.uid === file.uid)
      if (index > -1) {
        this.fileList.splice(index, 1)
      }
    },
    handleChange(info) {
      if (info.file.status === 'done') {
        this.isDisabled = false
        this.file = `${window.location.origin}${info.file.response.url}`
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
