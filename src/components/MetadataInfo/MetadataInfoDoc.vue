<template>
  <div>
    <mapgis-ui-tabs default-active-key="general" size="small">
      <mapgis-ui-tab-pane key="general" tab="基本信息">
        <div class="info-body">
          <div
            v-for="(item, index) in generalInfo"
            :key="'地图文档' + item + index"
            class="info-item"
          >
            <span class="info-item-title" :title="item">{{ `${item}：` }}</span>
            <span>{{ metadata[item] }}</span>
          </div>
        </div>
      </mapgis-ui-tab-pane>
      <mapgis-ui-tab-pane key="maplist" tab="地图列表">
        <mapgis-ui-tabs type="card" size="small">
          <mapgis-ui-tab-pane
            v-for="(mapInfo, m) in metadata['地图列表']"
            :key="'地图文档地图列表' + m"
            :tab="mapInfo.MapName"
          >
            <div class="info-body">
              <div
                v-for="(mapInfoItem, mi) in Object.keys(mapInfo)"
                :key="'地图文档地图列表图层列表' + mapInfoItem + mi"
                class="info-item"
              >
                <template v-if="mapInfoItem !== '图层列表'">
                  <span class="info-item-title" :title="mapInfoItem">
                    {{ `${mapInfoItem}：` }}
                  </span>
                  <span>{{ mapInfo[mapInfoItem] }}</span>
                </template>
                <template v-else>
                  <div class="layers">
                    <div
                      class="info-item-title layers-title"
                      :title="mapInfoItem"
                    >
                      {{ `${mapInfoItem}：` }}
                    </div>
                    <mapgis-ui-table
                      bordered
                      size="small"
                      :pagination="false"
                      :scroll="{
                        x: '100%',
                      }"
                      :data-source="getDataSource(mapInfo[mapInfoItem])"
                      :columns="getTableColumns(mapInfo[mapInfoItem][0])"
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
  name: 'MpMetadataInfoDoc',
  mixins: [MetadataInfoMixin],
  computed: {
    generalInfo() {
      return Object.keys(this.metadata).filter((item) => {
        return item !== '地图列表'
      })
    },
  },
}
</script>

<style lang="less">
.metadata-info-container {
  .layers {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    .layers-title {
      padding-bottom: 8px;
    }
  }
}
</style>
