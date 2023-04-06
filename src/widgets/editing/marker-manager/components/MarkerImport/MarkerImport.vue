<template>
  <mapgis-ui-modal
    class="marker-import-wrapper"
    :visible="visible"
    title="导入文件"
    :width="300"
    :mask="false"
    @cancel="onImportCancel"
    @ok="onImportOk"
  >
    <template slot="footer">
      <mapgis-ui-button key="cancel" @click="onImportCancel">
        取消
      </mapgis-ui-button>
      <mapgis-ui-button key="ok" type="primary" @click="onImportOk">
        确定
      </mapgis-ui-button>
    </template>
    <div class="marker-import-body">
      <mapgis-ui-space direction="vertical" style="flex: 1">
        <mapgis-ui-row>
          <label>文件路径</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <div style="display: flex">
            <div class="upload-content">
              <input
                ref="fileInput"
                class="inputfile"
                type="file"
                id="file"
                accept=".txt"
                @input="readImportFile('utf-8')"
              />
              <label ref="fileLabel" class="labelfile" for="file"
                >上传文件</label
              >
            </div>
            <div class="upload-tip" @click="openImportFileDesc = true">
              <mapgis-ui-tooltip title="文件格式说明">
                <mapgis-ui-iconfont type="mapgis-info-circle" />
              </mapgis-ui-tooltip>
            </div>
          </div>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <label>坐标系</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-select v-model="importOptions.crsName" style="width: 100%">
            <mapgis-ui-select-option v-for="item in crsNames" :key="item">
              {{ item }}
            </mapgis-ui-select-option>
          </mapgis-ui-select>
        </mapgis-ui-row>
      </mapgis-ui-space>
    </div>
    <mapgis-ui-modal
      v-model="openImportFileDesc"
      title="文件结构"
      :width="500"
      :footer="null"
      :mask="false"
      @ok="openImportFileDesc = false"
    >
      <marker-import-file-desc />
    </mapgis-ui-modal>
  </mapgis-ui-modal>
</template>

