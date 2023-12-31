<template>
  <div>
    <mapgis-ui-tabs default-active-key="general" size="small">
      <mapgis-ui-tab-pane
        v-for="generalInfoKey in generalInfo"
        :key="generalInfoKey"
        :tab="generalInfoKey"
      >
        <div class="info-body">
          <div
            v-for="(val, key) in metadata[generalInfoKey]"
            :key="'图层' + key"
            class="info-item"
          >
            <span class="info-item-title" :title="key">{{ `${key}：` }}</span>
            <span>{{ val }}</span>
          </div>
        </div>
      </mapgis-ui-tab-pane>
      <mapgis-ui-tab-pane key="range" tab="空间范围">
        <mapgis-ui-tabs type="card" size="small">
          <mapgis-ui-tab-pane
            v-for="(range, rangeType) in metadata['空间范围']"
            :key="'空间范围' + rangeType"
            :tab="rangeType"
          >
            <div class="info-body">
              <div
                v-for="(value, key) in range"
                :key="'空间范围' + rangeType + key"
                class="info-item"
              >
                <span class="info-item-title" :title="key">
                  {{ `${key}：` }}
                </span>
                <span>{{ value }}</span>
              </div>
            </div>
          </mapgis-ui-tab-pane>
        </mapgis-ui-tabs>
      </mapgis-ui-tab-pane>
      <mapgis-ui-tab-pane key="srs" tab="空间参照系">
        <mapgis-ui-tabs type="card" size="small">
          <mapgis-ui-tab-pane key="general" tab="基本信息">
            <div class="info-body">
              <div
                v-for="key in srsGenegralInfo"
                :key="'空间参照系' + key"
                class="info-item"
              >
                <span class="info-item-title" :title="key"
                  >{{ `${key}：` }}
                </span>
                <span>{{ srsInfo[key] }}</span>
              </div>
            </div>
          </mapgis-ui-tab-pane>
          <mapgis-ui-tab-pane
            v-for="key in srsOtherInfo"
            :key="'空间参照系' + key"
            :tab="key"
          >
            <div class="info-body">
              <div
                v-for="(subValue, subKey) in srsInfo[key]"
                :key="'空间参照系' + key + subKey"
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
      <mapgis-ui-tab-pane key="entity" tab="实体">
        <mapgis-ui-tabs type="card" size="small">
          <mapgis-ui-tab-pane key="general" tab="基本信息">
            <div class="info-body">
              <div
                v-for="key in entityGenegralInfo"
                :key="'实体' + key"
                class="info-item"
              >
                <span class="info-item-title" :title="key"
                  >{{ `${key}：` }}
                </span>
                <span>{{ entityInfo[key] }}</span>
              </div>
            </div>
          </mapgis-ui-tab-pane>
          <mapgis-ui-tab-pane
            v-for="key in entityOtherInfo"
            :key="'实体' + key"
            :tab="key"
          >
            <div class="info-body">
              <div
                v-for="(subValue, subKey) in entityInfo[key]"
                :key="'实体' + key + subKey"
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
      <mapgis-ui-tab-pane key="attribute" tab="属性">
        <div class="info-body">
          <div
            class="info-item"
            v-for="(arrtibutes, key) in metadata['属性']"
            :key="'属性' + key"
          >
            <div class="attributes" v-if="key.indexOf('属性描述') > -1">
              <div class="info-item-title attributes-title" :title="key">
                {{ key }}
              </div>
              <mapgis-ui-table
                bordered
                size="small"
                :pagination="false"
                :data-source="getDataSource(arrtibutes)"
                :columns="getTableColumns(arrtibutes[0])"
                class="table"
                :scroll="{
                  x: '100%',
                }"
                :rowKey="
                  (record, index) => {
                    return index
                  }
                "
              >
              </mapgis-ui-table>
            </div>
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
  name: 'MpMetadataInfoVector',
  mixins: [MetadataInfoMixin],
  data() {
    return {
      srsKeys: ['地理坐标系', '投影坐标系', '高程信息'],

      entityKeys: ['实体类型', '简单要素类', '注记类'],
    }
  },
  computed: {
    generalInfo() {
      return Object.keys(this.metadata).filter((item) => {
        return !['空间范围', '空间参照系', '实体', '属性'].includes(item)
      })
    },
    srsInfo() {
      return this.metadata['空间参照系'] || {}
    },
    srsGenegralInfo() {
      return Object.keys(this.srsInfo).filter((item) => {
        return !this.srsKeys.includes(item)
      })
    },

    srsOtherInfo() {
      return Object.keys(this.srsInfo).filter((item) => {
        return this.srsKeys.includes(item)
      })
    },

    entityInfo() {
      return this.metadata['实体'] || {}
    },

    entityGenegralInfo() {
      return Object.keys(this.entityInfo).filter((item) => {
        return !this.entityKeys.includes(item)
      })
    },

    entityOtherInfo() {
      return Object.keys(this.entityInfo).filter((item) => {
        return this.entityKeys.includes(item)
      })
    },
  },
}
</script>

<style lang="less">
.metadata-info-container {
  .attributes {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    .attributes-title {
      padding-bottom: 8px;
      width: unset !important;
    }
  }
}
</style>
