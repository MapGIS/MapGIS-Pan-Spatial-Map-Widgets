<template>
  <div>
    <mapgis-dynamic-marker-layer
      v-if="!cluster"
      :data="geojson"
      :selects="hoverMarker"
      :highlight="false"
      :layerStyle="layerStyle"
      :highlightStyle="highlightStyle"
      idField="markerId"
    />
    <!-- 聚合标注专题图 -->
    <!-- <mapgis-mapv-layer
      v-else-if="
        geojson &&
        geojson.features &&
        geojson.features.length > 0 &&
        colorCluster
      "
      :geojson="geojson"
      :options="options"
      count-field="count"
    /> -->
    <mapgis-cluster-layer
      v-else-if="
        geojson && geojson.features && !!geojson.features.length && colorCluster
      "
      :geojson="geojson"
      :cluster="clusterOption"
      :uncluster="uncluster"
      @change-feature="changeFeature"
    >
      <slot name="default" :coordinates="coordinates" :properties="properties">
        <mapgis-ui-list
          item-layout="horizontal"
          :data-source="Object.keys(properties)"
          size="small"
          class="table-marker"
        >
          <mapgis-ui-list-item
            slot="renderItem"
            slot-scope="item"
            class="table-marker-item"
          >
            <div style="width: 130px" :title="item">
              {{ item }}
            </div>
            <div style="width: 170px" :title="properties[item]">
              {{ properties[item] }}
            </div>
          </mapgis-ui-list-item>
        </mapgis-ui-list>
      </slot>
    </mapgis-cluster-layer>
  </div>
</template>

<script lang="ts">
import { Style } from '@mapgis/webclient-es6-service'
import { MapMixin, baseConfigInstance } from '@mapgis/web-app-framework'
import { Util } from '@mapgis/webclient-vue-ui'

const { ColorUtil } = Util

const { MarkerStyle, LineStyle, PointStyle, FillStyle } = Style

export default {
  name: 'PlaceNameMapbox',
  mixins: [MapMixin],
  props: {
    selectedMarkerIcon: {
      type: String,
      default: '',
    },
    defaultMarkerIcon: {
      type: String,
      default: '',
    },
    cluster: {
      type: Boolean,
      default: false,
    },
    colorCluster: {
      type: String,
      default: '',
    },
    geojson: {
      type: Object,
      default: () => ({}),
    },
    hoverMarker: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      coordinates: [0, 0],
      properties: {
        属性名: '属性值',
      },
    }
  },
  computed: {
    defaultColor() {
      debugger
      const color = ColorUtil.getColorObject('#ffffff', 0.8)
      return ColorUtil.colorObjectToRgba(color, false)
    },
    colors() {
      const defaultColors = ['#1876d0', 'rgb(255,255,0)', '#bdbd0d']
      const colors = []
      for (let i = 0; i < defaultColors.length; i++) {
        const color = ColorUtil.getColorObject(defaultColors[i], 0.8)
        colors.push(ColorUtil.colorObjectToRgba(color, false))
      }
      return colors
    },
    clusterOption() {
      const { colors } = this
      return {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          colors[0],
          10,
          colors[1],
          100,
          colors[2],
        ],
        'circle-radius': ['step', ['get', 'point_count'], 10, 0, 20, 100, 30],
        'circle-stroke-color': this.defaultColor,
        'circle-stroke-width': 2,
      }
    },
    uncluster() {
      const colorCluster = ColorUtil.getColorObject(
        this.colorCluster || '#ffffff',
        0.8
      )
      const unclusterColor = ColorUtil.colorObjectToRgba(colorCluster, false)
      return {
        'circle-color': unclusterColor,
        'circle-radius': 10,
        'circle-stroke-width': 1,
        'circle-stroke-color': this.defaultColor,
      }
    },
    layerStyle() {
      return new MarkerStyle({
        symbol: this.defaultMarkerIcon,
      })
    },

    highlightStyle() {
      const highlightStyle = {
        enableHoverMarker: false,
        enableHoverFeature: false,
        marker: new MarkerStyle({
          symbol: this.selectedMarkerIcon,
        }),
        point: new PointStyle(),
        line: new LineStyle(),
        polygon: new FillStyle(),
      }
      this.changeColor(highlightStyle)
      return highlightStyle
    },

    options() {
      return {
        fillStyle: this.colorCluster,
        size: 50 / 3 / 2, // 非聚合点的半径
        minSize: 8, // 聚合点最小半径
        maxSize: 31, // 聚合点最大半径
        globalAlpha: 0.8, // 透明度
        clusterRadius: 150, // 聚合像素半径
        maxClusterZoom: 18, // 最大聚合的级别
        maxZoom: 19, // 最大显示级别
        minPoints: 5, // 最少聚合点数，点数多于此值才会被聚合
        extent: 400, // 聚合的细腻程度，越高聚合后点越密集
        label: {
          // 聚合文本样式
          show: true, // 是否显示
          fillStyle: 'white',
        },
        gradient: { 0: 'blue', 0.5: 'yellow', 1.0: 'rgb(255,0,0)' }, // 聚合图标渐变色
        cesium: { postRender: true, postRenderFrame: 0 },
        draw: 'cluster',
        context: '2d',
      }
    },
  },
  methods: {
    changeColor(highlightStyle) {
      // 手动修改高亮样式与系统设置一致
      const { color: regColor } =
        baseConfigInstance.config.colorConfig.feature.reg
      const { color: lineColor } =
        baseConfigInstance.config.colorConfig.feature.line
      const { size: lineWidth } =
        baseConfigInstance.config.colorConfig.feature.line
      const { color: pntColor } =
        baseConfigInstance.config.colorConfig.feature.pnt
      const { size: pntSize } =
        baseConfigInstance.config.colorConfig.feature.pnt
      highlightStyle.line.color = lineColor
      highlightStyle.line.width = +lineWidth // 转number
      highlightStyle.point.color = pntColor
      highlightStyle.point.radius = +pntSize // 转number
      highlightStyle.polygon.color = regColor
      highlightStyle.polygon.outlineColor = lineColor
    },
    changeFeature(val) {
      this.coordinates = val.coordinates
      this.properties = val.properties
    },
  },
}
</script>

<style lang="less" scoped>
.table-markers {
  max-height: 200px;
  overflow: auto;
  .table-marker-item {
    padding: 0;
    font-size: 10px;
    div {
      padding: 2px 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
