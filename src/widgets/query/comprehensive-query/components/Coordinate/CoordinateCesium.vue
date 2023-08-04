<template>
  <div></div>
</template>

<script lang="ts">
import {
  MapMixin,
  AppMixin,
  ColorUtil,
  Feature,
  Overlay,
  markerIconInstance,
} from '@mapgis/web-app-framework'

export default {
  name: 'CoordinateCesium',
  mixins: [MapMixin, AppMixin],
  props: {
    pickable: {
      type: Boolean,
      default: false,
    },
    coordinate: {
      type: Array,
      default: () => [],
    },
    center: {
      type: Array,
      default: () => [],
    },
    frameFeature: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    highlightStyle: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      entityNames: [],

      entityTextNames: [],

      timer: null,
    }
  },
  methods: {
    emitPickedCoordinate(pickedCoordinate, is2D) {
      this.$emit('picked-coordinate', pickedCoordinate, is2D)
    },
    clearTimer() {
      if (this.timer !== null) {
        window.clearTimeout(this.timer)
        this.timer = null
      }
    },
    // 清除
    clearFrame() {
      for (let i = this.entityNames.length - 1; i >= 0; i -= 1) {
        this.sceneOverlays.removeEntityByName(this.entityNames[i])
        this.entityNames.pop()
      }
      for (let i = this.entityTextNames.length - 1; i >= 0; i -= 1) {
        this.viewer.entities.remove(this.entityTextNames[i])
        this.entityTextNames.pop()
      }
    },

    clearMarker() {
      this.sceneOverlays.removeEntityByName('coordinate-marker')
    },
    pickableChange() {
      // 定义当前场景的画布元素的事件处理
      const handler = new this.Cesium.ScreenSpaceEventHandler(
        this.viewer.scene._canvas
      )
      // 设置鼠标移动事件的处理函数，这里负责监听x,y坐标值变化
      handler.setInputAction((movement) => {
        if (!this.pickable) return
        // 通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
        const { ellipsoid } = this.viewer.scene.globe
        const cartesian = this.viewer.camera.pickEllipsoid(
          movement.position,
          ellipsoid
        )
        if (cartesian) {
          // 将笛卡尔坐标转换为地理坐标
          const cartographic = ellipsoid.cartesianToCartographic(cartesian)
          // 将弧度转为度的十进制度表示
          const lng = this.Cesium.Math.toDegrees(cartographic.longitude) // 转换后的经度
          const lat = this.Cesium.Math.toDegrees(cartographic.latitude) // 转换后的纬度
          this.emitPickedCoordinate([lng, lat], false)
        }
      }, this.Cesium.ScreenSpaceEventType.LEFT_CLICK)
    },
    centerChange() {
      if (this.center && this.center.length > 0) {
        this.viewer.camera.flyTo({
          destination: this.Cesium.Cartesian3.fromDegrees(
            this.center[0],
            this.center[1],
            this.viewer.camera.positionCartographic.height
          ),
        })
      }
    },
    frameFeatureChange(val) {
      this.clearFrame()
      if (val && Object.keys(val).length > 0) {
        // 行政区划几何类型一般是Polygon
        this.entityNames = []
        const fillColor = new this.Cesium.Color.fromCssColorString(
          this.highlightStyle.feature.reg.color
        )

        const fillOutlineColor = new this.Cesium.Color.fromCssColorString(
          this.highlightStyle.feature.line.color
        )

        const width = parseInt(this.highlightStyle.feature.line.size)

        for (let i = 0; i < val.geometry.coordinates.length; i += 1) {
          const coords = val.geometry.coordinates[i]
          const name = `zone-frame-${i}`
          this.entityNames.push(name)
          this.sceneOverlays.addPolygon(
            name,
            coords.join(',').split(',').map(Number),
            fillColor,
            fillOutlineColor,
            false,
            { drawOutLine: true, outlineWidth: width }
          )
          const center = Feature.getGeoJSONFeatureCenter(val)
          const rgba = ColorUtil.getColorObject('#FD6A6F', 1)
          const textColor = new this.Cesium.Color(
            rgba.r / 255,
            rgba.g / 255,
            rgba.b / 255,
            rgba.a
          )
          const text = this.sceneOverlays.addLabel(
            // 经度、纬度、高程
            center[0],
            center[1],
            0,
            // 文本内容
            val.properties.name,
            {
              // 文字大小、字体样式
              font: '12pt 楷体',
              // 文本颜色
              fillColor: textColor,
              // 文本样式，FILL：只填充；OUTLINE：只显示轮廓；FILL_AND_OUTLINE：填充颜色并显示轮廓
              style: this.Cesium.LabelStyle.FILL_AND_OUTLINE,
              // 边线颜色
              outlineColor: this.Cesium.Color.RED,
              // 边线宽度
              outlineWidth: 3,
              // 文本垂直方向与坐标点的相对位置：LEFT、CENTER、RIGHT
              verticalOrigin: this.Cesium.VerticalOrigin.CENTER,
              // 文本水平方向与坐标点的相对位置：LEFT、CENTER、RIGHT
              horizontalOrigin: this.Cesium.HorizontalOrigin.CENTER,
            }
          )
          this.entityTextNames.push(text)
        }
      }
    },
    async coordinateChange() {
      this.clearMarker()
      const defaultImg = await markerIconInstance.unSelectIcon()
      const marker = {
        name: 'coordinate-marker',
        center: this.coordinate,
        img: defaultImg,
      }
      this.sceneOverlays.addMarker(marker)
    },
  },
  watch: {
    pickable: {
      immediate: false,
      handler() {
        this.pickableChange()
      },
    },
    center: {
      deep: true,
      immediate: false,
      handler() {
        this.centerChange()
      },
    },
    frameFeature: {
      deep: true,
      immediate: false,
      handler(val) {
        this.frameFeatureChange(val)
      },
    },
    coordinate: {
      immediate: false,
      handler() {
        this.coordinateChange()
      },
    },
  },

  mounted() {
    this.sceneOverlays = Overlay.SceneOverlays.getInstance(
      this.Cesium,
      this.vueCesium,
      this.viewer
    )

    this.pickableChange()
    this.coordinateChange()
    this.frameFeatureChange()
    this.timer = window.setTimeout(() => {
      this.clearTimer()
      this.centerChange()
    }, 500)
  },

  beforeDestroy() {
    this.clearMarker()
    this.clearFrame()
    this.clearTimer()
  },
}
</script>

<style lang="less"></style>
