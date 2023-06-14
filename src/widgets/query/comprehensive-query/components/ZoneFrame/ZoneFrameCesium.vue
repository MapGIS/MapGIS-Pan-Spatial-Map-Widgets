<template>
  <div></div>
</template>

<script lang="ts">
import {
  MapMixin,
  ColorUtil,
  Overlay,
  Feature,
} from '@mapgis/web-app-framework'

export default {
  name: 'ZoneFramCesium',
  mixins: [MapMixin],
  props: {
    feature: {
      type: Object,
      required: true,
      default: () => {
        return {}
      },
    },
    highlightStyle: {
      type: Object,
      default: () => {
        return {}
      },
    },
    center: {
      type: Array,
      default: () => {
        return []
      },
    },
    fitBound: {
      type: Object,
      default: () => {
        return {}
      },
    },
  },
  data() {
    return {
      entityNames: [],

      entityTextNames: [],

      timer: null,
    }
  },

  mounted() {
    this.sceneOverlays = Overlay.SceneOverlays.getInstance(
      this.Cesium,
      this.vueCesium,
      this.viewer
    )
    this.featureChange()
    this.timer = window.setTimeout(() => {
      this.clearTimer()
      this.centerChange()
      this.fitBoundChange()
    }, 500)
  },
  methods: {
    clearTimer() {
      if (this.timer !== null) {
        window.clearTimeout(this.timer)
        this.timer = null
      }
    },
    clear() {
      for (let i = this.entityNames.length - 1; i >= 0; i -= 1) {
        this.sceneOverlays.removeEntityByName(this.entityNames[i])
        this.entityNames.pop()
      }
      for (let i = this.entityTextNames.length - 1; i >= 0; i -= 1) {
        this.viewer.entities.remove(this.entityTextNames[i])
        this.entityTextNames.pop()
      }
    },
    featureChange() {
      this.clear()
      if (this.feature && Object.keys(this.feature).length > 0) {
        // 行政区划几何类型一般是Polygon

        const { features, geometry } = this.feature
        const { type } = geometry // 用于判断类型
        this.entityNames = []
        this.entityTextNames = []

        const fillColor = new this.Cesium.Color.fromCssColorString(
          this.highlightStyle.feature.reg.color
        )

        const fillOutlineColor = new this.Cesium.Color.fromCssColorString(
          this.highlightStyle.feature.line.color
        )

        const width = parseInt(this.highlightStyle.feature.line.size)

        // const coords = this.feature.geometry.coordinates[0]
        let arr
        if (this.center && this.center.length === 2) {
          arr = features
        } else {
          arr = geometry.coordinates
        }
        for (let i = 0; i < arr.length; i += 1) {
          let coords
          if (type === 'Polygon') {
            coords =
              this.center && this.center.length === 2
                ? arr[i].geometry.coordinates[0]
                : arr[i]
          } else if (type === 'MultiPolygon') {
            coords = arr[i][0] // 多区
          }
          const name = `zone-frame-${i}`
          this.entityNames.push(name)
          this.sceneOverlays.addPolygon(
            name,
            coords.join(',').split(',').map(Number),
            fillColor,
            fillOutlineColor,
            coords[0].length > 2, // 数组长度大于2证明是三维点
            { drawOutLine: true, outlineWidth: width }
          )
          if (this.center && this.center.length === 2) {
            const rgba = ColorUtil.getColorObject('#FD6A6F', 1)
            const textColor = new this.Cesium.Color(
              rgba.r / 255,
              rgba.g / 255,
              rgba.b / 255,
              rgba.a
            )
            const text = this.sceneOverlays.addLabel(
              // 经度、纬度、高程
              this.center[0],
              this.center[1],
              0,
              // 文本内容
              features[i].properties.name,
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
      }
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
    fitBoundChange() {
      if (this.fitBound && Object.keys(this.fitBound).length > 0) {
        const { xmin, ymin, xmax, ymax } = this.fitBound
        const rectangle = new this.Cesium.Rectangle.fromDegrees(
          xmin,
          ymin,
          xmax,
          ymax
        )
        this.viewer.camera.flyTo({
          destination: rectangle,
        })
      }
    },
  },
  watch: {
    feature: {
      deep: true,
      handler() {
        this.featureChange()
      },
    },
    highlightStyle: {
      deep: true,
      handler() {
        this.featureChange()
      },
    },
    center: {
      deep: true,
      handler() {
        this.centerChange()
      },
    },
    fitBound: {
      deep: true,
      handler() {
        this.fitBoundChange()
      },
    },
  },

  beforeDestroy() {
    this.clear()
    this.clearTimer()
  },
}
</script>

<style lang="less"></style>
