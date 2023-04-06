<template>
  <div>
    <mapgis-ui-tabs default-active-key="general" size="small">
      <mapgis-ui-tab-pane key="general" tab="基本信息">
        <div class="info-body">
          <div
            v-for="(item, index) in generalInfo"
            :key="'Arcgis' + item + index"
            class="info-item"
          >
            <span class="info-item-title" :title="item">{{ `${item}：` }}</span>
            <span>{{ metadata[item] }}</span>
          </div>
        </div>
      </mapgis-ui-tab-pane>
      <mapgis-ui-tab-pane key="document" tab="文档信息">
        <div class="info-body">
          <div
            v-for="(item, index) in documentInfo"
            :key="'documentInfo' + item + index"
            class="info-item"
          >
            <span class="info-item-title" :title="item">{{ `${item}：` }}</span>
            <span>{{ metadata.documentInfo[item] }}</span>
          </div>
          <div class="levels">
            <div class="info-item-title levels-title">图层信息：</div>
            <mapgis-ui-table
              bordered
              size="small"
              :scroll="{
                x: '100%',
              }"
              :pagination="false"
              :data-source="getDataSource(metadata.layers)"
              :columns="getTableColumns(metadata.layers[0])"
              :rowKey="
                (record, index) => {
                  return index
                }
              "
            >
            </mapgis-ui-table>
          </div>
        </div>
      </mapgis-ui-tab-pane>
      <mapgis-ui-tab-pane
        v-if="tileStorageInfo"
        key="storage"
        tab="瓦片存储信息"
      >
        <div class="info-body">
          <div
            v-for="(storageInfoItem, si) in Object.keys(tileStorageInfo)"
            :key="'瓦片存储' + storageInfoItem + si"
            class="info-item"
          >
            <template v-if="storageInfoItem !== 'lods'">
              <span class="info-item-title" :title="storageInfoItem">
                {{ `${storageInfoItem}：` }}
              </span>
              <span>{{ tileStorageInfo[storageInfoItem] }}</span>
            </template>
            <template v-else>
              <div class="levels">
                <div
                  class="info-item-title levels-title"
                  :title="storageInfoItem"
                >
                  各级信息：
                </div>
                <mapgis-ui-table
                  bordered
                  size="small"
                  :scroll="{
                    x: '100%',
                  }"
                  :pagination="false"
                  :data-source="getDataSource(tileStorageInfo[storageInfoItem])"
                  :columns="
                    getTableColumns(tileStorageInfo[storageInfoItem][0])
                  "
                  :rowKey="
                    (record, index) => {
                      return index
                    }
                  "
                >
                </mapgis-ui-table>
              </div>
            </template>
          </div>
        </div>
      </mapgis-ui-tab-pane>
    </mapgis-ui-tabs>
  </div>
</template>

<script lang="ts">
import {
  LayerType,
  IGSMapImageLayer,
  IGSVectorLayer,
  IGSTileLayer,
  Layer,
} from '@mapgis/web-app-framework'
import MetadataInfoMixin from './mixins/metadata-info'

export default {
  name: 'MpMetadataInfoArcgis',
  mixins: [MetadataInfoMixin],
  data() {
    return {
      arr: [
        'documentInfo',
        'layers',
        'datumTransformations',
        'tileInfo',
        // 'fullExtent',
        // 'initialExtent',
        'spatialReference',
        'tables',
      ],
    }
  },
  computed: {
    generalInfo() {
      return Object.keys(this.metadata).filter((item) => {
        return !this.arr.includes(item)
      })
    },
    documentInfo() {
      return Object.keys(this.metadata.documentInfo)
    },
    tileStorageInfo() {
      return this.metadata.tileInfo
    },
  },
}
</script>

<style lang="less">
.metadata-info-container {
  .levels {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    .levels-title {
      padding-bottom: 8px;
    }
  }
}
</style>
