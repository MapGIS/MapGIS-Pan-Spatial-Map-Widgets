<template>
  <ul class="beauty-scroll">
    <li
      v-for="item in layers"
      v-show="isIgsTerrainLayer(item) && !isDataFlow(item)"
      :key="item.id"
    >
      <div style="width: 100%">
        <mapgis-ui-tooltip>
          <template slot="title">
            {{ item.description }}
          </template>
          <label>{{ item.title }}</label>
        </mapgis-ui-tooltip>
        <mapgis-ui-tooltip>
          <template slot="title">
            {{ getIconTooltip(item) }}
          </template>
          <mapgis-ui-iconfont
            style="marginleft: 8px; float: right; margin-top: 5px"
            :type="getIcon(item)"
            @click="changeLock(item)"
          />
        </mapgis-ui-tooltip>
      </div>
      <mapgis-ui-slider
        :value="getSliderValue(item)"
        @change="(val) => setOpacity(val, item)"
        :min="0"
        :max="100"
        :tipFormatter="(val) => `${val}%`"
      />
    </li>
  </ul>
</template>

<script lang="ts">
import {
  baseConfigInstance,
  AppMixin,
  IGSSceneSublayerType,
  LayerType,
  events,
  eventBus,
  api,
} from '@mapgis/web-app-framework'

