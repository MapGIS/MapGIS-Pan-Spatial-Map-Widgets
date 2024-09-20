/* eslint-disable @typescript-eslint/no-for-in-array */
<template>
  <div class="tree-layer-container">
    <mapgis-ui-input-search
      ref="layerListFilter"
      enter-button
      placeholder="搜索图层"
      @search="onSearch"
      allowClear
    />
    <div class="tree-container beauty-scroll">
      <mapgis-ui-tree
        :checkedKeys="ticked"
        @check="tickedChange"
        :expanded-keys="expandedKeys"
        @expand="onExpand"
        @select="onSelect"
        checkable
        :tree-data="layers"
        block-node
        :selectedKeys="selectedKeys"
        :replaceFields="{
          children: 'sublayers',
        }"
      >
        <!-- 原来的图标类型为type="check-circle" -->
        <div slot="custom" slot-scope="item" class="tree-item-handle">
          <div>
            <i
              v-if="nodeIcon(item).isSvg"
              class="icon"
              v-html="nodeIcon(item).icon"
            >
            </i>
            <img v-else class="tree-item-icon" :src="nodeIcon(item).icon" />
          </div>
          <!-- wmts图层的子图层start ：当为wmts图层时，子图层是展示当前选中的图层， -->
          <mapgis-ui-iconfont
            v-if="
              item.layer && isWMTSLayer(item.layer) && isActiveWMTSLayer(item)
            "
            type="mapgis-check"
            :style="{ color: '#52c41a', fontSize: '16px' }"
          />
          <i
            v-else-if="
              item.layer && isWMTSLayer(item.layer) && !isActiveWMTSLayer(item)
            "
          />
          <!--------------------------- wmts图层的子图层end -------------------------->

          <!---------------------------- 图层的子图层start -------------------------->
          <mapgis-ui-tooltip
            v-if="
              filter !== '' &&
              item.title.toUpperCase().indexOf(filter.toUpperCase()) > -1
            "
          >
            <template v-if="item.description" slot="title">
              {{ item.description }}
            </template>
            <span :id="`tree_${item.key}`" @click="clickItem(item)">
              <!---------- 高亮查询查询结果start -------->
              <span>{{
                item.title.substr(
                  0,
                  item.title.toUpperCase().indexOf(filter.toUpperCase())
                )
              }}</span>
              <span class="filter-words">{{
                item.title.substr(
                  item.title.toUpperCase().indexOf(filter.toUpperCase()),
                  filter.length
                )
              }}</span>
              <span>{{
                item.title.substr(
                  item.title.toUpperCase().indexOf(filter.toUpperCase()) +
                    filter.length
                )
              }}</span>
              <!---------- 高亮查询查询结果end -------->
            </span>
          </mapgis-ui-tooltip>
          <mapgis-ui-tooltip v-else>
            <template v-if="item.description" slot="title">
              {{ item.description }}
            </template>
            <span :id="`tree_${item.key}`" @click="clickItem(item)">{{
              item.title
            }}</span>
          </mapgis-ui-tooltip>
          <!---------------------------- 图层的子图层end -------------------------->
        </div>
      </mapgis-ui-tree>
    </div>
    <div>
      <a-button class="edit-tool-button" type="primary" @click="transformUpdate" style="width: 100%;">应用变换</a-button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  MapMixin,
  AppMixin,
  ExhibitionControllerMixin,
  Exhibition,
  LayerType,
  IGSSceneSublayerType,
  ModelCacheFormat,
  IGSMapImageLayer,
  IGSVectorLayer,
  OGCWMTSLayer,
  DataFlowLayer,
  Sublayer,
  WMTSSublayer,
  CoordinateTransformation,
  CoordinateSystemType,
  Objects,
  FitBound,
  baseConfigInstance,
  DataCatalogManager,
  events,
  eventBus,
  api,
  DataCatalogCheckController,
  LayerSublayersManager,
  ModelPickController,
  LayerPropertyEdit,
  Metadata,
} from '@mapgis/web-app-framework'
import layerTypeUtil from '../../mixin/layer-type-util'
import ModelStretchUtil from '../../../ModelStretch/mixin/ModelStretchUtil.js'
import layerCoordinateGridUtil from '../../mixin/layer-coordinate-grid-util'
import featureEditUtil from '../../mixin/feature-eidt-util'
import { defaultDataIconsConfig } from '../../../../theme/dataIconsConfig.js'

