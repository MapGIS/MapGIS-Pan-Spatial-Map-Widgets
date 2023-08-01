<template>
  <div class="mp-model-pick">
    <mapgis-ui-switch-row-left
      class="switch-title switch-normal"
      title="开启/取消拾取（全部）"
      v-model="isOpenPick"
      @change="isModelOpenPick"
    />
    <!-- <mapgis-ui-switch-row-left
      class="switch-normal"
      v-for="(item, index) in pickLayers"
      :title="item.title"
      v-model="item.value"
      @change="layerPickChange(item.key, item.value, index)"
      :key="item.key"
    /> -->
    <mapgis-ui-row
      class="mapgis-ui-switch-row-left switch-normal"
      v-for="(item, index) in pickLayers"
      :key="index"
    >
      <div class="mapgis-ui-switch-row-left-title" :title="item.title">
        {{ item.title }}
      </div>
      <div class="mapgis-ui-switch-row-left-switch">
        <mapgis-ui-switch
          @change="layerPickChange(item.key, item.value, index)"
          checked-children="是"
          un-checked-children="否"
          v-model="item.value"
          :key="item.key"
        />
      </div>
    </mapgis-ui-row>
  </div>
</template>
<script lang="ts">
import {
  WidgetMixin,
  AppMixin,
  events,
  eventBus,
  LayerType,
  ModelPickController,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpModelPick',
  mixins: [WidgetMixin, AppMixin],
  data() {
    return {
      // 是否开启拾取
      isOpenPick: false,
      pickLayers: [],
      layerRelation: {},
      checkArr: [],
      unCheckArr: [],
    }
  },
  watch: {
    'document.defaultMap': {
      immediate: true,
      deep: true,
      handler() {
        const layers = this.document.clone().defaultMap.layers() || []
        const pickLayer = layers.filter((layer) =>
          [LayerType.IGSScene, LayerType.ModelCache].includes(layer.type)
        )
        pickLayer.forEach((layer) => {
          if (LayerType.IGSScene === layer.type && layer.activeScene) {
            layer.sublayers = layer.activeScene.sublayers.map((row) => ({
              ...row,
            }))
          }
        })
        // 记录父子图层节点关系
        this.layerRelation = {}
        // 组装数据
        const pickArr = []
        pickLayer.forEach((layer) => {
          this.layerRelation[layer.id] = []
          const openObj = {
            isOpen: false,
          }
          const childLayer = []
          if (layer.sublayers && layer.sublayers.length > 0) {
            this.getLayerRelation(layer.sublayers, childLayer, openObj)
          } else {
            openObj.isOpen = layer.layerProperty?.enablePopup
          }

          this.layerRelation[layer.id] = childLayer
          const pick = {
            key: layer.id,
            title: layer.title,
            value: openObj.isOpen,
          }
          pickArr.push(pick)
        })
        this.pickLayers = pickArr
        this.isAllOpen()
      },
    },
  },
  created() {
    // eventBus.$on(events.MODEL_PICK_ADD, this.openPick)
  },

  methods: {
    isModelOpenPick(val, e) {
      // 判断是否由点击全部开启按钮导致该值的改变
      if (val) {
        const flag = this.pickLayers.some((item) => !item.value)
        if (flag) {
          const changeArr = this.pickLayers.filter((item) => !item.value)
          this.changeLayer(changeArr, true)
        }
      } else {
        const flag = this.pickLayers.some((item) => item.value)
        if (flag) {
          const changeArr = this.pickLayers.filter((item) => item.value)
          this.changeLayer(changeArr, false)
        }
      }
      // 改变pickLayers中的属性值
      this.pickLayers.forEach((item) => (item.value = val))
      // eventBus.$emit(events.MODEL_PICK, val)
    },
    openPick() {
      if (this.isOpenPick) {
        setTimeout(() => {
          this.isModelOpenPick(this.isOpenPick)
        }, 5000)
      }
    },
    getLayerRelation(layers, childLayer, openObj) {
      layers.forEach((layer) => {
        childLayer.push(layer.id)

        if (!openObj.isOpen) {
          openObj.isOpen = layer.layer
            ? layer.layer.layerProperty?.enablePopup
            : layer.layerProperty?.enablePopup
        }
        if (layer.layer) {
          return
        }
        if (layer.sublayers && layer.sublayers.length > 0) {
          this.getLayerRelation(layer.sublayers, childLayer, openObj.isOpen)
        }
      })
    },
    layerPickChange(val, isOpen, index) {
      const childLayer = this.layerRelation[val]
      const layer = this.pickLayers.find((item) => item.key === val)
      const data = {
        isOpen: layer.value,
        parentId: layer.key,
        childIds: childLayer,
      }
      ModelPickController.pickLayerObj = [data]
      ModelPickController.modelPickOpen = isOpen
      // this.operateLayer(layer.key, isOpen)
      this.isAllOpen()
    },
    operateLayer(key, isOpen) {
      if (isOpen) {
        if (this.unCheckArr.includes(key)) {
          this.unCheckArr = this.unCheckArr.filter((item) => item.key !== key)
        }
        this.checkArr.push(key)
      } else {
        if (this.checkArr.includes(key)) {
          this.checkArr = this.checkArr.filter((item) => item.key !== key)
        }
        this.unCheckArr.push(key)
      }
    },
    isAllOpen() {
      if (this.pickLayers && this.pickLayers.length > 0) {
        this.isOpenPick = this.pickLayers.every((item) => item.value)
      } else {
        this.isOpenPick = false
      }
    },
    changeLayer(changeArr, isOpen) {
      const changeLayerArr = []
      changeArr.forEach((item) => {
        const childLayer = this.layerRelation[item.key]
        const data = {
          isOpen: !item.value,
          parentId: item.key,
          childIds: childLayer,
        }
        changeLayerArr.push(data)
      })
      ModelPickController.pickLayerObj = changeLayerArr
      ModelPickController.modelPickOpen = isOpen
    },
  },
}
</script>
<style lang="scss">
.mp-model-pick {
  .switch-title {
    font-weight: bold;
  }
  .switch-normal {
    .mapgis-ui-switch-row-left-title {
      width: 70%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .mapgis-ui-switch-row-left-switch {
      width: calc(100% - 70%);
    }
  }
  .mapgis-ui-switch-row-left {
    text-align: left;
    height: 32px;
    line-height: 32px;
  }

  .mapgis-ui-switch-row-left-title,
  .mapgis-ui-switch-row-left-switch {
    display: inline-block;
    height: inherit;
    vertical-align: top;
  }

  .mapgis-ui-switch-row-left-title {
    width: 90px;
    text-align: left;
    padding-left: 10px;
    font-size: 14px;
    /* font-weight: bolder; */
    color: $text-color;
  }

  .mapgis-ui-switch-row-left-switch {
    padding-right: 10px;
    width: calc(100% - 94px);
    text-align: right;
  }
}
</style>
