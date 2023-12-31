<template>
  <div>
    <mapgis-3d-graph-theme-layer
      v-if="geojson"
      :geojson="geojson"
      :type="type"
      :attributeName="attributeName"
      :attributeColor="attributeColor"
      :width="width"
      :textFont="textFont"
      :textColor="textColor"
      :textHeightOffset="textHeightOffset"
      @load="load"
    />
    <mp-3d-marker-pro
      ref="marker3dProRef"
      :marker="selfMarker"
      :popup-anchor="popupAnchor"
      :popup-toggle-type="popupToggleType"
      v-if="selfMarker.fid"
    >
      <template slot="popup" slot-scope="{ properties }">
        <mapgis-3d-popup-iot :properties="properties" />
      </template>
    </mp-3d-marker-pro>
  </div>
</template>
<script lang="ts">
import CesiumMixin from '../../mixins/cesium'
import { getMarker, IMarker } from '../../../../utils'
import { baseConfigInstance } from '@mapgis/web-app-framework'

export default {
  name: 'CesiumBaseMapWithGraph',
  mixins: [CesiumMixin],
  inject: ['viewer', 'Cesium'],
  data() {
    return {
      // 专题图层
      graphThemeLayer: null,

      typeStr: '',
    }
  },
  computed: {
    // 图标实体颜色
    colors() {
      return (
        this.subjectData.colors || [
          '#FFB980',
          '#5AB1EF',
          '#B6A2DE',
          '#2EC7C9',
          '#D87A80',
        ]
      )
    },

    type() {
      let type = ''
      switch (this.graphType) {
        case 'bar':
          type = 'HorizontalColumn'
          break
        case 'bar3d':
          type = 'HorizontalColumn'
          break
        case 'line':
          this.typeStr = '折线' //eslint-disable-line
          break
        case 'point':
          this.typeStr = '点状' //eslint-disable-line
          break
        case 'pie':
          type = 'Pie'
          break
        case 'ring':
          this.typeStr = '环形' //eslint-disable-line
          break
        default:
          break
      }
      return type
    },

    // 图表x轴或y轴字段
    attributeName() {
      return this.subjectData.graph.showFields
    },

    // 图表类型
    graphType() {
      return this.subjectData.graphType
    },

    setting3D() {
      return (
        this.subjectData.setting3D || {
          width: 50000,
          textFont: '50px Helvetica',
          textColor: '#008000',
          textHeightOffset: 10000,
        }
      )
    },

    width() {
      return this.setting3D.width
    },

    textFont() {
      return this.setting3D.textFont
    },

    textHeightOffset() {
      return this.setting3D.textHeightOffset
    },

    textColor() {
      return this.setting3D.textColor
    },

    // 图标实体颜色
    // private colors: string[] = [
    //   '#FFB980',
    //   '#5AB1EF',
    //   '#B6A2DE',
    //   '#2EC7C9',
    //   '#D87A80'
    // ]

    attributeColor() {
      const cesiumColors = []
      const length = this.attributeName.length
      const colorsLength = this.colors.length
      const attributeColors = []
      for (let i = 0; i < length; i++) {
        const index = i % colorsLength
        console.log(index)
        attributeColors.push(this.colors[index])
      }
      return attributeColors
    },

    popupAnchor() {
      return baseConfigInstance.config.colorConfig.label.image.popupAnchor
    },

    popupToggleType() {
      return baseConfigInstance.config.colorConfig.label.image.popupToggleType
    },
  },
  methods: {
    load(graphThemeLayer) {
      this.graphThemeLayer = graphThemeLayer
      this.showLayer()
    },

    showLayer() {
      if (!this.graphThemeLayer) {
        return
      }
      if (this.type !== '') {
        this.graphThemeLayer.addGraphLayer()
        this.mouseEvent()
      } else {
        this.$message.warning(`三维模式下暂不支持${this.typeStr}统计专题图图层`)
      }
    },

    mouseEvent() {
      const { Cesium, viewer, propertiesOption } = this
      const vm = this
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      handler.setInputAction(function (movement) {
        const pickedPrimitive = viewer.scene.pick(movement.endPosition)
        if (pickedPrimitive) {
          const pickedFeature = pickedPrimitive.primitive.feature
          if (pickedFeature) {
            vm.closePopupWin()
            getMarker(
              pickedFeature,
              pickedFeature.properties.fid,
              propertiesOption
            ).then(vm.setSelfMarker)
            vm.emitHighlight(pickedFeature.properties.fid)
          }
        }
        viewer.scene.requestRender()
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    },

    removeMouseEvent() {
      const { Cesium, viewer } = this
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
      handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    },

    /**
     * 移除图层
     */
    removeLayer() {
      if (this.graphThemeLayer) {
        this.graphThemeLayer.removeGraphLayer()
      }
      this.removeMouseEvent()
      this.closePopupWin()
    },
  },
}
</script>
