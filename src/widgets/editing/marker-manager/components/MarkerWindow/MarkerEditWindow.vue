<template>
  <mapgis-ui-modal
    class="marker-edit-wrapper"
    :visible="visible"
    title="标注"
    :width="300"
    :mask="false"
    @cancel="onCancel"
    @ok="$emit('ok', markerValue)"
  >
    <div class="marker-edit-body">
      <mapgis-ui-space direction="vertical" style="flex: 1">
        <mapgis-ui-row>
          <label>名称</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-input v-model="markerValue.title" />
        </mapgis-ui-row>
        <mapgis-ui-row>
          <label>描述</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-textarea
            v-model="markerValue.description"
            :auto-size="{ minRows: 2, maxRows: 6 }"
          />
        </mapgis-ui-row>
        <mapgis-ui-row>
          <label>图片</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-upload
            :multiple="false"
            method="post"
            :withCredentials="true"
            accept=".jpg, image/*"
            :action="
              baseUrl +
              `/${appProductName}/rest/services/system/ResourceServer/files/pictures`
            "
            list-type="picture-card"
            :file-list="fileList"
            @preview="onFilePreview"
            @change="onFileChange"
          >
            <div v-if="fileList.length < 1">
              <mapgis-ui-iconfont type="mapgis-plus" />
              <div class="ant-upload-text">上传</div>
            </div>
          </mapgis-ui-upload>
          <mapgis-ui-modal
            :visible="previewVisible"
            :footer="null"
            @cancel="onPreviewCancel"
          >
            <img style="width: 100%" :src="previewImage" />
          </mapgis-ui-modal>
        </mapgis-ui-row>
      </mapgis-ui-space>
    </div>
  </mapgis-ui-modal>
</template>

<script lang="ts">
import { AppMixin, UUID } from '@mapgis/web-app-framework'

export default {
  name: 'MarkerEditWindow',
  mixins: [AppMixin],
  props: {
    marker: {
      type: Object,
      required: true,
    },
    visible: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      markerValue: {},
      previewVisible: false,
      previewImage: '',
      fileList: [],
    }
  },

  watch: {
    marker: {
      immediate: true,
      handler: 'markerChange',
    },
  },

  methods: {
    markerChange() {
      this.updateMarkerValue()
    },

    onFileChange({ fileList, file }) {
      this.fileList = fileList
      if (file.status === 'done') {
        this.markerValue.picture = file.response.url
      }
    },

    onCancel() {
      // 还原markerValue
      this.updateMarkerValue()
      this.$emit('cancel')
    },

    onFilePreview(file) {
      this.previewVisible = true
      this.previewImage = file.url || `${this.baseUrl}${file.response.url}`
    },

    onPreviewCancel() {
      this.previewVisible = false
    },

    updateMarkerValue() {
      this.markerValue = { ...this.marker }

      if (this.markerValue.picture) {
        this.fileList = [
          {
            uid: UUID.uuid(),
            name: 'image.png',
            status: 'done',
            url: `${this.baseUrl}${this.markerValue.picture}`,
          },
        ]
      } else {
        this.fileList = []
      }
    },
  },
}
</script>

<style lang="less" scoped>
.marker-edit-wrapper {
  .marker-edit-body {
    display: flex;
  }
}
</style>

<style lang="less">
.marker-edit-wrapper {
  .mapgis-ui-upload-select-picture-card i {
    font-size: 32px;
    color: #999;
  }
  .mapgis-ui-upload-select-picture-card .mapgis-ui-upload-text {
    margin-top: 8px;
    color: #666;
  }
}
</style>
