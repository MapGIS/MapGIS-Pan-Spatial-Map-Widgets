import {
  Layer,
  ColorUtil,
  Feature,
  Overlay,
  events,
  eventBus,
} from '@mapgis/web-app-framework'
import { getMarker, IMarker } from '../../../utils'
import BaseMixin from './base'

// CesiumMixin
export default {
  mixins: [BaseMixin],
  inject: ['viewer', 'Cesium', 'vueCesium'],
  data() {
    return {
      // 标注
      selfMarker: {},
    }
  },
  watch: {
    /**
     * 监听：图属联动变化
     */
    'marker.fid'() {
      this.setSelfMarker(this.marker)
      if (!this.marker || this.marker.fid === undefined) {
        const { viewer } = this
        let { sceneOverlays } = this
        const { scene } = viewer
        if (!sceneOverlays) {
          sceneOverlays = Overlay.SceneOverlays.getInstance(
            this.Cesium,
            this.vueCesium,
            viewer
          )
        }

        setTimeout(() => {
          sceneOverlays.registerMouseEvent('LEFT_CLICK')
        }, 2000)
      }
    },
  },
  methods: {
    /**
     * 公共方法：添加实体到图层
     * @param layer 图层
     * @param feature 要素数据
     * @param option 实体配置
     */
    addEntityToLayer(layer: Layer, feature: Feature.GFeature, option = {}) {
      const entity = new this.Cesium.Entity(option)
      entity.geojsonFeature = feature
      layer.entities.add(entity)
    },
    /**
     * 公共方法：移除所有实体
     * @param layer 图层
     */
    removeAllEntity(layer: Layer) {
      if (layer) {
        layer.entities.removeAll()
      }
    },

    /**
     * 公共方法：获取颜色值
     * @param color 颜色
     */
    getColor(color: string) {
      const { r, g, b, a } = ColorUtil.getColorObject(color)
      return new this.Cesium.Color(r / 255, g / 255, b / 255, a)
    },

    /**
     * 公共方法：获取颜色值
     * @param color 颜色
     */
    getCssColorStr(color: string) {
      return new this.Cesium.Color.fromCssColorString(color)
    },

    /**
     * 公共方法：获取Cartesian坐标
     * @param lng
     * @param lat
     * @param alt
     */
    getPosition(lng: number, lat: number, alt = 0) {
      return new this.Cesium.Cartesian3.fromDegrees(lng, lat, alt)
    },

    /**
     * 添加图层
     */
    addDataSourceToViewer(layer: Layer) {
      if (layer) {
        this.viewer.dataSources.add(layer)
      }
    },

    /**
     * 移除图层
     * @param layer 图层
     */
    removeViewerLayer(layer: Layer) {
      if (layer) {
        this.viewer.dataSources.remove(layer)
        layer = null
      }
    },

    /**
     * fixme 设置标注
     * Mp3dMarkerPro组件默认初始marker时不会展示popup弹框。暂不考虑扩展Mp3dMarkerPro组件，因为该组件已被下沉，可能有不稳定的因素，故由上层根据需要手动控制popup弹框的展示。
     * 需要注意的是如果Mp3dMarkerPro组件的showPopup字段被改名，需同步此处代码。
     */
    setSelfMarker(marker?: IMarker) {
      this.selfMarker = {}
      if (marker) {
        this.selfMarker = marker
        this.$nextTick(() => {
          const markerRef: any = this.$refs.marker3dProRef
          if (markerRef && typeof markerRef.showPopup !== 'undefined') {
            markerRef.showPopup = true
          }
        })
      }
    },

    /**
     * 点击显示实体弹框
     */
    showPopupWin() {
      const { viewer, propertiesOption } = this
      let { sceneOverlays } = this
      if (!sceneOverlays) {
        sceneOverlays = Overlay.SceneOverlays.getInstance(
          this.Cesium,
          this.vueCesium,
          viewer
        )
      }
      const { scene } = viewer
      eventBus.$on(events.CESIUM_LEFT_CLICK, this.leftClick)
      sceneOverlays.registerMouseEvent('LEFT_CLICK')
    },
    leftClick({ position }) {
      const { viewer, propertiesOption } = this
      const { scene } = viewer
      this.closePopupWin()
      const pick = scene.pick(position)
      if (pick && pick.id) {
        const { geojsonFeature } = pick.id
        if (geojsonFeature) {
          const { fid } = geojsonFeature.properties
          getMarker(geojsonFeature, fid, propertiesOption).then(
            this.setSelfMarker
          )
          this.emitHighlight(fid)
        }
      } else {
        // 标注destory的时候会触发接触左击事件，这里设置一个延时，恢复点击事件
        let { sceneOverlays } = this
        if (!sceneOverlays) {
          sceneOverlays = Overlay.SceneOverlays.getInstance(
            this.Cesium,
            this.vueCesium,
            viewer
          )
        }
        setTimeout(() => {
          sceneOverlays.registerMouseEvent('LEFT_CLICK')
        }, 2000)
      }
    },

    /**
     * 关闭实体弹框
     */
    closePopupWin() {
      this.emitClearHighlight()
    },

    /**
     * 显示图层
     */
    showLayer() {
      this.removeLayer()
      if (!this.thematicMapLayer) {
        this.thematicMapLayer = new this.Cesium.CustomDataSource(this.id)
      }
      this.addGeoJSONFeaturesToEntity(this.thematicMapLayer)
      this.addDataSourceToViewer(this.thematicMapLayer)
      this.showPopupWin()
    },

    /**
     * 移除图层
     */
    removeLayer() {
      if (this.thematicMapLayer) {
        this.removeViewerLayer(this.thematicMapLayer)
        this.removeAllEntity(this.thematicMapLayer)
        this.closePopupWin()
      }
    },
  },
}
