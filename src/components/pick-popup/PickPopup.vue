<template>
  <div
    class="mp-picker-popupInfo-manager"
    v-if="popupInfo && popupInfo.coordinates"
  >
    <mapgis-popup
      v-if="is2DMapMode && hasMapDisplay"
      :coordinates="popupInfo.coordinates"
      :showed="showPopup"
      @removed="clearHighlight"
    >
      <mapgis-ui-list
        item-layout="horizontal"
        :data-source="Object.keys(popupInfo.properties)"
        size="small"
        class="table-popupInfo"
      >
        <mapgis-ui-list-item
          slot="renderItem"
          slot-scope="item"
          class="table-popupInfo-item"
        >
          <div style="width: 130px" :title="item">
            {{ item }}
          </div>
          <div style="width: 170px" :title="popupInfo.properties[item]">
            {{ popupInfo.properties[item] }}
          </div>
        </mapgis-ui-list-item>
      </mapgis-ui-list>
    </mapgis-popup>
    <mapgis-3d-feature-popup
      v-if="!is2DMapMode && hasGlobeDisplay"
      :position="popup3DPosition"
      :properties="popupInfo.properties"
      :visible="showPopup"
      :popupOptions="{ popupType: 'card' }"
      @change="changeVisible"
    >
      <div slot="default" style="padding: 10px">
        <mapgis-3d-popup-iot :properties="popupInfo.properties" />
      </div>
    </mapgis-3d-feature-popup>
  </div>
</template>

