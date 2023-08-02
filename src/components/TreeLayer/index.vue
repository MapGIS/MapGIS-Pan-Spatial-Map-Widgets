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
          <mapgis-ui-iconfont
            v-if="isParentLayer(item) && !isIGSScene(item)"
            class="mapgis-ui-iconfont"
            :disabled="getIndex(item) <= 0"
            type="mapgis-shang"
            @click="lower(item)"
          />
          <mapgis-ui-iconfont
            v-if="isParentLayer(item) && !isIGSScene(item)"
            class="mapgis-ui-iconfont"
            :disabled="getIndex(item) >= layers.length - 1"
            type="mapgis-xia"
            @click="raise(item)"
          />
          <!---------------------------- 图层的子图层end -------------------------->
          <mapgis-ui-popover
            v-if="showPopover(item)"
            placement="bottomLeft"
            arrow-point-at-center
            :visible="item.visiblePopover"
            trigger="click"
            @visibleChange="(visible) => clickPopover(item, visible)"
            overlayClassName="layer-list-popover"
          >
            <template slot="content">
              <right-popover
                v-if="!isVectorTileSubLayer(item)"
                ref="rightPopover"
                :layer-item="item"
                @meta-data-info="metaDataInfo"
                @attributes="attributes"
                @custom-query="customQuery"
                @fit-bounds="fitBounds"
                @reset-tilematrix-set="resetTilematrixSet"
                @open-change-active-layer="openChangeActiveLayer"
                @to-top="toTop"
                @edit-data-flow-style="editDataFlowStyle"
                @change-m3d-props="changeM3DProps"
                @model-edit="modelEdit"
                @query="queryFeature"
              />
              <!-- <slot
                v-else
                name="vector-tile-sublayer-popover"
                :layer="item"
              ></slot> -->
            </template>
            <mapgis-ui-iconfont
              type="mapgis-more"
              class="more mapgis-ui-iconfont"
            ></mapgis-ui-iconfont>
          </mapgis-ui-popover>
        </div>
      </mapgis-ui-tree>
    </div>
    <mp-window-wrapper :visible="showMetadataInfo">
      <template v-slot:default="slotProps">
        <mp-window
          title="元数据信息"
          :is-full-screen="true"
          :shrinkAction="false"
          :fullScreenAction="false"
          :icon="widgetInfo.icon"
          :visible.sync="showMetadataInfo"
          anchor="top-center"
          v-bind="slotProps"
        >
          <template>
            <mp-metadata-info
              v-if="showMetadataInfo"
              :currentLayer="currentLayerInfo"
            />
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>

    <mp-window-wrapper :visible="showCustomQuery">
      <template v-slot:default="slotProps">
        <mp-window
          title="自定义查询"
          :width="550"
          :height="400"
          :icon="widgetInfo.icon"
          :visible.sync="showCustomQuery"
          anchor="top-center"
          v-bind="slotProps"
        >
          <template>
            <mp-custom-query
              v-if="showCustomQuery"
              :queryParams="queryParams"
              @close="onCloseCustomQuery"
            />
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>
  </div>
</template>

<script lang="ts">
import {
  MapMixin,
  AppMixin,
  ExhibitionControllerMixin,
  Exhibition,
  LayerType,
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
} from '@mapgis/web-app-framework'
import MpMetadataInfo from '../MetadataInfo/MetadataInfo.vue'
import MpCustomQuery from '../CustomQuery/CustomQuery.vue'
import MpUnifyModify from './components/UnifyModify/UnifyModify.vue'
import layerTypeUtil from './mixin/layer-type-util'
import RightPopover from './components/RightPopover/index.vue'
import ModelStretchUtil from '../ModelStretch/mixin/ModelStretchUtil.js'

const { IAttributeTableExhibition, AttributeTableExhibition } = Exhibition