<script lang="ts">
import {
  UUID,
  Feature,
  markerIconInstance,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import moment from 'moment'
import MarkerImportFileDesc from './MarkerImportFileDesc.vue'
import MarkerMixin from '../../mixins/marker-add'

export default {
  name: 'MpMarkerImport',
  mixins: [MarkerMixin],
  components: { MarkerImportFileDesc },

  props: {
    visible: { type: Boolean, default: false },
  },

  data() {
    return {
      // 底图坐标系
      defaultCrs: baseConfigInstance.config.projectionName,
      importOptions: {
        crsName: this.defaultCrs,
      },
      // 坐标系下拉配置
      crsNames: baseConfigInstance.config.commonProjection.split(','),
      // 支持导入文件描述对话框的显隐
      openImportFileDesc: false,
      markers: [],
      noUtf8: false, // 文件编码格式不是utf8
    }
  },

  methods: {
    emitAdded(markers) {
      this.$emit('added', markers)
    },

    emitFinished() {
      this.$emit('finished')
    },

    // 确认按钮回调函数
    onImportOk() {
      if (this.markers.length) {
        this.emitAdded(this.markers)
      }

      this.emitFinished()
    },

    onImportCancel() {
      this.emitFinished()
    },

    readImportFile(encodingType?: string) {
      const file = this.$refs.fileInput.files[0]
      this.$refs.fileLabel.innerHTML = file.name
      const reader = new FileReader()
      // 文件内容载入完毕之后的回调。
      reader.onload = this.fileLoad.bind(this)
      if (encodingType === 'utf-8') {
        this.noUtf8 = false
      }
      encodingType = encodingType || 'utf-8'
      reader.readAsText(file, encodingType)
    },

    async fileLoad(e: any) {
      await this.analyzeFile(e.target.result)
    },

    async analyzeFile(str: string) {
      if (str.includes('�')) {
        // 当解析文件有乱码，则表示编码格式不是utf-8，使用gbk格式
        if (this.noUtf8) {
          this.$message("暂只支持编码格式为'utf-8'或者'gbk'的文件")
          return
        }
        this.noUtf8 = true
        this.readImportFile('gbk')
        return
      }
      this.markers = []

      const unSelectIcon = await markerIconInstance.unSelectIcon()

      const lines: string[] = str.split('\n')

      for (let i = 0; i < lines.length; i += 4) {
        // 每四行一个标注
        const line0: string = lines[i + 0]
        const title = line0 && (line0.split('：')[1] || line0.split(':')[1])

        const line1: string = lines[i + 1]
        const description =
          line1 && (line1.split('：')[1] || line1.split(':')[1])

        const line2 = lines[i + 2]
        const featureType =
          line2 && (line2.split('：')[1] || line2.split(':')[1])

        const line3 = lines[i + 3]
        const coordsStr = line3 && (line3.split('：')[1] || line3.split(':')[1])
        let featuresCoord = [coordsStr]

        if (featureType && coordsStr) {
          if (coordsStr.includes('#')) {
            featuresCoord = coordsStr.split('#')
          }

          const obj: Record<string, any> = {
            markerId: UUID.uuid(),
            title,
            description,
            img: unSelectIcon,
            picture: '',
          }

          let feature: Record<string, any> = {}

          if (featureType.includes('区')) {
            const polygonCoords: any[] = []
            for (let j = 0; j < featuresCoord.length; j += 1) {
              const polygonCoordsStr = featuresCoord[j]
              const arcStrs = polygonCoordsStr.split(' ')
              const arcCoordinates: any[] = []
              for (let a = 0; a < arcStrs.length; a += 1) {
                const arcCoordStr = arcStrs[a]
                const arcCoordStrs = arcCoordStr.split(',')
                const arcCoord = [
                  Number(arcCoordStrs[0]),
                  Number(arcCoordStrs[1]),
                ]
                arcCoordinates.push(arcCoord)
              }
              let arcCoords = arcCoordinates
              if (this.showCrsSelect) {
                arcCoords = await this.transPoints(
                  arcCoordinates,
                  this.importOptions.crsName
                )
              }
              polygonCoords.push(arcCoords)
            }

            feature = {
              geometry: {
                coordinates: polygonCoords,
                type: 'Polygon',
              },
              properties: {},
              type: 'Feature',
            }
            const coordinates = Feature.getGeoJSONFeatureCenter(feature)

            obj.feature = feature
            obj.coordinates = coordinates
            obj.properties = feature.properties
          } else if (featureType.includes('点') || featureType.includes('线')) {
            for (let j = 0; j < featuresCoord.length; j += 1) {
              const coordStr = featuresCoord[j]
              if (featureType.includes('点')) {
                const pointCoordStrs = coordStr.split(',')
                const pointCoordinates = [
                  Number(pointCoordStrs[0]),
                  Number(pointCoordStrs[1]),
                ]
                let pointCoords = [pointCoordinates]

                pointCoords = await this.transPoints(
                  [pointCoordinates],
                  this.importOptions.crsName,
                  this.defaultCrs
                )
                feature = {
                  geometry: {
                    coordinates: pointCoords[0],
                    type: 'Point',
                  },
                  properties: {},
                  type: 'Feature',
                }
              } else if (featureType.includes('线')) {
                const lineStrs = coordStr.split(' ')
                const lineCoordinates: any[] = []
                for (let l = 0; l < lineStrs.length; l += 1) {
                  const lineCoordStr = lineStrs[l]
                  const lineCoordStrs = lineCoordStr.split(',')
                  const lineCoord = [
                    Number(lineCoordStrs[0]),
                    Number(lineCoordStrs[1]),
                  ]
                  lineCoordinates.push(lineCoord)
                }
                let lineCoords = lineCoordinates
                if (this.showCrsSelect) {
                  lineCoords = await this.transPoints(
                    lineCoordinates,
                    this.importOptions.crsName
                  )
                }
                feature = {
                  geometry: {
                    coordinates: lineCoords,
                    type: 'LineString',
                  },
                  properties: {},
                  type: 'Feature',
                }
              }
              const coordinates = Feature.getGeoJSONFeatureCenter(feature)

              obj.feature = feature
              obj.coordinates = coordinates
              obj.properties = feature.properties
            }
          }
          this.markers.push(obj)
        }
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.marker-import-wrapper {
  .marker-import-body {
    display: flex;
  }
  .upload-content {
    flex: 1;
    height: 32px;
    border: 1px solid $primary-color;
    border-radius: 4px;
    display: flex;
    align-items: center;

    .anticon-upload {
      margin-right: 10px;
    }
    .inputfile {
      width: 0.1px;
      height: 0.1px;
      opacity: 0;
      overflow: hidden;
      position: absolute;
      z-index: -1;
    }
    .inputfile:focus + label,
    .inputfile + label:hover {
      cursor: pointer;
    }
    .labelfile {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      margin-left: 8px;
    }
  }

  .upload-tip {
    width: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
