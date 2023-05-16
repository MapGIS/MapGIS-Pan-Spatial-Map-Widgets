<template>
  <div class="frame-container">
    <mapgis-ui-setting-form layout="vertical">
      <mapgis-ui-form-item label="比例尺">
        <mapgis-ui-select :options="scaleArray" v-model="scale" />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="图幅号">
        <mapgis-ui-input-search
          placeholder="请输入关键字"
          allowClear
          v-model="keyword"
          enter-button
          @search="onSearch"
        />
      </mapgis-ui-form-item>
    </mapgis-ui-setting-form>
    <mapgis-ui-space direction="vertical" style="flex: 1">
      <mapgis-ui-spin :spinning="loading">
        <mapgis-ui-list
          :data-source="list"
          size="small"
          :pagination="pagination"
        >
          <div slot="header">选择图幅</div>
          <mapgis-ui-list-item
            slot="renderItem"
            slot-scope="item"
            @click="select(item)"
            :class="{ 'select-item': selectItem === item }"
          >
            <template v-if="item.indexOf(keyword) > -1">
              <span>{{ item.substr(0, item.indexOf(keyword)) }}</span>
              <span class="filter-words">{{
                item.substr(item.indexOf(keyword), keyword.length)
              }}</span>
              <span>{{
                item.substr(item.indexOf(keyword) + keyword.length)
              }}</span>
            </template>
            <span v-else>
              {{ item }}
            </span>
          </mapgis-ui-list-item>
        </mapgis-ui-list>
      </mapgis-ui-spin>
    </mapgis-ui-space>
    <template v-if="active">
      <zone-frame-mapbox
        v-if="is2DMapMode"
        :feature="frameFeature"
        :center="center"
        :highlight-style="highlightStyle"
      ></zone-frame-mapbox>
      <zone-frame-cesium
        v-else
        :feature="frameFeature"
        :center="center"
        :highlight-style="highlightStyle"
      ></zone-frame-cesium>
    </template>
  </div>
</template>

<script lang="ts">
import {
  AppMixin,
  Feature,
  baseConfigInstance,
  api,
} from '@mapgis/web-app-framework'
import axios from 'axios'
import ZoneFrameMapbox from './ZoneFrameMapbox.vue'
import ZoneFrameCesium from './ZoneFrameCesium.vue'

export default {
  name: 'Frame',
  mixins: [AppMixin],
  components: {
    ZoneFrameMapbox,
    ZoneFrameCesium,
  },
  props: {
    active: Boolean,
  },
  data() {
    return {
      scale: 'Scale_20w',

      scaleArray: [
        { label: '1:5千', value: 'Scale_5000' },
        { label: '1:1万', value: 'Scale_1w' },
        { label: '1:2万5', value: 'Scale_2w5' },
        { label: '1:5万', value: 'Scale_5w' },
        { label: '1:10万', value: 'Scale_10w' },
        { label: '1:20万', value: 'Scale_20w' },
        { label: '1:25万', value: 'Scale_25w' },
        { label: '1:50万', value: 'Scale_50w' },
        { label: '1:100万', value: 'Scale_100w' },
      ],

      total: 0,

      list: [],

      pageNumber: 1,

      pageSize: 20,

      loading: false,

      keyword: '',

      selectItem: '',

      frameFeature: {},

      center: [],

      frameConfig: {
        ip: '',
        port: '',
        name: '',
        gdbp: '',
      },
    }
  },
  methods: {
    change(val) {
      this.$emit('change', val)
    },
    async onSearch() {
      this.loading = true
      try {
        const { scale, pageNumber, pageSize, keyword } = this
        // 通过sheetConfig内的ip、port、name去获取地图范围，构造成[xMin, yMin, xMax, yMax]，用于查询图幅号
        const protocol = window.location.protocol
        const domain = `${protocol}//${this.frameConfig.ip}:${this.frameConfig.port}`
        const {
          data: { xMin, yMin, xMax, yMax },
        } = await axios.get(
          `${domain}/igs/rest/mrms/info/${this.frameConfig.name}`
        )

        const { content, totalElements } = await api.getFrameNoList(
          this.frameConfig.ip,
          this.frameConfig.port,
          this.frameConfig.gdbp,
          xMin,
          yMin,
          xMax,
          yMax,
          scale,
          pageNumber - 1,
          pageSize,
          keyword,
          baseConfigInstance.config.projectionName,
          baseConfigInstance.config.projectionName
        )
        this.list = content || []
        this.total = totalElements || 0
      } catch (error) {
        this.list = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    async select(item: string) {
      this.selectItem = item
      const {
        data: { XMin, YMin, XMax, YMax },
      } = await api.getFrameExtentByNo(
        this.frameConfig.ip,
        this.frameConfig.port,
        item,
        baseConfigInstance.config.projectionName,
        baseConfigInstance.config.projectionName
      )

      this.clear()
      this.frameFeature = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: item },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [XMin, YMin],
                  [XMax, YMin],
                  [XMax, YMax],
                  [XMin, YMax],
                  [XMin, YMin],
                ],
              ],
            },
          },
        ],
      }
      this.center = [(XMin + XMax) / 2, (YMin + YMax) / 2]

      this.change(this.frameFeature)
    },

    clear() {
      this.frameFeature = {}
      this.center = []
      this.change(this.frameFeature)
    },
  },
  computed: {
    pagination() {
      if (this.total) {
        return {
          size: 'small',
          total: this.total,
          pageSize: this.pageSize,
          showSizeChanger: true,
          current: this.pageNumber,
          onChange: (page) => {
            this.pageNumber = page
            this.onSearch()
          },
          onShowSizeChange: (current, size) => {
            this.pageSize = size
            this.onSearch()
          },
        }
      }

      return false
    },
    highlightStyle() {
      return baseConfigInstance.config.colorConfig
    },
  },
  watch: {
    scale: {
      immediate: true,
      handler() {
        this.list = []
        this.total = 0
        this.pageNumber = 1
        this.pageSize = 20
        this.onSearch()
      },
    },
    active(val) {
      if (!val) {
        this.selectItem = ''
        this.clear()
      }
    },
  },

  async mounted() {
    this.frameConfig = await api.getConfig('sheet')
  },
}
</script>

<style lang="scss" scoped>
.frame-container {
  .mapgis-ui-space {
    .select-item {
      background-color: fade($primary-color, 20%);
    }
    .mapgis-ui-list-item {
      &:hover {
        background-color: $hover-bg-color;
      }
      .filter-words {
        color: $primary-color;
      }
    }
  }
}
</style>

<style lang="scss">
.frame-container {
  display: flex;
  padding: 10px 3px 0 3px;
  flex-direction: column;
  .mapgis-ui-space {
    .mapgis-ui-space-item {
      .mapgis-ui-list {
        font-size: 12px;
        .mapgis-ui-list-header {
          padding: 0 0 8px 0;
        }
        .mapgis-ui-spin-container {
          max-height: 200px;
          overflow-y: auto;
          .mapgis-ui-list-item {
            justify-content: flex-start;
            padding: 5px 0 5px 5px;
          }
        }
        .mapgis-ui-empty-normal {
          margin: 8px 0;
        }
        .mapgis-ui-pagination {
          font-size: 12px;
          .mapgis-ui-list-pagination {
            margin-top: 8px;
          }
        }
      }
    }
  }
}
</style>