export default {
  name: 'MpTreeLayer',
  components: {
    MpMetadataInfo,
    MpCustomQuery,
    MpUnifyModify, //eslint-disable-line
    RightPopover,
  },
  mixins: [
    MapMixin,
    AppMixin,
    ExhibitionControllerMixin,
    layerTypeUtil,
    ModelStretchUtil,
  ],
  inject: ['vueCesium'],
  props: {
    widgetRouters: {
      type: Array,
    },
    widgetInfo: {
      type: Object,
    },
    layerDocument: {
      type: Object,
    },
  },
  data() {
    return {
      filter: '',
      ticked: [],
      layers: [],
      showMetadataInfo: false,
      showCustomQuery: false,
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
    }
  },
  computed: {
    selectedKeys() {
      if (this.searchkeyArr.length > 0 && this.searchIndex > -1) {
        return [this.searchkeyArr[this.searchIndex]]
      }

      return []
    },
  },
  watch: {
    'layerDocument.defaultMap': {
      immediate: true,
      deep: true,
      handler() {
        this.parentKeys = []
        this.resetWidgetRouters()
        const layerSublayers = []
        if (
          this.layerDocument &&
          this.layerDocument.defaultMap &&
          this.layerDocument.defaultMap.layers()
        ) {
          const layers: Array<unknown> = this.layerDocument
            .clone()
            .defaultMap.layers()
          this.setDocument(layers)
          const arr = []
          for (let index = 0; index < layers.length; index++) {
            const item = layers[index]
            item.key = index.toString()
            item.scopedSlots = { title: 'custom' }
            item.visiblePopover = false
            if (this.isIGSScene(item)) {
              if (item.activeScene) {
                item.sublayers = item.activeScene.sublayers.map((row) => ({
                  ...row,
                }))
              }
            }

            if (this.isVectorTile(item)) {
              /**
               * 修改说明：矢量瓦片里的layers没有row.layout或者没有row.layout.visibility字段时，是默认显示，这里默认设置为可见
               * 修改人：龚跃健
               * 修改日期：2021/11/25
               */
              item.sublayers = item.currentStyle.layers.map((row) => ({
                ...row,
                visible:
                  row.layout === undefined ||
                  row.layout.visibility === undefined ||
                  row.layout.visibility === 'visible',
                id: `${item.id}~${row.id}`,
                title: row.description || row.id,
              }))
            }
            if (this.isWMTSLayer(item)) {
              if (item.isVisible || item.visible) {
                arr.push(item.key)
              }
            } else if (
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
          LayerSublayersManager.sublayersConfig = layerSublayers
          this.layers = layers

          this.ticked = arr

          setTimeout(() => {
            this.setLayerEditConfig()
          }, 3000)

          // const expandedKeys = this.getExpandedKeys()
          // this.expandedKeys = [
          //   ...new Set([...expandedKeys, ...this.expandedKeys]),
          // ]
        }
      },
    },
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
    'modelPickController.pickLayerObj': {
      immediate: false,
      deep: true,
      handler() {
        this.parseModelPick()
      },
    },
  },
  created() {
    this.sceneController = Objects.SceneController.getInstance(
      this.Cesium,
      this.vueCesium,
      this.viewer
    )
    // 存放模型编辑对象
    window.modelEditControlList = new Object()
  },
  mounted() {
    this.$root.$on(events.SCENE_LOADEN_ON_MAP, this.sceneLoadedCallback)
    eventBus.$on(events.MODEL_PICK, this.updateM3DEnablePopupEnable)
    eventBus.$on(events.ECHO_LAYER_LIST_INFO, this.echoLayerList)
  },
  methods: {
    setLayerEditConfig() {
      const doc = this.layerDocument.clone()
      const layers = doc.defaultMap.layers()
      const layerEditConfig =
        DataCatalogCheckController.getCurrentLayerChangeConfig()
      const unSetArr = []
      // 设置屏幕误差和亮度
      if (layerEditConfig && layerEditConfig.length > 0) {
        layerEditConfig.forEach((item) => {
          const sublayer =
            this.sceneController.findSource(item.id) ||
            this.sceneController.findM3DIgsSource(item.id)
          sublayer && unSetArr.push(item.id)
          if (sublayer) {
            if (
              sublayer.maximumScreenSpaceError.toString() !==
              item.maximumScreenSpaceError.toString()
            ) {
              sublayer.maximumScreenSpaceError = item.maximumScreenSpaceError
            }

            const indexArr = item.id.split(':')
            if (indexArr.length === 2 || this.isModelCacheLayer(sublayer)) {
              const [firstIndex, secondIndex] = indexArr
              const layer = layers.find((current) => current.id === firstIndex)
              if (indexArr.length === 2) {
                const { sublayers } = layer.activeScene
                sublayers.forEach((sub) => {
                  unSetArr.push(sub.id)

                  const sublayerM3d = this.sceneController.findSource(sub.id)
                  if (
                    sublayerM3d.luminanceAtZenith.toString() !==
                    item.luminanceAtZenith.toString()
                  ) {
                    sublayerM3d.luminanceAtZenith = item.luminanceAtZenith
                  }
                })
              } else {
                if (
                  sublayer.luminanceAtZenith.toString() !==
                  item.luminanceAtZenith.toString()
                ) {
                  sublayer.luminanceAtZenith = item.luminanceAtZenith
                }
              }
            }
          }
        })
      }

      // 正常加载时处理屏幕误差和亮度
      const layerSublayers = LayerSublayersManager.sublayersConfig
      if (layerSublayers && layerSublayers.length > 0) {
        layerSublayers.forEach((item) => {
          if (!unSetArr.includes(item.id)) {
            const sublayer =
              this.sceneController.findSource(item.id) ||
              this.sceneController.findM3DIgsSource(item.id)
            if (sublayer) {
              if (
                sublayer.maximumScreenSpaceError !==
                item.layerProperty.maximumScreenSpaceError
              ) {
                sublayer.maximumScreenSpaceError =
                  item.layerProperty.maximumScreenSpaceError
              }

              if (
                sublayer.luminanceAtZenith.toString() !==
                item.layerProperty.luminanceAtZenith.toString()
              ) {
                sublayer.luminanceAtZenith =
                  item.layerProperty.luminanceAtZenith
              }
            }
          }
        })
      }
    },
    /**
     * 当正在编辑图层被取消的时候，复位图层树路由
     */
    resetWidgetRouters() {
      let layer
      if (
        this.currentLayerInfo &&
        this.layerDocument &&
        this.layerDocument.defaultMap &&
        this.layerDocument.defaultMap.layers() &&
        this.layerDocument.defaultMap.layers().length > 0
      ) {
        layer = this.layerDocument.defaultMap.findLayerById(
          this.currentLayerInfo.id
        )
      }
      if (!layer && this.widgetRouters && this.widgetRouters.length > 1) {
        this.widgetRouters.splice(1)
      }
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

    setBackgroundColor(item) {
      if (
        this.searchkeyArr.length > 0 &&
        item.key === this.searchkeyArr[this.searchIndex]
      ) {
        return {
          backgroundColor: 'yellow',
        }
      }
      return null
    },

    //  没有这一步，手动控制展开的位置无法折叠
    onExpand(expandedKeys) {
      this.expandedKeys = expandedKeys
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
      const includeHanlfCheckArrNew = val.concat(e.halfCheckedKeys)
      const includeHanlfCheckArrOld = this.ticked.concat(this.parentKeys)
      const doc = this.layerDocument.clone()
      const layers: Array<unknown> = doc.defaultMap.layers()
      // 查找出与前一次check不同的数据，相同数据则不用处理提升效率
      const diffArr: Array<string> = includeHanlfCheckArrNew
        .concat(includeHanlfCheckArrOld)
        .filter(function (v, i, arr) {
          return arr.indexOf(v) === arr.lastIndexOf(v)
        })
      this.$emit('changed', diffArr)
      diffArr.forEach((item) => {
        if (item.split('-').length > 1) {
          const parentIndex: string = item.split('-')[0]
          const childrenArr: Array<string> = item.split('-')
          let layerItem = layers[parentIndex]
          childrenArr.forEach((i, index) => {
            if (index === 0) {
              return
            }
            if (index === childrenArr.length - 1) {
              if (this.isIGSScene(layerItem)) {
                if (layerItem.activeScene) {
                  layerItem.activeScene.sublayers[i].visible =
                    !layerItem.activeScene.sublayers[i].visible
                } else if (
                  !layerItem.activeScene &&
                  layerItem.layer.activeScene // 中间层
                ) {
                  layerItem.sublayers[i].visible =
                    !layerItem.sublayers[i].visible
                }
              } else if (this.isVectorTile(layers[parentIndex])) {
                /**
                 * 修改说明：矢量瓦片里的layers没有row.layout或者没有row.layout.visibility字段时，是默认显示，这里默认设置为可见
                 * 修改人：龚跃健
                 * 修改日期：2021/11/25
                 */
                const layer = layerItem.currentStyle.layers[i]
                const visible =
                  layer.layout === undefined ||
                  layer.layout.visibility === undefined ||
                  layer.layout.visibility === 'visible'
                if (layer.layout) {
                  layer.layout.visibility = visible ? 'none' : 'visible'
                } else {
                  layer.layout = {
                    visibility: visible ? 'none' : 'visible',
                  }
                }
              } else {
                layerItem.sublayers[i].visible = !layerItem.sublayers[i].visible
              }
            } else {
              if (this.isIGSScene(layerItem)) {
                if (layerItem.activeScene) {
                  layerItem = layerItem.activeScene.sublayers[i]
                }
              } else {
                layerItem = layerItem.sublayers[i]
              }
            }
          })
        } else {
          layers[item].isVisible = !layers[item].isVisible
        }
      })
      // this.document = doc
      this.$emit('update:layerDocument', doc)
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
     * 三维模型缓存加载完后的回调
     */
    sceneLoadedCallback(id) {
      const doc = this.layerDocument.clone()
      const { layers } = doc.defaultMap._rootLayer
      const vm = this
      for (let i = 0; i < this.layers.length; i++) {
        const layer = this.layers[i]
        let source
        if (layer.id === id) {
          if (layer.type === LayerType.ModelCache) {
            if (layer.format === ModelCacheFormat.m3d) {
              source = vm.sceneController.findM3DIgsSource(id)
            } else if (layer.format === ModelCacheFormat.cesium3dTileset) {
              source = vm.sceneController.findTileset3DSource(id)
            }
            source.readyPromise.then(() => {
              const newLayer = vm._setBoundingSphereAndExtent(source, layer)
              doc.defaultMap._rootLayer.layers[i] = newLayer
              this.$emit('update:layerDocument', doc)
            })
          } else if (layer.type === LayerType.IGSScene) {
            const layerId = layer.sublayers[0].id
            setTimeout(() => {
              source = vm.sceneController.findSource(layerId)
              const newLayer = vm._setBoundingSphereAndExtent(source, layer)
              doc.defaultMap._rootLayer.layers[i] = newLayer
              this.$emit('update:layerDocument', doc)
            }, 1000)
          }
        }
      }
    },
    /**
     * 设置场景服务、模型缓存、3dTiles 图层的BoundingSphere和Extent
     */
    _setBoundingSphereAndExtent(source, layer) {
      const boundingSphere = source._root.boundingVolume.boundingSphere
      let extent
      if (source._root.boundingVolume.northeastCornerCartesian) {
        extent = this._getM3DSetRange(source)
      }

      if (extent) {
        layer.fullExtent.xmin = extent.xmin
        layer.fullExtent.ymin = extent.ymin
        layer.fullExtent.xmax = extent.xmax
        layer.fullExtent.ymax = extent.ymax
      }
      if (boundingSphere) {
        layer.boundingSphere = boundingSphere
      }
      return layer
    },
    /**
     * 获取m3d经纬度包围盒
     */
    _getM3DSetRange(m3dSet) {
      const { Cesium } = this
      // 如果模型未加载完，这里transform为undefined
      const transform = m3dSet._transform || m3dSet._root.transform
      if (!transform) {
        return null
      }
      const inverseMatrix = Cesium.Matrix4.inverse(
        transform,
        new Cesium.Matrix4()
      )
      // 东北角
      const northeastCornerCartesian =
        m3dSet._root.boundingVolume.northeastCornerCartesian
      const northeastCornerDegree = this._degreeFromCartesian(
        northeastCornerCartesian
      )
      const xmax = northeastCornerDegree.longitude
      const ymax = northeastCornerDegree.latitude

      // 西南角
      const southwestCornerCartesian =
        m3dSet._root.boundingVolume.southwestCornerCartesian
      const southwestCornerDegree = this._degreeFromCartesian(
        southwestCornerCartesian
      )

      const xmin = southwestCornerDegree.longitude
      const ymin = southwestCornerDegree.latitude

      const zmin = m3dSet._root.boundingVolume.minimumHeight
      const zmax = m3dSet._root.boundingVolume.maximumHeight
      return { xmin, ymin, xmax, ymax, zmin, zmax }
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

    fitBounds(item, layeExtent) {
      const { Cesium, map, viewer, vueCesium } = this
      const isOutOfRange = FitBound.fitBoundByLayer(
        item.dataRef,
        {
          Cesium,
          map,
          viewer,
          vueCesium,
        },
        this.is2DMapMode === true,
        layeExtent
      )
      this.clickPopover(item, false)
      if (isOutOfRange) {
        this.$message.error('地图范围有误，已调整为经纬度最大范围')
      }
    },

    resetTilematrixSet(item) {
      this.currentLayerInfo = item.dataRef
      this.clickPopover(item, false)
      this.openPage({
        title: '切换矩阵集',
        name: 'MpSelectTilematrixSet',
        component: () =>
          import('./components/SelectTilematrixSet/SelectTilematrixSet.vue'),
        props: {
          layer: this.currentLayerInfo,
        },
        listeners: {
          'update:layer': this.refreshCurrentWmts,
        },
      })
    },

    editDataFlowStyle(item) {
      this.currentLayerInfo = item.dataRef
      this.clickPopover(item, false)
      this.openPage({
        title: '编辑样式',
        name: 'MpEditDataFlowStyle',
        component: () => import('./components/EditDataFlowStyle'),
        props: {
          layer: this.currentLayerInfo,
          baseUrl: this.baseUrl,
        },
        listeners: {
          'update:layer': this.updateDataFlowStyle,
        },
      })
    },

    queryFeature() {},

    /**
     * 打开M3D编辑属性页面
     */
    changeM3DProps(item) {
      this.currentLayerInfo = item.dataRef
      this.clickPopover(item, false)
      this.changeLayer(item)
      this.openPage({
        title: '属性编辑',
        name: 'MpChangeM3DProps',
        component: () =>
          import('./components/ChangeM3DProps/ChangeM3DProps.vue'),
        props: {
          layer: this.currentLayerInfo,
        },
        listeners: {
          'update:layer': (val) => {
            this.updateM3DProps(val, false)
            this.changeLayer(val)
            const layer = val.layer ? val.layer : val
            const { dataId, layerProperty } = layer
            // api.updateData({ dataId, layerProperty })
          },
          'update:luminanceAtZenith': (val) => {
            this.updateM3DProps(val, true)
          },
          'update:scaleZ': (val) => {
            this.changeScaleZ(val.scaleZ, val.offset)
          },
          'update:enableModelStretch': (val) => {
            if (!val.enableModelStretch) {
              this.updateModelReset()
            } else {
              this.changeScaleZ(val.scaleZ, val.offset)
            }
          },
        },
      })
    },

    /**
     * 打开wmts切换激活图层页面
     */
    openChangeActiveLayer(item) {
      this.currentLayerInfo = item.dataRef
      this.clickPopover(item, false)
      this.openPage({
        title: '切换图层',
        name: 'MpChangeActiveLayer',
        component: () =>
          import('./components/ChangeActiveLayer/ChangeActiveLayer.vue'),
        props: {
          layer: this.currentLayerInfo,
        },
        listeners: {
          'update:layer': this.updateActiveLayer,
        },
      })
    },

    /**
     * 打开模型编辑页面
     */
    modelEdit(item) {
      // if (this.modelEditId !== item.id) this.modelEditId = item.id
      this.modelEditLayer = item
      if (window.modelEditControlList[item.id]) {
        window.transformEditor = window.modelEditControlList[item.id]
      } else {
        const { Cesium, viewer } = this
        const g3dLayer = this.getG3dLayer(item.id)
        window.transformEditor = new Cesium.ModelTransformTool(g3dLayer)
        window.transformEditor.initModelEditor(viewer)
        window.modelEditControlList[item.id] = window.transformEditor
      }

      this.openPage({
        title: '模型编辑',
        name: 'MpModelEdit',
        component: () => import('./components/ModelEdit/ModelEdit.vue'),
        props: {
          layer: this.modelEditLayer,
        },
        listeners: {
          'model-edit': (type, val) => {
            this.updateModel(type, val)
          },
        },
      })
    },

    updateModel(type, val) {
      switch (type) {
        case 'reset':
          // 重置模型
          this.updateModelReset()
          break
        case 'deactivate':
          // 取消图形化编辑
          this.updateModelDeactivate()
          break
        case 'zoom':
          // 缩放(三轴)
          this.updateModelZoom()
          break
        case 'zoomSingle':
          // 缩放(单轴)
          this.updateModelZoomSingle()
          break
        case 'rotate':
          // 旋转
          this.updateModelRotate()
          break
        case 'move':
          // 移动
          this.updateModelMove()
          break
        case 'zoomTo':
          // 开始缩放
          this.updateModelZoomTo(val)
          break
        case 'rotateTo':
          // 开始旋转
          this.updateModelRotateTo(val)
          break
        case 'moveTo':
          // 开始移动
          this.updateModelMoveTo(val)
          break
        case 'destroy':
          // 销毁
          this.updateModelDestroy(val)
          break
        default:
          break
      }
    },

    updateModelZoom() {
      window.transformEditor.activeScaleEditor({
        singleScale: false,
      })
    },

    updateModelZoomSingle() {
      window.transformEditor.activeScaleEditor({
        singleScale: true,
      })
    },

    updateModelRotate() {
      window.transformEditor.activeRotationEditor()
    },

    updateModelMove() {
      window.transformEditor.activeTranslationEditor()
    },

    updateModelZoomTo(zoom) {
      window.transformEditor.setScala(zoom.xScale, zoom.yScale, zoom.zScale)
    },

    updateModelRotateTo(rotate) {
      window.transformEditor.setRotation(rotate.degree, rotate.axis)
    },

    updateModelMoveTo(move) {
      window.transformEditor.setTranslation(
        move.longitude,
        move.latitude,
        move.height
      )
    },

    updateModelDestroy(isSave) {
      this.modelSave = isSave
      this.updateModelDeactivate()
    },

    toTop(item) {
      if (this.layerDocument && this.layerDocument.defaultMap) {
        const map = this.layerDocument.defaultMap
        const layer = map.findLayerById(item.id)
        map.remove(layer)
        map.add(layer)
        if (this.map.getLayer(item.id)) {
          this.map.moveLayer(item.id)
        }
      }
    },

    getIndex(item) {
      if (this.layerDocument && this.layerDocument.defaultMap) {
        const map = this.layerDocument.defaultMap
        return map.getIndexByLayerId(item.id)
      }
      return 0
    },
    /**
     * 图层上移一位(图层树上节点往下移，即index变大)
     */
    raise(item) {
      if (this.layerDocument && this.layerDocument.defaultMap) {
        const map = this.layerDocument.defaultMap
        const beforeLayerId = map.raise(item.id)
        if (beforeLayerId.length > 0 && this.map.getLayer(item.id)) {
          if (this.map.getLayer(beforeLayerId)) {
            this.map.moveLayer(item.id, beforeLayerId)
          }
        } else {
          this.map.moveLayer(item.id)
        }
      }
    },
    /**
     * 图层下移一位(图层树上节点往上移，即index变小)
     */
    lower(item) {
      if (this.layerDocument && this.layerDocument.defaultMap) {
        const map = this.layerDocument.defaultMap
        const beforeLayerId = map.lower(item.id)
        if (beforeLayerId.length > 0 && this.map.getLayer(item.id)) {
          if (this.map.getLayer(beforeLayerId)) {
            this.map.moveLayer(item.id, beforeLayerId)
          }
        }
      }
    },

    setIconfontOpacity(item) {
      return { opacity: this.getIndex(item) > 0 ? 1 : 0.4 }
    },

    updateDataFlowStyle(val: DataFlowLayer) {
      const { key, layerStyle } = val
      const doc = this.layerDocument.clone()
      const layers: Array<unknown> = doc.defaultMap.layers()
      const layerItem: DataFlowLayer = layers[key]
      layerItem.setLayerStyle(layerStyle)
      this.$emit('update:layerDocument', doc)
      this.currentLayerInfo = {}
    },

    // updateLuminanceAtZenith(luminanceAtZenith) {
    //   const { key, luminanceAtZenith } = val
    //   const indexArr: Array<string> = key.split('-')
    // },
    updateM3DProps(val, onlyUpdateLuminanceAtZenith, changeEnablePopup) {
      let enablePopup
      let enableModelSwitch
      let layerProperty = {}
      const { key, maximumScreenSpaceError, layer, id, luminanceAtZenith } = val
      const { viewer, Cesium } = this
      if (layer) {
        enablePopup =
          changeEnablePopup !== undefined
            ? changeEnablePopup
            : layer.enablePopup
        enableModelSwitch = layer.enableModelSwitch
        layerProperty = val.layer.layerProperty
      } else {
        enablePopup = val.enablePopup
        enableModelSwitch = val.enableModelSwitch
        layerProperty = val.layerProperty
      }
      const indexArr: Array<string> = key.split('-')
      const idArr = id.split(':')
      const doc = this.layerDocument.clone()
      const layers: Array<unknown> = doc.defaultMap.layers()

      // 记录修改后的值
      const editConfig = {
        parentId: idArr[0],
        id: id,
        layerProperty: {
          ...layerProperty,
          enablePopup,
          enableModelSwitch,
          maximumScreenSpaceError,
          luminanceAtZenith,
        },
      }
      LayerPropertyEdit.propertyConfigArr = editConfig

      const editChangeConfig = {
        id: id,
        maximumScreenSpaceError: maximumScreenSpaceError,
        luminanceAtZenith: luminanceAtZenith,
      }
      DataCatalogCheckController.editCurrentLayerConfig(editChangeConfig)
      if (indexArr.length === 2 || this.isModelCacheLayer(val)) {
        const [firstIndex, secondIndex] = indexArr
        if (indexArr.length === 2) {
          const { sublayers } = layers[firstIndex].activeScene
          const sublayer = sublayers[secondIndex]
          sublayer.maximumScreenSpaceError = maximumScreenSpaceError
          sublayer.luminanceAtZenith = luminanceAtZenith
          sublayer.layer.enablePopup = enablePopup
          sublayer.layer.layerProperty = {
            ...layerProperty,
            enablePopup,
            enableModelSwitch,
            maximumScreenSpaceError,
            luminanceAtZenith,
          }
          const m3d = this.sceneController.findSource(id)
          m3d.maximumScreenSpaceError = maximumScreenSpaceError
          // m3d.enablePopup = enablePopup
          if (onlyUpdateLuminanceAtZenith) {
            // 模型阴影区亮度设置，如果是g3d，则对里面的图层都进行设置
            for (let i = 0; i < sublayers.length; i++) {
              const sublayerId = sublayers[i].id
              const sublayerM3d = this.sceneController.findSource(sublayerId)
              sublayerM3d.luminanceAtZenith = luminanceAtZenith
            }
          } else {
            this.$emit('update:layerDocument', doc)
          }
        } else {
          const MC = layers[firstIndex]
          MC.enablePopup = enablePopup
          MC.enableModelSwitch = enableModelSwitch
          MC.maximumScreenSpaceError = maximumScreenSpaceError
          MC.luminanceAtZenith = luminanceAtZenith
          MC.layerProperty = {
            ...layerProperty,
            enablePopup,
            enableModelSwitch,
            maximumScreenSpaceError,
            luminanceAtZenith,
          }
          const m3d = this.sceneController.findM3DIgsSource(MC.id)
          if (m3d) {
            m3d.maximumScreenSpaceError = maximumScreenSpaceError
            m3d.luminanceAtZenith = luminanceAtZenith
          }
          if (!onlyUpdateLuminanceAtZenith) {
            this.$emit('update:layerDocument', doc)
          }
        }
      }
      this.currentLayerInfo = {}
    },

    // 模型拾取微件统一开启/关闭拾取
    updateM3DEnablePopupEnable(isOpenPick) {
      this.isOpenPick = isOpenPick
      this.changeModelPick()
    },
    changeModelPick() {
      let subLayers = []
      this.layers.forEach((item) => {
        if (item.sublayers) {
          subLayers = [...subLayers, ...item.sublayers]
        }
      })
      subLayers.forEach((item) => {
        setTimeout(() => {
          this.updateM3DProps(item, false, this.isOpenPick)
        }, 100)
      })
    },

    dealLayers() {
      this.pickArr = []
      this.layers.forEach((layer) => {
        this.pickArr.push(layer.id)
      })
    },

    updateActiveLayer(val: OGCWMTSLayer) {
      const {
        key,
        activeLayer: { id },
      } = val
      const indexArr: Array<string> = key.split('-')
      const doc = this.layerDocument.clone()
      const layers: Array<unknown> = doc.defaultMap.layers()
      if (indexArr.length === 1) {
        const layerItem: OGCWMTSLayer = layers[indexArr[0]]
        // layerItem.activeLayer = val.activeLayer
        layerItem.activeLayer = layerItem.findSublayerById(id)
      }
      this.$emit('update:layerDocument', doc)
      this.currentLayerInfo = {}
    },

    refreshCurrentWmts(val) {
      const { tileMatrixSetId, tileMatrixSets } = val
      const { key } = val
      const indexArr = key.split('-')
      const doc = this.layerDocument.clone()
      const layers: Array<unknown> = doc.defaultMap.layers()
      let layerItem = layers[indexArr[0]]
      indexArr.forEach((i, index) => {
        if (index === 0) {
          return
        }
        if (index === indexArr.length - 1 && layerItem.sublayers[i]) {
          layerItem.sublayers[i].tileMatrixSetId = tileMatrixSetId
          layerItem.sublayers[i].tileMatrixSets = tileMatrixSets
        } else {
          layerItem = layerItem.sublayers[i]
        }
      })
      this.$emit('update:layerDocument', doc)
      this.currentLayerInfo = {}
    },

    /**
     * 自定义查询
     */
    async customQuery(layer) {
      this.showCustomQuery = true
      this.clickPopover(layer, false)
      const exhibition = await this.getExhibition(layer, '自定义查询')
      if (exhibition) {
        this.queryParams = exhibition
      }
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

    /**
     * 打开新的router页面
     */
    openPage(router) {
      this.$nextTick(() => {
        this.widgetRouters.push(router)
      })
    },

    metaDataInfo(node) {
      const layer = node.dataRef
      if (this.isWMTSLayer(layer) || this.isWMSLayer(layer)) {
        window.open(layer.url)
      } else {
        this.showMetadataInfo = true
        this.currentLayerInfo = layer
      }
      // 复位当前选择的图层
      // this.$nextTick(() => {
      //   this.currentLayerInfo = {}
      // })
      this.clickPopover(node, false)
    },

    clickPopover(item, visible) {
      item.dataRef.visiblePopover = visible
      this.layers = [...this.layers]
    },

    onCloseCustomQuery() {
      this.showCustomQuery = false
    },
    getCurrentData() {
      const checkLayerConfig = {}
      const layerInfo = {}
      const expandedKeys = this.expandedKeys
      const checkNodeKeys = this.ticked
      const relation = {}
      this.layers.forEach((layer) => {
        relation[layer.id] = layer.key
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
      config[layer.id] = {
        layerProperty: layer.layerProperty || null,
        opacity: layer.opacity,
        isVisible: layer.isVisible,
        visible: layer.visible,
      }
      const sublayerArr = []
      if (layer.sublayers && layer.sublayers.length > 0) {
        this.getSublayers(layer.sublayers, sublayerArr)
      }
      config[layer.id].sublayers = sublayerArr
    },
    getSublayers(layer, sublayerArr) {
      if (layer && layer.length > 0) {
        layer.forEach((item) => {
          const sublayer = {
            geomType: item.geomType,
            id: item.id,
            key: item.key,
            sysLibraryGuid: item.sysLibraryGuid,
            maximumScreenSpaceError: item.maximumScreenSpaceError,
            luminanceAtZenith: item.luminanceAtZenith,
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
    echoLayerList(layerConfig) {
      this.layerConfig = layerConfig
      this.expandedKeys = []
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

      // const layerConfig = {
      //   expandedKeys: newExpandedKeys,
      //   ticked: newCheckNodeKeys,
      // }

      return expandedKeys
    },
    parseModelPick() {
      const changeModelPickArr = ModelPickController.pickLayerObj
      const modelPickOpen = ModelPickController.modelPickOpen
      if (changeModelPickArr && changeModelPickArr.length === 0) return
      const doc = this.layerDocument.clone()
      const layers = doc.defaultMap.layers()
      changeModelPickArr.forEach((item) => {
        // 单个图层和多个图层的处理
        if (item.childIds && item.childIds.length > 0) {
          item.childIds.forEach((change) => {
            const indexArr = change.split(':')
            const [firstIndex, secondIndex] = indexArr
            const layer = this.layers.find((c) => c.id === item.parentId)
            if (indexArr.length === 2) {
              const editLayer = layers[layer.key]
              const { sublayers } = editLayer.activeScene
              const sublayer = sublayers[secondIndex]
              sublayer.layer.enablePopup = modelPickOpen
              sublayer.layer.layerProperty = {
                ...sublayer.layer.layerProperty,
                enablePopup: modelPickOpen,
              }
            }
          })
        } else {
          const layer = this.layers.find(
            (change) => change.id === item.parentId
          )
          const targetLayer = layers[layer.key]
          targetLayer.enablePopup = modelPickOpen
          targetLayer.layerProperty = {
            ...targetLayer.layerProperty,
            enablePopup: modelPickOpen,
          }
        }
      })
      this.$emit('update:layerDocument', doc)
    },
  },
  beforeDestroy() {
    eventBus.$off(events.MODEL_PICK)
    window.modelEditControlList = undefined
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
