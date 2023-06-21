<template>
  <div class="zone-container">
    <mapgis-ui-toolbar class="search-head-container" :bordered="false">
      <mapgis-ui-input
        v-model="keyword"
        placeholder="请输入行政区关键字"
        allow-clear
      >
        <mapgis-ui-iconfont slot="prefix" type="mapgis-search" />
      </mapgis-ui-input>
      <mapgis-ui-toolbar-space />
      <mapgis-ui-toolbar-command-group
        :remove-first-command-left-margin="false"
      >
        <mapgis-ui-toolbar-command
          title="设置"
          icon="setting"
          :active="showSettingPanel"
          :hover-bordered="false"
          @click="showSettingPanel = !showSettingPanel"
        />
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-toolbar>
    <mapgis-ui-spin :spinning="spinning">
      <div>
        <div separator=">" class="current-name">
          <div
            v-for="(item, index) in zoneBreadcrumbItems"
            :key="index"
            @click="onZoneBreadcrumbClick(index)"
            class="breadcrumb"
          >
            <span v-if="index !== 0" class="separator">{{ '>' }}</span>
            <span class="text">{{ item.name }}</span>
          </div>
        </div>
        <div class="select-name">
          <li
            v-for="zone in nextLevelZoneList"
            :key="zone.id"
            @click="onZoneClick(zone)"
            :class="{ active: includeZone(zone.name, keyword) }"
          >
            {{ zone.name }}
          </li>
        </div>
      </div>
    </mapgis-ui-spin>
    <div v-show="showSettingPanel" class="setting-panel">
      <mapgis-ui-group-tab title="设置"></mapgis-ui-group-tab>
      <mapgis-ui-setting-form layout="vertical">
        <mapgis-ui-form-item label="填充颜色">
          <mapgis-ui-color-picker
            v-model="fillColor"
            :disable-alpha="false"
          ></mapgis-ui-color-picker>
        </mapgis-ui-form-item>
        <mapgis-ui-form-item label="轮廓线颜色">
          <mapgis-ui-color-picker
            v-model="lineColor"
            :disable-alpha="false"
          ></mapgis-ui-color-picker>
        </mapgis-ui-form-item>
        <mapgis-ui-form-item label="轮廓线宽度">
          <mapgis-ui-input type="number" v-model="lineWidth" />
        </mapgis-ui-form-item>
      </mapgis-ui-setting-form>
    </div>
    <template v-if="active">
      <zone-frame-mapbox
        v-if="is2DMapMode"
        :feature="currentLevelFeature"
        :fit-bound="currentLevelFitBound"
        :highlight-style="highlightStyle"
      ></zone-frame-mapbox>
      <zone-frame-cesium
        v-else
        :feature="currentLevelFeature"
        :fit-bound="currentLevelFitBound"
        :highlight-style="highlightStyle"
      ></zone-frame-cesium>
    </template>
  </div>
</template>

