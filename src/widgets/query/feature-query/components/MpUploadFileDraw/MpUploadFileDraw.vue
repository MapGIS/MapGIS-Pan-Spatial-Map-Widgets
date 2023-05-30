<template>
  <div class="gm-tool-content tool-uploadFile">
    <div class="title header">
      文件上传
      <span
        class="panel-close"
        title="关闭"
        @click="
          clear()
          $emit('close')
        "
        ><mapgis-ui-ant-icon type="close"></mapgis-ui-ant-icon
      ></span>
    </div>
    <div class="content">
      <mapgis-ui-upload-dragger
        ref="gmUpload"
        class="upload-demo"
        drag
        :limit="1"
        accept=".wp,.wl"
        :before-upload="beforeUpload"
      >
        <mapgis-ui-ant-icon type="cloud-upload"></mapgis-ui-ant-icon>
        <div class="mapgis-ui-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <div class="mapgis-ui-upload__text" style="font-size: 10px">
          只支持.wp,.WP,.WL,.wl(经纬度)文件
        </div>
      </mapgis-ui-upload-dragger>
    </div>
  </div>
</template>
<script>
/* eslint-disable */
// @ts-nocheck
import { UUID, baseConfigInstance } from '@mapgis/web-app-framework'
import axios from 'axios'

export default {
  name: 'MpUploadFileDraw',
  // mixins: [map],

  props: {
    is2DMapMode: Boolean,
    // 线或点的缓冲半径，单位为米
    radius: {
      type: Number,
      default: 10, //默认10米
    },
    name: {
      type: String,
      default: 'upload',
    },
    color: {
      type: String,
      default: '#3388ff', //默认颜色
    },
  },
  data() {
    return {
      container: null,
      fileList: [],
      ip: baseConfigInstance.config.ip,
      port: baseConfigInstance.config.port,
    }
  },
  methods: {
    //上传成功
    onSuccess(response, file, fileList) {
      let shapeInfo = {
        type: this.name,
        geometry: response,
        id: UUID.uuid(),
      }
      if (this.is2DMapMode) {
        this.$emit('draw-shape', shapeInfo)
      } else {
        this.$emit('draw-shape-3d', shapeInfo)
      }

      this.$emit('close')
    },
    beforeUpload(file) {
      this.fileList = [...this.fileList, file]
      this.handleUpload()
      return false
    },
    async handleUpload() {
      const { fileList } = this
      const formData = new FormData()
      fileList.forEach((file) => {
        formData.append('files', file)
      })
      this.uploading = true
      try {
        const res = await this.uploadFile(formData)
        if (res.status === 200) {
          this.fileList = []
          try {
            const result = await this.featureQuery(res.data.uploadFiles[0].path)
            if (result.status === 200) {
              if (result.data.features[0].geometry.type === 'LineString') {
                this.onSuccess(result.data.features[0].geometry)
              } else if (result.data.features[0].geometry.type === 'Polygon') {
                const coordinatesArr = []
                result.data.features.forEach((feature) => {
                  coordinatesArr.push(feature.geometry.coordinates)
                })
                this.onSuccess({
                  type: 'MultiPolygon',
                  coordinates: coordinatesArr,
                })
              }
            }
          } catch (error) {
            this.uploading = false
            this.$message.error('查询失败')
          }
        } else {
          this.uploading = false
          this.$message.error('上传失败')
        }
      } catch (e) {
        this.uploading = false
        this.$message.error('上传失败')
      }
    },
    uploadFile(param) {
      return axios.post(
        `http://${this.ip}:${this.port}/igs/rest/services/system/ResourceServer/files`,
        param,
        { headers: { 'Content-type': 'multipart/form-data' } }
      )
    },
    featureQuery(path) {
      return axios.get(
        `http://${this.ip}:${this.port}/igs/rest/services/system/ResourceServer/tempData/features/query?f=json&url=${path}`
      )
    },
    clear() {
      this.fileList &&
        this.fileList.length &&
        this.fileList.forEach((item, index) => {
          this.fileList.splice(index, 1)
        })
    },
  },
  watch: {},
  mounted() {},
  beforeDestroy() {},
}
</script>

<style></style>

<style lang="scss" scoped>
.gm-tool-content {
  padding-top: 44px;
  .header {
    padding: 12px;
    font-size: 14px;
    height: 44px;
    margin-top: -44px;
    margin-bottom: 0;
    box-sizing: border-box;
    .panel-close {
      float: right;
      &:hover {
        cursor: pointer;
      }
    }
  }
  .content {
    padding: 10px;
    font-size: 14px;
    height: 100%;
    box-sizing: border-box;
  }
}
</style>