<script lang="ts">
import {
  AppMixin,
  MapMixin,
  DisplayModeMixin,
  baseConfigInstance,
  Overlay,
  PopupOverlay,
} from '@mapgis/web-app-framework'
export default {
  name: 'MpPickPopup',
  mixins: [AppMixin, MapMixin, DisplayModeMixin],
  props: {
    popupInfo: {
      type: Object,
      default: () => {},
    },
  },

  data() {
    return {
      prePopupId: undefined,
      entityNames: [],
      showPopup: true,
    }
  },

  computed: {
    // 要素高亮样式
    highlightStyle() {
      return baseConfigInstance.config.colorConfig
    },
    popupShowType() {
      return baseConfigInstance.config.popupShowType
    },
    popup3DPosition() {
      if (!this.popupInfo) {
        return {}
      }
      const { coordinates } = this.popupInfo
      const position = {
        longitude: Number(coordinates[0]),
        latitude: Number(coordinates[1]),
        height: Number(coordinates[2]) || 0,
      }
      return position
    },
  },

  watch: {
    popupInfo: {
      deep: true,
      immediate: true,
      handler(newValue) {
        if (this.popupInfo && this.popupInfo.id) {
          if (this.popupShowType === 'default') {
            this.showPopup = true
            this.popupOverlayInstance.setContent(null)
          } else {
            this.showPopup = false
            this.popupOverlayInstance.setContent(this.popupInfo.properties)
          }
          this.prePopupId = this.popupInfo.id
          if (this.is2DMapMode) {
            this.mapOverlays.highlightFeature(
              { id: this.prePopupId, feature: this.popupInfo.feature },
              this.highlightStyle
            )
          } else {
            this.highlightFeatureOnCesium({
              id: this.prePopupId,
              feature: this.popupInfo.feature,
            })
          }
        } else {
          this.clearHighlight()
        }
      },
    },
    is2DMapMode: {
      deep: true,
      immediate: true,
      handler(newValue) {
        this.clearHighlight()
      },
    },
  },

  beforeDestroy() {
    this.clearHighlight()
  },

  mounted() {
    this.sceneOverlays = Overlay.SceneOverlays.getInstance(
      this.Cesium,
      this.vueCesium,
      this.viewer
    )
    this.init()
  },

  methods: {
    changeVisible(v) {
      if (!v) {
        this.clearHighlight()
      }
    },
    init() {
      if (!this.mapOverlays) {
        this.mapOverlays = Overlay.MapOverlays.getInstance(
          this.mapbox,
          this.map
        )
      }
      if (!this.popupOverlayInstance) {
        this.popupOverlayInstance = PopupOverlay.getInstance()
      }
    },
    clearHighlight() {
      this.init()
      if (this.is2DMapMode) {
        this.mapOverlays.clearHighlightFeature(this.prePopupId)
      } else {
        this.clearHighlightOnCesium()
      }
      this.popupOverlayInstance.setContent(null)
    },
    highlightFeatureOnCesium({ feature, id }) {
      const featureGeoJSON = {
        features: [feature],
        type: 'FeatureCollection',
      }
      // 需要根据要素类型来使用不同的type
      if (featureGeoJSON.features[0].geometry.type === 'Point') {
        // 点要素的高亮符号怎么处理?
      } else if (featureGeoJSON.features[0].geometry.type === 'LineString') {
        const lineColor = new this.Cesium.Color.fromCssColorString(
          this.highlightStyle.feature.line.color
        )
        for (let i = 0; i < featureGeoJSON.features.length; i += 1) {
          const coords = featureGeoJSON.features[i].geometry.coordinates
          const name = `result-entity-${id}`
          this.entityNames.push(name)
          this.sceneOverlays.addLine(
            name,
            coords.join(',').split(',').map(Number),
            this.highlightStyle.feature.line.size,
            lineColor,
            // 是否识别带高度的坐标
            coords[0].length > 2,
            // 是否贴地形
            true,
            // 附加属性
            {}
          )
        }
      } else if (
        featureGeoJSON.features[0].geometry.type === 'Polygon' ||
        featureGeoJSON.features[0].geometry.type === 'MultiPolygon'
      ) {
        const fillColor = new this.Cesium.Color.fromCssColorString(
          this.highlightStyle.feature.reg.color
        )
        const fillOutlineColor = new this.Cesium.Color.fromCssColorString(
          this.highlightStyle.feature.line.color
        )
        for (let i = 0; i < featureGeoJSON.features.length; i += 1) {
          const coords = featureGeoJSON.features[i].geometry.coordinates[0]
          const name = `result-entity-${id}`
          this.entityNames.push(name)
          this.sceneOverlays.addPolygon(
            name,
            coords.join(',').split(',').map(Number),
            fillColor,
            fillOutlineColor,
            // 是否识别带高度的坐标
            coords[0].length > 2,
            {
              drawOutLine: true,
              outlineWidth: this.highlightStyle.feature.line.size,
            }
          )
        }
      }
    },
    clearHighlightOnCesium() {
      for (let i = this.entityNames.length - 1; i >= 0; i -= 1) {
        const id = this.entityNames[i].split('result-entity-')[1]
        this.sceneOverlays.removeEntityByName(this.entityNames[i])
        this.entityNames.splice(i, 1)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.table-popupInfo {
  max-height: 200px;
  overflow: auto;
  margin-top: 10px;
  .table-popupInfo-item {
    padding: 0;
    font-size: 12px;
    div {
      padding: 2px 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.cesium-popup {
  .cesium-popup-content-wrapper {
    .table-marker {
      max-height: 130px;
      overflow: auto;
      margin-top: 10px;
      border-radius: 0;
      border-color: $border-color;
      .table-marker-item {
        display: flex;
        padding: 0;
        &:nth-child(2n) {
          background-color: $hover-bg-color;
        }
        div {
          padding: 2px 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 3px 6px;
          &:first-child {
            width: 120px;
            border-right: 1px solid $border-color;
          }
          &:last-child {
            flex: 1 0 0%;
          }
        }
      }
    }
    .iot-enclosure-title {
      font-size: 15px;
      color: $title-color;
      font-weight: bold;
      margin-top: 10px;
    }
    .iot-enclosure-container {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      li {
        margin: 0;
        padding: 0;
        margin-right: 15px;
      }
    }
  }
}
</style>
