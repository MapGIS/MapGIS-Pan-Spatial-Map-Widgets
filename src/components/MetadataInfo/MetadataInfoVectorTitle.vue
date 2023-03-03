<template>
  <div>
    <mapgis-ui-tabs default-active-key="general" size="small">
      <mapgis-ui-tab-pane key="general" tab="基本信息">
        <div class="info-body">
          <div
            v-for="(item, index) in generalInfo"
            :key="'VectorTitle' + item + index"
            class="info-item"
          >
            <span class="info-item-title" :title="item">{{ `${item}：` }}</span>
            <span>{{ metadata[item] }}</span>
          </div>
        </div>
      </mapgis-ui-tab-pane>
      <mapgis-ui-tab-pane key="layers" tab="图层信息">
        <div class="info-body">
          <div class="levels">
            <div class="info-item-title levels-title">图层信息：</div>
            <mapgis-ui-table
              bordered
              size="small"
              :scroll="{
                x: '100%',
              }"
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
      <mapgis-ui-tab-pane key="sources" tab="sources">
        <mapgis-ui-tabs type="card" size="small">
          <mapgis-ui-tab-pane
            v-for="key in sourcesOtherInfo"
            :key="'sources' + key"
            :tab="key"
          >
            <div class="info-body">
              <div
                v-for="(subValue, subKey) in sourcesInfo[key]"
                :key="subValue + key + subKey"
                class="info-item"
              >
                <span class="info-item-title" :title="subKey">
                  {{ `${subKey}：` }}
                </span>
                <span>{{ subValue }}</span>
              </div>
            </div>
          </mapgis-ui-tab-pane>
        </mapgis-ui-tabs>
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
  name: 'MpMetadataInfoVectorTitle',
  mixins: [MetadataInfoMixin],
  data() {
    return {
      arr: ['layers', 'sources', 'metadata'],
    }
  },
  computed: {
    generalInfo() {
      return Object.keys(this.metadata).filter((item) => {
        return !this.arr.includes(item)
      })
    },

    layers() {
      return Object.keys(this.metadata.layers)
    },

    tileStorageInfo() {
      return this.metadata.tileInfo
    },

    sourcesInfo() {
      return this.metadata.sources || {}
    },

    sourcesOtherInfo() {
      return Object.keys(this.sourcesInfo)
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
