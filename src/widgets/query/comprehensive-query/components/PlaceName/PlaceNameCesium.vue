<template>
  <div>
    <mapgis-3d-dynamic-marker-layer
      v-if="!cluster"
      :data="geojson"
      :selects="hoverMarker"
      :highlight="false"
      :layerStyle="layerStyle"
      :highlightStyle="highlightStyle"
      :popupShowType="popupShowType"
      @show-popup="showPopup"
      idField="markerId"
    />
    <!-- 聚合标注专题图 -->
    <mapgis-3d-mapv-layer
      v-else-if="
        geojson &&
        geojson.features &&
        geojson.features.length > 0 &&
        colorCluster
      "
      :geojson="geojson"
      :options="options"
      count-field="count"
    />
  </div>
</template>

<script lang="ts">
import { Mixins, Component, Prop, Watch } from 'vue-property-decorator'
import { Style } from '@mapgis/webclient-es6-service'
import {
  MapMixin,
  PopupOverlay,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

const { MarkerStyle, LineStyle, PointStyle, FillStyle } = Style

@Component({ components: {} })
export default class PlaceNameCesium extends Mixins(MapMixin) {
  @Prop({
    type: String,
    default: '',
  })
  selectedMarkerIcon!: string

  @Prop({
    type: String,
    default: '',
  })
  defaultMarkerIcon!: string

  @Prop({
    type: Boolean,
    default: false,
  })
  cluster!: boolean

  @Prop({
    type: String,
    default: '',
  })
  colorCluster?: string

  @Prop({
    type: Object,
    default: () => ({}),
  })
  geojson!: Record<string, unknown>

  @Prop({
    type: Array,
    default: () => [],
  })
  hoverMarker?: Array<string>

  get popupShowType() {
    return baseConfigInstance.config.popupShowType
  }

  get layerStyle() {
    return new MarkerStyle({
      symbol: this.defaultMarkerIcon,
    })
  }

  get highlightStyle() {
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
  }

  get options() {
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
  }

  private showPopup(data) {
    this.popupOverlayInstance.setContent(data)
  }

  created() {
    this.popupOverlayInstance = PopupOverlay.getInstance()
  }

  private changeColor(highlightStyle) {
    // 手动修改高亮样式与系统设置一致
    const { color: regColor } =
      baseConfigInstance.config.colorConfig.feature.reg
    const { color: lineColor } =
      baseConfigInstance.config.colorConfig.feature.line
    const { size: lineWidth } =
      baseConfigInstance.config.colorConfig.feature.line
    const { color: pntColor } =
      baseConfigInstance.config.colorConfig.feature.pnt
    const { size: pntSize } = baseConfigInstance.config.colorConfig.feature.pnt
    highlightStyle.line.color = lineColor
    highlightStyle.line.width = +lineWidth // 转number
    highlightStyle.point.color = pntColor
    highlightStyle.point.radius = +pntSize // 转number
    highlightStyle.polygon.color = regColor
    highlightStyle.polygon.outlineColor = lineColor
    highlightStyle.polygon.outlineWidth = +lineWidth
  }
}
</script>

<style scoped></style>
