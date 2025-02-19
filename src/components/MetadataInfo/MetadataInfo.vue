<template>
  <div class="metadata-info-container">
    <mp-metadata-info-cloud
      v-if="currentConfig && !currentConfig.type && currentConfig.metaData"
      :metadata="currentConfig.metaData"
    >
    </mp-metadata-info-cloud>
    <mapgis-ui-spin :spinning="spinning" size="small">
      <template v-if="metadata">
        <div v-if="isCloudData || isModelCache(currentLayer || currentConfig)">
          <mp-metadata-info-json :metadata="metadata"></mp-metadata-info-json>
        </div>
        <div v-else>
          <div v-if="isIGSMapImage(currentLayer || currentConfig)">
            <mp-metadata-info-doc :metadata="metadata"></mp-metadata-info-doc>
          </div>
          <div v-if="isIGSTile(currentLayer || currentConfig)">
            <mp-metadata-info-tile :metadata="metadata"></mp-metadata-info-tile>
          </div>
          <div v-if="isIGSVector(currentLayer || currentConfig)">
            <mp-metadata-info-vector
              :metadata="metadata"
            ></mp-metadata-info-vector>
          </div>
          <div v-if="isIGSScene(currentLayer || currentConfig)">
            <mp-metadata-info-doc-3-d
              :metadata="metadata"
            ></mp-metadata-info-doc-3-d>
          </div>
          <div v-if="isArcgis(currentLayer || currentConfig)">
            <mp-metadata-info-arcgis
              :metadata="metadata"
            ></mp-metadata-info-arcgis>
          </div>
          <div v-if="isVectorTitle(currentLayer || currentConfig)">
            <mp-metadata-info-vector-title
              :metadata="metadata"
            ></mp-metadata-info-vector-title>
          </div>
        </div>
      </template>
    </mapgis-ui-spin>
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  IGSMapImageLayer,
  IGSVectorLayer,
  IGSTileLayer,
  Layer,
  Metadata,
  baseConfigInstance,
  DataCatalogManager,
} from '@mapgis/web-app-framework'

import MpMetadataInfoDoc from './MetadataInfoDoc'
import MpMetadataInfoTile from './MetadataInfoTile'
import MpMetadataInfoVector from './MetadataInfoVector'
import MpMetadataInfoDoc3D from './MetadataInfoDoc3D'
import MpMetadataInfoArcgis from './MetadataInfoArcgis.vue'
import MpMetadataInfoVectorTitle from './MetadataInfoVectorTitle.vue'
import MpMetadataInfoCloud from './MetadataInfoCloud.vue'
import MpMetadataInfoJson from './MetadataInfoJson.vue'