export default {
  name: 'MplayerOpacity',
  props: {
    layers: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      imageOpacityFactor: 100,
      modelOpacityFactor: 100,
    }
  },
  mounted() {
    this.imageOpacityFactor =
      baseConfigInstance.config.imageOpacityFactor || 100
    this.modelOpacityFactor =
      baseConfigInstance.config.modelOpacityFactor || 100
    eventBus.$on(events.IMAGE_OPACITY_FACTOR_CHANGE, (val) => {
      this.imageOpacityFactor = val
      this.opacityFactorChanged('image')
    })
    eventBus.$on(events.MODEL_OPACITY_FACTOR_CHANGE, (val) => {
      this.modelOpacityFactor = val
      this.opacityFactorChanged('model')
    })

    window.testa = (val) => this.testa(val)
  },
  methods: {
    testa(val) {
      this.setOpacity(val, this.layers[0])
    },
    /**
     * 获取slider控件的值，这里的值是基于没有乘以透明度系数值计算的
     */
    getSliderValue(item) {
      const factor = this.getFactor(item)
      const val = 100 - Number(item.opacity / factor) * 100
      return val
    },
    getFactor(layer) {
      let factor = 1
      if (layer.isLockOpacity === undefined || layer.isLockOpacity) {
        return factor
      }
      if (
        layer.type === LayerType.ModelCache ||
        layer.type === LayerType.IGSScene
      ) {
        factor = this.modelOpacityFactor / 100
      } else {
        factor = this.imageOpacityFactor / 100
      }
      if (!factor) {
        // 当factor为0时，被除会出错
        factor = 0.0001
      }
      return factor
    },
    setOpacity(val, item) {
      const factor = this.getFactor(item)
      item.opacity = Number((100 - val) / 100) * factor
      if (item.layerProperty) {
        item.layerProperty.alpha = Number(100 - val)
        const { dataId, layerProperty } = item
        api.updateData({ dataId, layerProperty })
      }
      if (item.type === LayerType.VectorTile) {
        // 矢量瓦片不支持改整体的透明度，遍历layers，设置每个layer的透明度
        const { layers } = item.styleList[0]
        layers.forEach((layer) => {
          const { type } = layer
          if (layer.paint !== undefined) {
            // circle/line/fill/fill-extrusion/symbol/background
            if (type === 'circle') {
              layer.paint['circle-opacity'] = Number((100 - val) / 100) * factor
            } else if (type === 'line') {
              layer.paint['line-opacity'] = Number((100 - val) / 100) * factor
            } else if (type === 'fill') {
              layer.paint['fill-opacity'] = Number((100 - val) / 100) * factor
            } else if (type === 'fill-extrusion') {
              layer.paint['fill-extrusion-opacity'] =
                Number((100 - val) / 100) * factor
            } else if (type === 'symbol') {
              layer.paint['icon-opacity'] = Number((100 - val) / 100) * factor
              layer.paint['text-opacity'] = Number((100 - val) / 100) * factor
            } else if (type === 'background') {
              layer.paint['background-opacity'] =
                Number((100 - val) / 100) * factor
            }
          }
        })
      }
      item.opacityFactor = factor
    },
    isIgsTerrainLayer(layer) {
      let elevation = false
      if (layer.type === LayerType.IGSScene) {
        if (layer.activeScene) {
          layer.activeScene.sublayers.forEach((igsSceneSublayer) => {
            if (igsSceneSublayer.type === IGSSceneSublayerType.elevation) {
              elevation = true
            }
          })
        }
      }
      return !elevation
    },
    isDataFlow(layer) {
      return layer.type === LayerType.DataFlow
    },
    /**
     * 透明度系数变化时，修改图层和模型的透明度
     */
    opacityFactorChanged(type) {
      for (let i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i]
        if (type === 'model') {
          if (
            layer.type !== LayerType.ModelCache &&
            layer.type !== LayerType.IGSScene
          ) {
            continue
          }
        } else if (type === 'image') {
          if (
            layer.type === LayerType.ModelCache ||
            layer.type === LayerType.IGSScene
          ) {
            continue
          }
        }
        const factor = this.getFactor(layer)
        const preFactor = layer.opacityFactor ? layer.opacityFactor : 1
        const { opacity } = layer
        // opacity / preFactor 先恢复到乘透明度系数之前的值，再去乘新的透明度系数，避免多次乘透明度系数导致值不对的问题
        layer.opacity = (opacity / preFactor) * factor
        if (layer.type === LayerType.VectorTile) {
          // 矢量瓦片不支持改整体的透明度，遍历layers，设置每个layer的透明度
          const { layers } = layer.styleList[0]
          layers.forEach((layer) => {
            const { type } = layer
            if (layer.paint !== undefined) {
              // circle/line/fill/fill-extrusion/symbol/background
              if (type === 'circle') {
                const circleOpacity = layer.paint['circle-opacity']
                layer.paint['circle-opacity'] =
                  (circleOpacity / preFactor) * factor
              } else if (type === 'line') {
                const lineOpacity = layer.paint['line-opacity']
                layer.paint['line-opacity'] = (lineOpacity / preFactor) * factor
              } else if (type === 'fill') {
                const fillOpacity = layer.paint['fill-opacity']
                layer.paint['fill-opacity'] = (fillOpacity / preFactor) * factor
              } else if (type === 'fill-extrusion') {
                const fillExtrusionOpacity =
                  layer.paint['fill-extrusion-opacity']
                layer.paint['fill-extrusion-opacity'] =
                  (fillExtrusionOpacity / preFactor) * factor
              } else if (type === 'symbol') {
                const iconOpacity = layer.paint['icon-opacity']
                layer.paint['icon-opacity'] = (iconOpacity / preFactor) * factor
                const textOpacity = layer.paint['text-opacity']
                layer.paint['text-opacity'] = (textOpacity / preFactor) * factor
              } else if (type === 'background') {
                const backgroundOpacity = layer.paint['background-opacity']
                layer.paint['background-opacity'] =
                  (backgroundOpacity / preFactor) * factor
              }
            }
          })
        }
        layer.opacityFactor = factor
      }
    },
    getIcon(item) {
      if (item.isLockOpacity === undefined) {
        return 'mapgis-lock'
      }
      return item.isLockOpacity ? 'mapgis-lock' : 'mapgis-unlock'
    },
    getIconTooltip(item) {
      if (item.isLockOpacity === undefined) {
        return '解锁'
      }
      return item.isLockOpacity ? '解锁' : '锁定'
    },
    changeLock(item) {
      // 默认为true，即默认锁定，透明度不受透明度系数影响
      const isLockOpacity =
        item.isLockOpacity !== undefined ? item.isLockOpacity : true
      item.isLockOpacity = !isLockOpacity
      const preFactor = item.opacityFactor ? item.opacityFactor : 1
      const { opacity } = item
      if (item.isLockOpacity) {
        // 开启锁定，并且item.opacityFactor已存在，则恢复图层透明度，即解除受透明度系数的影响
        item.opacity = opacity / preFactor
        item.opacityFactor = 1
      } else {
        // 解除锁定，透明度乘透明度系数
        const factor = this.getFactor(item)
        item.opacity = opacity * factor
        item.opacityFactor = factor
      }
      this.$forceUpdate()
    },
    setLayerOpacitys(layers) {
      layers.forEach((layer) => {
        const current = this.layers.find((item) => item.id === layer.layerId)
        if (current) {
          const opacity = 100 - layer.opacity * 100 + 0.001
          setTimeout(() => {
            this.setOpacity(opacity, current)
          }, 1000)
        }
      })
    },
  },
}
</script>

<style lang="less" scoped>
ul {
  flex: 1 1 0%;
  overflow: auto;
  list-style: none;
  margin: 0;
  padding: 0 10px;
  li {
    margin-bottom: 10px;
  }
}
</style>