const { IAttributeTableExhibition, AttributeTableExhibition } = Exhibition

window.layers3D = {}

export default {
  name: 'MpSharePanel',
  components: {
  },
  mixins: [
    MapMixin,
    AppMixin,
    ExhibitionControllerMixin,
    layerTypeUtil,
    ModelStretchUtil,
    layerCoordinateGridUtil,
    featureEditUtil,
  ],
  inject: ['vueCesium'],
  props: {
    // layerDocument: {
    //   type: Object,
    // },
    transformArray: {
      type: Array,
    },
    layerObject: {
      type: Object,
    },
  },
  data() {
    return {
      filter: '',
      ticked: [],
      // layers: [],
      showMetadataInfo: false,
      queryParams: {},
      // 右侧菜单栏选中的图层信息
      currentLayerInfo: {},
      expandedKeys: [],
      // 记录可见状态为true的父节点的key
      parentKeys: [],
      //  搜索功能，收到结果的  key的数组
      searchkeyArr: [],
      // 高亮搜索结果的下标
      searchIndex: -1,
      // 模型拾取统一开启/关闭标识
      isOpenPick: false,
      // 图层列表中的数据id
      pickArr: [],
      // 模型编辑图层
      modelEditLayer: {},
      // 图层是否保持编辑样式
      modelSave: false,
      layerConfig: null,
      modelPickController: ModelPickController,
      // 保存OGC元数据信息
      currentOGCMetadata: undefined,
      // 记录当前编辑的图层id
      currentEditLayerId: '',
    }
  },
  computed: {
    layers(){
      return [this.layerObject]
    },
    selectedKeys() {
      if (this.searchkeyArr.length > 0 && this.searchIndex > -1) {
        return [this.searchkeyArr[this.searchIndex]]
      }

      return []
    },
    mapList() {
      if (this.layers && this.layers.length > 0) {
        return this.layers.map((layer) => {
          if (
            layer.searchParams &&
            layer.searchParams.mapList &&
            layer.searchParams.mapList.length > 0
          ) {
            return layer.searchParams.mapList
          } else {
            return []
          }
        })
      } else {
        return []
      }
    },
  },
  watch: {
    filter: {
      handler(newVal, oldVal) {
        if (this.filter !== '') {
          const arr = []
          this.filterTreeNode(this.layers, arr)
          this.searchkeyArr = arr
          const parentArr = []
          arr.forEach((key) => {
            const keyArr = key.split('-')
            keyArr.forEach((item, i) => {
              const keys = []
              for (let index = 0; index <= i; index++) {
                keys.push(keyArr[index])
              }
              parentArr.push(keys.join('-'))
            })
          })
          // 去除数组中重叠的key
          this.expandedKeys = Array.from(new Set(parentArr))
          if (newVal !== oldVal) {
            this.timer = setTimeout(() => {
              this.setSearchIndex()
            }, 700)
          }
        }
      },
    },
  },
  created() {
    this.sceneController = Objects.SceneController.getInstance(
      this.Cesium,
      this.vueCesium,
      this.viewer
    )
    // // 存放模型编辑对象
    // window.modelEditControlList = new Object()
  },
  mounted() {
    this.layers = [this.layerObject]
  },
  methods: {
    nodeIcon(item) {
      let icon
      if (item.type !== undefined) {
        let { type } = item
        if (item.layer && item.layer.type === LayerType.IGSScene) {
          // 场景服务里的组图层/子图层
          if (type === IGSSceneSublayerType.groupLayer3D) {
            // 场景服务的组图层
            let { layerIcons } = this.application.baseConfig
            if (!layerIcons || layerIcons.length == 0) {
              layerIcons = defaultDataIconsConfig.layerIcons
            }
            for (let i = 0; i < layerIcons.length; i++) {
              for (let j = 0; j < layerIcons[i].children.length; j++) {
                const child = layerIcons[i].children[j]
                if (child.layerType === 'Group') {
                  icon = child.icon
                  return {
                    isSvg: icon && icon.indexOf('<svg') >= 0,
                    icon,
                  }
                }
              }
            }
          } else if (type === IGSSceneSublayerType.modelCache) {
            type = LayerType.ModelCache
          }
        }
        // 服务类型
        let { serviceIcons } = this.application.baseConfig
        if (!serviceIcons || serviceIcons.length == 0) {
          serviceIcons = defaultDataIconsConfig.serviceIcons
        }
        for (let i = 0; i < serviceIcons.length; i++) {
          for (let j = 0; j < serviceIcons[i].children.length; j++) {
            const child = serviceIcons[i].children[j]
            if (type === LayerType[child.serviceType]) {
              icon = child.icon
              return {
                isSvg: icon && icon.indexOf('<svg') >= 0,
                icon,
              }
            }
          }
        }
      } else if (item.dataRef && item.dataRef.geomType) {
        // 图层类型
        let { layerIcons } = this.application.baseConfig
        if (!layerIcons || layerIcons.length == 0) {
          layerIcons = defaultDataIconsConfig.layerIcons
        }
        let geomType = item.dataRef.geomType
        if (item.dataRef.sublayers && item.dataRef.sublayers.length > 0) {
          geomType = 'Group'
        }
        for (let i = 0; i < layerIcons.length; i++) {
          for (let j = 0; j < layerIcons[i].children.length; j++) {
            const child = layerIcons[i].children[j]
            if (geomType === child.layerType) {
              icon = child.icon
              return {
                isSvg: icon && icon.indexOf('<svg') >= 0,
                icon,
              }
            }
          }
        }
      }
      icon = ''
      return { isSvg: icon && icon.indexOf('<svg') >= 0, icon }
    },

    onSearch(val) {
      const time = this.filter === val
      if (time) {
        this.filter = val
        // 当延时操作还在进行时，取消滚动条滚动操作，防止searchIndex因为延时操作而产生bug
        if (!this.timer) {
          this.setSearchIndex()
        }
      } else {
        this.searchkeyArr = []
        this.searchIndex = -1
        this.filter = val
      }
    },

    setSearchIndex() {
      if (this.searchkeyArr.length > 0) {
        if (this.searchIndex >= this.searchkeyArr.length - 1) {
          this.searchIndex = 0
        } else {
          this.searchIndex++
        }
        const element = this.$el.querySelector(
          `#tree_${this.searchkeyArr[this.searchIndex]}`
        )
        if (element) {
          element.scrollIntoView()
        }
        this.timer = null
      }
    },

    filterTreeNode(layers, arr) {
      layers.forEach((item) => {
        if (item.title.toUpperCase().indexOf(this.filter.toUpperCase()) > -1) {
          arr.push(item.key)
        }
        if (item.sublayers && item.sublayers.length > 0) {
          this.filterTreeNode(item.sublayers, arr)
        }
      })
    },

    /**
     * 点击树节点的回调函数
     */
    clickItem(node) {
      this.$emit('click-item', node)
    },

    //  没有这一步，手动控制展开的位置无法折叠
    onExpand(expandedKeys) {
      this.expandedKeys = expandedKeys
    },

    // 选中树节点触发展开/收起
    onSelect(selectedKeys, e) {
      const flag = this.expandedKeys.includes(e.node.eventKey)
      if (flag) {
        this.expandedKeys = this.expandedKeys.filter(
          (item) => item !== e.node.eventKey
        )
      } else {
        this.expandedKeys.push(e.node.eventKey)
      }
    },

    /**
     * 该函数，是为了处理，当父节点为visible可见性false，子节点visible为true，
     * 这边递归讲父节点visible为false的子节点visible全部修改为false
     */
    setDocument(layers) {
      // const layers = this.layerDocument.defaultMap.layers()
      for (let index = 0; index < layers.length; index++) {
        const item = layers[index]
        let parentVisible
        if (item.isVisible !== undefined) {
          parentVisible = item.isVisible
        } else if (item.visible !== undefined) {
          parentVisible = item.visible
        }
        if (item.sublayers && item.sublayers.length > 0) {
          this.changeSublayersVisible(item.sublayers, parentVisible)
        }
      }
    },

    changeSublayersVisible(sublayers: Array, parentVisible: boolean) {
      for (let index = 0; index < sublayers.length; index++) {
        const item = sublayers[index]
        if (item.layer && this.isWMTSLayer(item.layer)) {
          return
        }
        let subParentVisible
        if (item.isVisible !== undefined) {
          if (parentVisible === false) {
            item.isVisible = false
          }
          subParentVisible = item.isVisible
        } else if (item.visible !== undefined) {
          if (parentVisible === false) {
            item.visible = false
          }
          subParentVisible = item.visible
        }
        if (item.sublayers && item.sublayers.length > 0) {
          this.changeSublayersVisible(item.sublayers, subParentVisible)
        }
      }
    },
    tickedChange(val: Array<string>, e) {
      this.ticked = val
    },
    transformUpdate(){
      this.tickedChange0(this.ticked)
    },
    tickedChange0(val: Array<string>) {
      const layers = this.layers
      const diffArr = val
      const modelsInfo = []
      diffArr.forEach((item) => {
        let selectLayer
        if (item.split('-').length > 1) {
          const parentIndex: string = item.split('-')[0]
          const childrenArr: Array<string> = item.split('-')
          let layerItem = layers[parentIndex]
          const modelsInfo = []
          childrenArr.forEach((i, index) => {
            if (index === 0) {
              return
            }
            if (index === childrenArr.length - 1) {
              if (this.isIGSScene(layerItem)) {
                if (layerItem.activeScene) {
                  selectLayer = layerItem.activeScene.sublayers[i]
                } else if (
                  !layerItem.activeScene &&
                  layerItem.layer.activeScene // 中间层
                ) {
                  selectLayer = layerItem.sublayers[i]
                }
              } else if (this.isVectorTile(layers[parentIndex])) {
                selectLayer = layerItem.currentStyle.layers[i]
              } else {
                selectLayer = layerItem.sublayers[i]
              }
            } else {
              if (this.isIGSScene(layerItem)) {
                if (layerItem.activeScene) {
                  layerItem = layerItem.activeScene.sublayers[i]
                } else {
                  // 子图层没有activeScene
                  layerItem = layerItem.sublayers[i]
                }
              } else {
                layerItem = layerItem.sublayers[i]
              }
            }
            // if (this.isIGSScene(layerItem)) {
            //   if (layerItem.activeScene) {
            //     selectLayer = layerItem.activeScene.sublayers[i].id
            //   } else{
            //     selectLayer = layerItem.sublayers[i].id
            //   }
            //   // 改变模型变换矩阵
            //   const model = this.getSceneLayer3DSet(selectLayer)
            //   model._root.transform = this.Cesium.Matrix4.fromArray(this.transformArray);
            //   // 记录需要保存的模型变换矩阵
            //   modelsInfo.push({          
            //     layer: selectLayer,
            //     transform: model._root.transform
            //   })
            // }
          })
        } else {
          selectLayer = layers[item]
        }
        const model = this.getSceneLayer3DSet(selectLayer.id)
        if(model){
          model._root.transform = this.Cesium.Matrix4.fromArray(this.transformArray);
          // 记录需要保存的模型变换矩阵
          modelsInfo.push({          
            layer: selectLayer,
            transform: model._root.transform
          })
        }
      })
      // 提交保存
      this.$emit('save',modelsInfo)
    },

    /**
     * @sublayers 子节点的数组
     * @id 父节点的key值
     * @arr 存储ticked的数组
     * @parentVisible 父节点的可见性
     */
    setSublayers(
      sublayers: Array,
      id: string,
      arr: Array<string>,
      layerSublayers: Array
    ) {
      for (let index = 0; index < sublayers.length; index++) {
        const item = sublayers[index]
        item.key = `${id}-${index}`
        item.scopedSlots = { title: 'custom' }
        item.visiblePopover = false
        const sublayerConfig = {
          id: item.id,
          layerProperty: item.layer?.layerProperty,
        }
        layerSublayers.push(sublayerConfig)
        if (item.layer && this.isWMTSLayer(item.layer)) {
          item.checkable = false
          return
        }
        if (item.layer && this.isIgsTileLayer(item.layer)) {
          item.checkable = false
          if (item.sublayers && item.sublayers.length > 0) {
            this.setSublayers(item.sublayers, item.key, arr, layerSublayers)
          }
          continue
        }
        if (
          (item.sublayers && item.sublayers.length === 0) ||
          !item.sublayers
        ) {
          if (item.isVisible || item.visible) {
            arr.push(item.key)
          }
        } else if (item.sublayers && item.sublayers.length > 0) {
          /**
           * @修改说明
           * 这里存储visible或者为isVisible为true的父节点，因为这些可见的父节点并没有存储到ticked，
           * 后续点击check的点击事件返回的val会包含这些父节点无法做比较
           */
          if (item.isVisible || item.visible) {
            this.parentKeys.push(item.key)
          }
        }
        if (item.sublayers && item.sublayers.length > 0) {
          this.setSublayers(item.sublayers, item.key, arr, layerSublayers)
        }
      }
    },


    /**
     * 笛卡尔坐标转世界坐标
     */
    _degreeFromCartesian(p) {
      if (!p) return
      const { Cesium } = this
      const point = {}
      const cartographic = Cesium.Cartographic.fromCartesian(p)
      point.longitude = Cesium.Math.toDegrees(cartographic.longitude)
      point.latitude = Cesium.Math.toDegrees(cartographic.latitude)
      point.height = cartographic.height // 模型高度
      return point
    },


    getIndex(item) {
      if (this.layerDocument && this.layerDocument.defaultMap) {
        const map = this.layerDocument.defaultMap
        return map.getIndexByLayerId(item.id)
      }
      return 0
    },

    setIconfontOpacity(item) {
      return { opacity: this.getIndex(item) > 0 ? 1 : 0.4 }
    },

    updateModelBoundingBox(val, layerId) {
      const targetLayer = this.getTargetLayer(layerId)
      targetLayer.debugShowBoundingVolume = val
    },
    getTargetLayer(id) {
      const targetLayer =
        this.sceneController.findSource(id) ||
        this.sceneController.findM3DIgsSource(id)
      return targetLayer
    },

    dealLayers() {
      this.pickArr = []
      this.layers.forEach((layer) => {
        this.pickArr.push(layer.id)
      })
    },

    /**
     * 查看属性
     */
    async attributes(layer) {
      this.clickPopover(layer, false)
      const exhibition = await this.getExhibition(layer, '属性表')
      if (exhibition) {
        this.addExhibition(new AttributeTableExhibition(exhibition))
        this.openExhibitionPanel()
      }
    },

    // 解析url获取domain及docName
    parseUrl(urlStr) {
      const url = new URL(urlStr)
      const domain = url.origin
      const serverType = 'igs/rest/services/'
      const indexServer = urlStr.search(serverType)
      const indexName = indexServer + serverType.length
      const docName =
        urlStr.substr(indexName).split('/').length > 2
          ? `${urlStr.substr(indexName).split('/')[0]}:${
              urlStr.substr(indexName).split('/')[1]
            }`
          : `${urlStr.substr(indexName).split('/')[0]}`
      return { domain, docName }
    },

    async metaDataInfo(node) {
      const layer = node.dataRef
      if (this.isWMTSLayer(layer) || this.isWMSLayer(layer)) {
        if (baseConfigInstance.config.token) {
          const token = baseConfigInstance.config.token
          const { domain, docName } = this.parseUrl(layer.url)
          const option = { domain, docName, token }
          const metadata = await Metadata.CloudMetaDataQuery.query(option)
          if (metadata) {
            this.currentOGCMetadata = {
              ...JSON.parse(JSON.stringify(metadata)),
              type: layer.type,
            }
            this.showMetadataInfo = true
            return
          }
        } else {
          window.open(layer.url)
        }
      } else {
        this.showMetadataInfo = true
        this.currentLayerInfo = layer
      }
      this.clickPopover(node, false)
    },

    clickPopover(item, visible) {
      item.dataRef.visiblePopover = visible
      this.layers = [...this.layers]
    },
    // 将this.layers转化成一维数组
    transferLayers(layers, arr) {
      layers.forEach((item) => {
        arr.push({ ...item })
        if (item.sublayers && item.sublayers.length > 0) {
          this.transferLayers(item.sublayers, arr)
        }
      })
    },
    getCurrentData() {
      const layerArr = []
      const checkLayerConfig = {}
      const layerInfo = {}
      const expandedKeys = this.expandedKeys
      const relation = {}
      const checkNodeKeys = this.ticked
      this.layers.forEach((layer) => {
        // relation[layer.id] = layer.key
        relation[layer.url] = layer.key
        this.getLayerProperty(layer, layerInfo)
      })
      return {
        expandedKeys,
        checkNodeKeys,
        relation,
        layerInfo,
        ...checkLayerConfig,
      }
    },
    getLayerProperty(layer, config) {
      config[layer.url] = {
        layerProperty: layer.layerProperty || null,
        opacity: layer.opacity,
        isVisible: layer.isVisible,
        visible: layer.visible,
      }
      const sublayerArr = []
      if (layer.sublayers && layer.sublayers.length > 0) {
        this.getSublayers(layer.sublayers, sublayerArr)
      }
      config[layer.url].sublayers = sublayerArr
    },
    getSublayers(layer, sublayerArr) {
      if (layer && layer.length > 0) {
        layer.forEach((item) => {
          // 场景服务的子图层layerProperty属性需要在item.layer.layerProperty中取
          const sublayer = {
            geomType: item.geomType,
            id: item.id,
            key: item.key,
            sysLibraryGuid: item.sysLibraryGuid,
            maximumScreenSpaceError: item.layer
              ? item.layer.layerProperty.maximumScreenSpaceError
              : item.maximumScreenSpaceError,
            luminanceAtZenith: item.layer
              ? item.layer.layerProperty.luminanceAtZenith
              : item.luminanceAtZenith,
            title: item.title,
            url: item.url,
            visible: item.visible,
            visiblePopover: item.visiblePopover,
          }

          sublayerArr.push(sublayer)
          const nextSubLayers = item.sublayers
          if (nextSubLayers && nextSubLayers.length > 0) {
            this.getSublayers(nextSubLayers, sublayerArr)
          }
        })
      }
    },
    getExpandedKeys(item) {
      const { layerInfo, relation, checkNodeKeys, expandedKeys } =
        this.layerConfig

      const newRelation = {}
      const newExpandedKeys = []
      const checkRelation = {}
      Object.keys(relation).forEach((id) => {
        const index = this.layers.findIndex((item) => item.id === id)
        if (index !== -1) {
          newRelation[id] = index
          checkRelation[relation[id]] = index
          expandedKeys.includes(id) && newExpandedKeys.push(index)
        }
      })

      const newCheckNodeKeys = []
      checkNodeKeys.forEach((item) => {
        const splitArr = item.split('-')
        if (checkRelation[splitArr[0]] !== undefined) {
          newCheckNodeKeys.push(checkRelation[splitArr[0]])
        }
      })

      return expandedKeys
    },
  },
  beforeDestroy() {
    eventBus.$off(events.MODEL_PICK)
  },
}
</script>

<style lang="scss" scoped>
::v-deep .tree-layer-container {
  .tree-container {
    .tree-item-handle {
      .filter-words {
        color: $primary-color;
      }
      .more {
        color: $text-color;
        &:hover {
          color: $primary-color;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.tree-layer-container {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .tree-container {
    flex: 1 1 0%;
    overflow: auto;
    .tree-item-handle {
      display: flex;
      width: 100%;
      overflow: hidden;
      align-items: center;
      .tree-item-icon {
        width: 1em;
        height: 1em;
        vertical-align: -0.125em;
        margin-right: 5px;
      }
      .icon {
        display: flex;
        fill: currentColor;
        align-items: center;
        margin-right: 5px;
        > svg {
          width: 100%;
          height: 100%;
        }
      }
      .more {
        font-size: 16px;
        margin-right: 0;
      }
      i {
        margin-right: 6px;
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
.mapgis-ui-iconfont :hover {
  color: $primary-color;
}

.mapgis-ui-iconfont[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