<script lang="ts">
import {
  AppMixin,
  MapMixin,
  Feature,
  api,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import { bboxPolygon, lineString, bbox } from '@turf/turf'
import ZoneFrameMapbox from './ZoneFrameMapbox.vue'
import ZoneFrameCesium from './ZoneFrameCesium.vue'

export default {
  name: 'Zone',
  mixins: [AppMixin, MapMixin],
  components: {
    ZoneFrameMapbox,
    ZoneFrameCesium,
  },
  props: {
    active: Boolean,
    district: Object,
  },
  data() {
    return {
      // 首级配置
      defaults: {},

      // 其他级配置集合
      gdbpInfos: [],

      // 查询关键字
      keyword: '',

      // 行政区按级别排列的集合，可形成面包屑
      zoneBreadcrumbItems: [],

      // 下一级的行政区要素集合，可以通过它获取到下一级的行政区列表
      nextLevelFeatures: {},

      // 当前级的行政区要素
      currentLevelFeature: {},

      // 当前级的行政区要素缩放范围
      currentLevelFitBound: {},

      // 加载中
      spinning: false,

      // 编辑面板的显隐
      showSettingPanel: false,

      // 填充色
      fillColor: baseConfigInstance.config.colorConfig.feature.reg.color,

      // 边线颜色
      lineColor: baseConfigInstance.config.colorConfig.feature.line.color,

      // 边线宽度
      lineWidth: baseConfigInstance.config.colorConfig.feature.line.size,

      // 所选行政区的范围
      geoJSON: {},

      // 行政区要素数据，存储zone所有要素数据，避免重复查询
      zoneFeatures: {},
    }
  },
  methods: {
    change(val) {
      this.$emit('change', val)
    },
    onZoneBreadcrumbClick(index) {
      this.zoneBreadcrumbItems = this.zoneBreadcrumbItems.slice(0, index + 1)
    },

    onZoneClick(item: { code: string; name: string; feature; fitBound }) {
      if (item.code !== this.currentZoneBreadcrumbItem.code) {
        this.zoneBreadcrumbItems.push(item)
      }
    },

    async getNextLevelZoneFeatures() {
      try {
        this.spinning = true
        const gdbpInfo = this.gdbpInfos[this.zoneBreadcrumbItems.length - 1]
        if (this.currentZoneBreadcrumbItem) {
          const { ip, port, queryWay, docName } = this.defaults
          const { code, level } = this.currentZoneBreadcrumbItem
          if (this.zoneFeatures[code]) {
            // 如果查询数据已存在，那直接使用已有数据
            this.nextLevelFeatures = this.zoneFeatures[code]
          } else {
            const params: Feature.FeatureQueryParam = {
              ip,
              port,
              f: 'geojson',
              pageCount: 3000,
              coordPrecision: 8,
            }
            if (gdbpInfo) {
              const { gdbp, layerName, nameField, codeField } = gdbpInfo
              const filterCode = this.filterCode(level, code)
              const where = code ? `${codeField} LIKE '${filterCode}%'` : ''
              params.where = where
              if (queryWay === 'doc') {
                params.docName = docName
                params.layerName = layerName
                params.layerIdxs = ''
              } else if (queryWay === 'gdbp') {
                params.gdbp = gdbp
              }
              const info = await Feature.FeatureQuery.query(params, false)
              this.nextLevelFeatures = {
                type: 'FeatureCollection',
                features: info.features,
              }
              this.zoneFeatures[code] = this.nextLevelFeatures
            } else if (
              // 当选中最后一级别的时候
              this.gdbpInfos.length > 0 &&
              this.zoneBreadcrumbItems.length > this.gdbpInfos.length
            ) {
              const { gdbp, layerName, nameField, codeField } =
                this.gdbpInfos[this.gdbpInfos.length - 1]
              const where = `${codeField} = '${code}'`
              params.where = where
              if (queryWay === 'doc') {
                params.docName = docName
                params.layerName = layerName
                params.layerIdxs = ''
              } else if (queryWay === 'gdbp') {
                params.gdbp = gdbp
              }
              const info = await Feature.FeatureQuery.query(params, false)
              this.nextLevelFeatures = {
                type: 'FeatureCollection',
                features: info.features,
              }
              this.zoneFeatures[code] = this.nextLevelFeatures
            } else {
              throw Error('gdbpInfos配置不正确')
            }
          }
        } else {
          throw Error('暂无数据')
        }
      } catch (error) {
      } finally {
        this.spinning = false
      }
    },

    init() {
      const { defaults, gdbpInfos } = this.district
      this.defaults = defaults
      this.gdbpInfos = gdbpInfos
      this.zoneBreadcrumbItems = [
        {
          name: this.defaults.text,
          level: this.defaults.level,
          code: this.defaults.code,
          feature: {},
          fitBound: {},
        },
      ]
    },

    filterCode(level, code) {
      const codeStr = code.toString()
      switch (level) {
        case '1':
          return ''
        case '2':
          return codeStr.substring(0, 2)
        case '3':
          return codeStr.substring(0, 4)
        case '4':
          return codeStr.substring(0, 6)
        case '5':
          return codeStr.substring(0, 9)
        case '6':
          return codeStr.substring(0, 12)
        default:
          return ''
      }
    },

    includeZone(name: string, keyword: string) {
      return keyword && name && name.includes(keyword)
    },

    getFeatureFitBound(feature) {
      if (feature && JSON.stringify(feature) !== '{}') {
        const box = bbox(feature)
        const polygon = bboxPolygon(box)

        if (polygon.geometry) {
          const bound = {
            xmin: polygon.geometry.coordinates[0][0][0],
            ymin: polygon.geometry.coordinates[0][0][1],
            xmax: polygon.geometry.coordinates[0][2][0],
            ymax: polygon.geometry.coordinates[0][2][1],
          }

          // 把bound缩小到1/2
          const width = bound.xmax - bound.xmin
          const height = bound.ymax - bound.ymin
          const center = {
            x: (bound.xmin + bound.xmax) / 2,
            y: (bound.ymin + bound.ymax) / 2,
          }
          return {
            xmin: center.x - width,
            ymin: center.y - height,
            xmax: center.x + width,
            ymax: center.y + height,
          }
        }
      }

      return {}
    },

    clear() {
      this.currentLevelFeature = {}
      this.geoJSON = {}
      this.currentLevelFitBound = {}
      this.change(this.geoJSON)
      this.init()
    },
  },

  computed: {
    highlightStyle() {
      return {
        label: {
          text: {
            color: this.lineColor,
            fontSize: '14',
          },
        },
        feature: {
          reg: {
            color: this.fillColor,
          },
          line: {
            color: this.lineColor,
            size: this.lineWidth,
          },
        },
      }
    },
    // 当前的行政区项
    currentZoneBreadcrumbItem() {
      if (this.zoneBreadcrumbItems.length > 0) {
        return this.zoneBreadcrumbItems[this.zoneBreadcrumbItems.length - 1]
      }
      return null
    },

    // 下级行政区划列表
    nextLevelZoneList() {
      const gdbpInfo = this.gdbpInfos[this.zoneBreadcrumbItems.length - 1]
      if (
        this.nextLevelFeatures &&
        Object.keys(this.nextLevelFeatures).length > 0 &&
        gdbpInfo
      ) {
        return this.nextLevelFeatures.features.map((x) => {
          const { nameField, codeField, level } = gdbpInfo
          return {
            name: x.properties[nameField],
            level: level,
            code: x.properties[codeField],
            feature: x,
            fitBound: this.getFeatureFitBound(x),
          }
        })
      }
      return []
    },
  },
  watch: {
    // 当当前行政区项改变时，需要修改当前行政区的要素和缩放范围，同时，获取下一级所有行政区信息
    currentZoneBreadcrumbItem: {
      deep: true,
      handler() {
        const { feature, fitBound } = this.currentZoneBreadcrumbItem

        this.currentLevelFeature = feature
        this.currentLevelFitBound = fitBound

        if (feature && JSON.stringify(feature) !== '{}') {
          const box = bbox(feature)
          this.geoJSON = bboxPolygon(box)
        } else {
          this.geoJSON = {}
        }
        this.change(this.geoJSON)
        this.getNextLevelZoneFeatures()
      },
    },
    active(val) {
      if (!val) {
        this.clear()
      }
    },
  },

  mounted() {
    this.init()
  },
}
</script>

<style lang="scss" scoped>
.zone-container {
  .current-name {
    .breadcrumb {
      .text {
        color: $primary-color;
        cursor: pointer;
      }
      &:last-child {
        .text {
          color: $primary-color;
          font-weight: bold;
        }
      }
    }
  }
  .select-name {
    color: $text-color;
    li {
      &:hover {
        color: $primary-color;
      }
    }
  }
  .active {
    color: $primary-color !important;
  }
}
::v-deep .m-colorPicker .box {
  position: fixed; //解决颜色选择器打开后面板显示不全的bug
}
</style>

<style lang="scss">
.zone-container {
  display: flex;
  flex-direction: column;
  padding-top: 10px;
  .search-head-container {
    margin-bottom: 10px;
  }
  .current-name {
    display: flex;
    flex-wrap: wrap;
    padding-bottom: 8px;
    .breadcrumb {
      display: flex;
      align-items: center;
      .separator {
        padding: 0 4px;
      }
    }
  }
  .select-name {
    font-size: 13px;
    padding-top: 4px;
    display: flex;
    flex-wrap: wrap;
    overflow-y: auto;
    line-height: 20px;
    li {
      display: inline-block;
      margin-right: 9px;
      cursor: pointer;
    }
  }
  .setting-panel {
    display: flex;
    flex-direction: column;
  }
}
</style>
