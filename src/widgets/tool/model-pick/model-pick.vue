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
  Objects,
} from '@mapgis/web-app-framework'

import picker from '../../../components/mixin/pick'

export default {
  name: 'MpModelPick',
  mixins: [WidgetMixin, picker],
  data() {
    return {
      // 是否开启拾取
      isOpenPick: false,
      pickLayers: [],
      checkArr: [],
      unCheckArr: [],
      modelPickController: ModelPickController,
    }
  },
  watch: {
    'modelPickController.pickLayers': {
      immediate: true,
      deep: true,
      handler() {
        this.pickLayers = this.modelPickController.pickLayers
        this.isAllOpen()
      },
    },
  },

  created() {
    const { Cesium, vueCesium, viewer } = this
    this.sceneController = Objects.SceneController.getInstance(
      Cesium,
      vueCesium,
      viewer
    )
    this.cesiumHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
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
    },
    openPick() {
      if (this.isOpenPick) {
        setTimeout(() => {
          this.isModelOpenPick(this.isOpenPick)
        }, 5000)
      }
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
      this.isAllOpen()
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