export default {
  name: 'MpMetadataInfo',
  inject: ['vueCesium'],
  components: {
    MpMetadataInfoDoc,
    MpMetadataInfoTile,
    MpMetadataInfoVector,
    MpMetadataInfoDoc3D,
    MpMetadataInfoArcgis,
    MpMetadataInfoVectorTitle,
    MpMetadataInfoCloud,
    MpMetadataInfoJson,
  },
  props: ['currentLayer', 'currentConfig', 'currentOGCMetadata'],
  data() {
    return {
      metadata: null,
      tableColumns: [],
      spinning: false,
      isCloudData: false,
    }
  },
  methods: {
    cloudMetaData() {
      return JSON.stringify(this.currentConfig.metaData)
    },
    isIGSVector(item) {
      return (
        item.type === LayerType.IGSVector ||
        (item.layer && item.layer.type === LayerType.IGSMapImage)
      )
    },

    isIGSTile(item) {
      return item.type === LayerType.IGSTile
    },

    isIGSMapImage(item) {
      return item.type === LayerType.IGSMapImage
    },

    isModelCache(item) {
      return item.type === LayerType.ModelCache
    },

    isArcgis(item) {
      return (
        item.type === LayerType.ArcGISMapImage ||
        item.type === LayerType.ArcGISTile
      )
    },

    isIGSScene({ type, layer }) {
      let layerType = type
      if (layer) {
        layerType = layer.type
      }
      return layerType === LayerType.IGSScene
    },

    isVectorTitle(item) {
      return item.type === LayerType.VectorTile
    },
    // 将获取到的元数据信息递归进行标准化转换
    formatValue(value, dictionaryItems, obj) {
      const key = value[0]
      if (!key) return
      const filterDictionaryItems = dictionaryItems.filter(
        (item) => item.value === value[0]
      )
      if (filterDictionaryItems) {
        obj.label += `${filterDictionaryItems[0].label}/`
      }
      this.formatValue(value.splice(1), filterDictionaryItems[0].children, obj)
    },
    // 筛选元数据信息提取需要展示的字段
    formatMetadata(metadataCopy) {
      if (metadataCopy && Object.keys(metadataCopy).length > 0) {
        return metadataCopy.groups.map((item) => {
          const items = item.items.map((i) => {
            if (i.dictionaryItems && i.value) {
              i.label = ''
              this.formatValue(i.value, i.dictionaryItems, i)
              if (i.label && i.label.endsWith('/')) {
                i.label = i.label.substring(0, i.label.length - 1)
              }
            }
            return { key: i.nickName, value: i.label || i.value }
          })
          const metadataItem = {
            label: item.groupName,
            items,
          }
          return metadataItem
        })
      }
    },
    getVoxelLayer() {
      const { vueCesium } = this
      const vueIndex = this.currentLayer.id
      const vueKey = 'default'
      let find = vueCesium.M3DIgsManager.findSource(vueKey, vueIndex)
      if (find) {
        let m3ds = find.source
        return m3ds[0]
      }
    },
    /**
     * 获取图层元信息
     */
    getVoxelMetaData() {
      const tileset = this.getVoxelLayer()
      const haderInfo = tileset.root._header || {}
      const { voxelInfo, fieldInfos } = tileset.layerinfo[0] || {}
      const { dimensions, time } = voxelInfo
      const classInfoJson = {
        key: '类属性',
        value: {
          '空间参考系': haderInfo.spatialReference,
          '体元个数': {
            T: time.size,
            X: dimensions[0],
            Y: dimensions[1],
            Z: dimensions[2],
          },
        },
      }
      const variableInfo = {}
      fieldInfos.forEach((field) => {
        variableInfo[field.name] = {
          '名称': field.name,
          '最小值': field.minValue,
          '最大值': field.maxValue,
        }
      })
      const variableJson = {
        key: '变量信息',
        value: variableInfo,
      }
      return Promise.resolve([classInfoJson, variableJson])
    },
    async getMetaData(currentLayer) {
      if (currentLayer) {
        const { type } = currentLayer.layer || currentLayer
        if (!type || type === LayerType.OGCWMS || type === LayerType.OGCWMTS) {
          return
        }
        const defaultToken = baseConfigInstance.config.token
        let option: Metadata.MetadataQueryParam = {}
        // 栅格体元本身的元数据信息
        let metaDataOfVoxel = []
        // 云管配置的元数据信息
        let metaDataOfCloud = []
        switch (type) {
          case LayerType.STKTerrain: {
            const serverName = currentLayer.serverName
            const ip = currentLayer.ip
            const port = currentLayer.port
            option = { ip, port, docName: serverName }
            break
          }
          case LayerType.ModelCache: {
            if (
              currentLayer.metaData &&
              currentLayer.metaData.dataContentType === 'VoxelGrid'
            ) {
              metaDataOfVoxel = await this.getVoxelMetaData()
            } else {
              // metaDataOfVoxel = currentLayer.metaData
            }
            const res = currentLayer._parseUrl(currentLayer.url)

            const { domain, docName } = res
            option = { domain, docName }
            break
          }
          case LayerType.IGSScene: {
            let res
            if (currentLayer.layer) {
              res = currentLayer.layer._parseUrl(currentLayer.layer.url)
            } else {
              res = currentLayer._parseUrl(currentLayer.url)
            }
            const { domain, docName } = res
            option = { domain, docName, globe: true }
            break
          }
          case LayerType.IGSMapImage: {
            if (currentLayer.layer) {
              const { id } = currentLayer
              const { domain, docName } = currentLayer.layer._parseUrl(
                currentLayer.layer.url
              )
              option = { domain, docName, layerIdxs: id || '' }
            } else {
              const { domain, docName } = currentLayer._parseUrl(
                currentLayer.url
              )
              option = { domain, docName }
            }

            break
          }
          case LayerType.IGSTile: {
            const { domain, tileName } = currentLayer._parseUrl(
              currentLayer.url
            )
            option = { domain, tileName }
            break
          }
          case LayerType.IGSVector: {
            const { gdbps } = currentLayer
            const { domain } = currentLayer._parseUrl(currentLayer.url)
            option = { domain, gdbp: gdbps }
            break
          }
          case LayerType.ArcGISMapImage:
          case LayerType.ArcGISTile: {
            const { url } = currentLayer
            option = { url }
            break
          }
          case LayerType.VectorTile: {
            const { url } = currentLayer
            option = { url }
            break
          }
          default:
            break
        }
        this.spinning = true
        // 后台配置了token就先走云管
        if (defaultToken) {
          option.token = defaultToken
          const metadata = await Metadata.CloudMetaDataQuery.query(option)

          if (metadata) {
            if (type === LayerType.ModelCache) {
              const metadataCopy = JSON.parse(JSON.stringify(metadata))
              metaDataOfCloud = this.formatMetadata(metadataCopy)
            } else {
              const metadataCopy = JSON.parse(JSON.stringify(metadata))
              this.metadata = this.formatMetadata(metadataCopy)
              this.spinning = false
              this.isCloudData = true
              return
            }
          }
        }
        if (
          type === LayerType.ArcGISMapImage ||
          type === LayerType.ArcGISTile
        ) {
          this.metadata = await Metadata.ArcGISMetadataQuery.getServiceInfo(
            option.url
          )
        } else if (type === LayerType.VectorTile) {
          this.metadata = await Metadata.VectorTileMetadataQuery.getServiceInfo(
            option.url
          )
        } else if (type === LayerType.ModelCache) {
          this.metadata = [
            { label: '基础信息', items: metaDataOfVoxel },
            ...metaDataOfCloud,
          ]
        } else {
          this.metadata = await Metadata.MetaDataQuery.query(option)
        }
        this.spinning = false
        this.isCloudData = false
      }
    },
  },
  watch: {
    currentLayer: {
      deep: true,
      immediate: true,
      async handler() {
        this.getMetaData(this.currentLayer)
      },
    },
    currentConfig: {
      deep: true,
      immediate: true,
      async handler() {
        if (this.currentConfig) {
          const layer = DataCatalogManager.generateLayerByConfig(
            this.currentConfig
          )
          this.getMetaData(layer)
        }
      },
    },
    currentOGCMetadata: {
      deep: true,
      immediate: true,
      handler() {
        if (this.currentOGCMetadata) {
          const metadata = JSON.parse(JSON.stringify(this.currentOGCMetadata))
          this.metadata = this.formatMetadata(metadata)
          this.isCloudData = true
        }
      },
    },
  },
}
</script>

<style lang="scss" scoped>
.metadata-info-container {
  .info-body {
    .info-item {
      .info-item-title {
        color: $heading-color;
      }
    }
  }
}
</style>

<style lang="scss">
.metadata-info-container {
  .mapgis-ui-tabs {
    .mapgis-ui-tabs-bar {
      margin-bottom: 8px;
      .mapgis-ui-tabs-tab {
        padding: 0 16px 8px 16px;
      }
    }
  }
  .info-body {
    padding-left: 15px;
    letter-spacing: 0.7px;
    word-break: break-word;
    word-wrap: break-word;
    white-space: normal;
    .info-item {
      display: flex;
      justify-content: flex-start;
      flex-flow: row nowrap;
      padding-bottom: 8px;
      &:last-child {
        padding-bottom: 0;
      }
      .info-item-title {
        display: block;
        width: 150px;
        min-width: 150px;
        margin-right: 20px;
        word-break: keep-all;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
