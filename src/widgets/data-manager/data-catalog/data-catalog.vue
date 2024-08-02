<template>
  <div class="mp-widget-data-catalog">
    <div class="toolbar">
      <mapgis-ui-input-search
        v-model="searchValue"
        placeholder="搜索数据"
        allow-clear
        @search="onSearch"
      ></mapgis-ui-input-search>
      <mapgis-ui-dropdown :trigger="['click']" class="action-more">
        <mapgis-ui-iconfont
          type="mapgis-more"
          v-show="isChangeDataCatalog"
        ></mapgis-ui-iconfont>
        <mapgis-ui-menu slot="overlay">
          <mapgis-ui-menu-item key="0" @click="refreshTree"
            >刷新</mapgis-ui-menu-item
          >
          <mapgis-ui-menu-item key="1" @click="bookMarksCheck"
            >收藏</mapgis-ui-menu-item
          >
          <mapgis-ui-menu-item key="2" @click="resizeCheck"
            >重置</mapgis-ui-menu-item
          >
        </mapgis-ui-menu>
      </mapgis-ui-dropdown>
    </div>

    <div class="tree-container beauty-scroll">
      <div
        class="tree-tabs-list-content"
        v-show="
          isClassify && isChangeDataCatalog && dataCatalogTabData.length > 0
        "
      >
        <mapgis-ui-ant-icon
          v-if="showTabsIcon"
          type="left"
          :style="{ cursor: isPreClick ? 'not-allowed' : 'pointer' }"
          @click="goback"
        />
        <div
          id="tree-tabs-list"
          class="tree-tabs-list"
          @mousewheel="divMousewheel"
        >
          <span
            v-for="item in dataCatalogTabData"
            :id="item.guid"
            :key="item.guid"
            :class="{ 'active': activeTreeTab === item.guid }"
            @click="treeTabChange(item.guid)"
            >{{ item.name }}</span
          >
        </div>

        <a-popover placement="rightTop" overlay-class-name="tabs-detail-list">
          <template slot="content">
            <div
              v-for="item in dataCatalogTabData"
              class="tabs-detail-info"
              :key="item.guid"
              :class="{ 'active': activeTreeTab === item.guid }"
              @click="srcollToSelect(item)"
            >
              {{ item.name }}
            </div>
          </template>
          <mapgis-ui-ant-icon
            v-if="showTabsIcon"
            type="right"
            :style="{ cursor: isSuffixClick ? 'not-allowed' : 'pointer' }"
            @click="goforward"
          />
        </a-popover>
      </div>
      <!-- <div class="tree-tabs-list">
        <mapgis-ui-tabs
          v-show="
            showType === 'tabs' &&
            isChangeDataCatalog &&
            dataCatalogTabData.length > 0
          "
          v-model="activeTreeTab"
          @change="treeTabChange"
        >
          <mapgis-ui-tab-pane
            v-for="item in dataCatalogTabData"
            :key="item.guid"
            :tab="item.name"
          />
        </mapgis-ui-tabs>
      </div> -->
      <mapgis-ui-tree
        checkable
        block-node
        :tree-data="dataCatalogTreeData"
        :replace-fields="replaceFields"
        v-model="checkedNodeKeys"
        :expanded-keys="expandedKeys"
        :filterTreeNode="searchValue !== '' ? filterTree : filterEmpty"
        :selectedKeys="selectedKeys"
        @expand="onExpand"
        @select="onSelect"
        @check="onCheck"
      >
        <span
          slot="custom"
          slot-scope="item"
          class="tree-item-handle"
          :class="[
            lastSelect === item.guid && !item.children ? 'check-light' : '',
          ]"
        >
          <div v-if="widgetInfo.config.iconConfig[nodeLevel(item)]">
            <i
              v-if="nodeIcon(item).isSvg"
              class="icon"
              v-html="nodeIcon(item).icon"
            >
            </i>
            <img v-else class="tree-item-icon" :src="nodeIcon(item).icon" />
          </div>

          <mapgis-ui-dropdown
            v-if="item.children && item.children.length > 0"
            :trigger="['contextmenu']"
          >
            <mapgis-ui-menu slot="overlay">
              <mapgis-ui-menu-item
                v-if="item.metaData && !isModelCacheLayer(item)"
                key="1"
                @click="showMetaDataInfo(item)"
              >
                元数据信息
              </mapgis-ui-menu-item>
              <mapgis-ui-menu-item
                v-if="!isNonSpatial(item) && !isDataFlow(item)"
                key="2"
                @click="onUploadLegend(item)"
              >
                上传图例
              </mapgis-ui-menu-item>
            </mapgis-ui-menu>
            <span class="tree-node" :id="`tree_${item.guid}`">
              <span
                v-if="
                  searchValue !== '' &&
                  item.name.toUpperCase().indexOf(searchValue.toUpperCase()) !==
                    -1
                "
              >
                <span class="unfilter-words" :title="item.description">
                  {{
                    item.name.substr(
                      0,
                      item.name.toUpperCase().indexOf(searchValue.toUpperCase())
                    )
                  }}
                </span>
                <span class="filter-words" :title="item.description">
                  {{
                    item.name.substr(
                      item.name
                        .toUpperCase()
                        .indexOf(searchValue.toUpperCase()),
                      searchValue.length
                    )
                  }}
                </span>
                <span class="unfilter-words" :title="item.description">
                  {{
                    item.name.substr(
                      item.name
                        .toUpperCase()
                        .indexOf(searchValue.toUpperCase()) + searchValue.length
                    )
                  }}
                </span>
              </span>
              <span v-else :title="item.description"
                >{{ item.name
                }}<span class="total-text">{{
                  `${getLeafStatus(item)}`
                }}</span></span
              >
            </span>
          </mapgis-ui-dropdown>
          <mapgis-ui-dropdown
            v-else
            :trigger="['contextmenu']"
            :class="
              searchValue !== '' &&
              item.name.toUpperCase().indexOf(searchValue.toUpperCase()) !== -1
                ? 'filter-dropdown'
                : ''
            "
            :id="`tree_${item.guid}`"
          >
            <mapgis-ui-tooltip>
              <template slot="title">
                {{ getLeafTooltip(item) }}
              </template>
              <span
                v-if="
                  searchValue !== '' &&
                  item.name.toUpperCase().indexOf(searchValue.toUpperCase()) !==
                    -1
                "
              >
                <span class="unfilter-words" :title="item.description">
                  {{
                    item.name.substr(
                      0,
                      item.name.toUpperCase().indexOf(searchValue.toUpperCase())
                    )
                  }}
                </span>
                <span class="filter-words" :title="item.description">
                  {{
                    item.name.substr(
                      item.name
                        .toUpperCase()
                        .indexOf(searchValue.toUpperCase()),
                      searchValue.length
                    )
                  }}
                </span>
                <span class="unfilter-words" :title="item.description">
                  {{
                    item.name.substr(
                      item.name
                        .toUpperCase()
                        .indexOf(searchValue.toUpperCase()) + searchValue.length
                    )
                  }}
                </span>
              </span>
              <span v-else @click="onClick(item)" :title="item.description">{{
                item.name
              }}</span>
            </mapgis-ui-tooltip>
            <mapgis-ui-menu slot="overlay">
              <mapgis-ui-menu-item
                v-if="
                  item.serverType &&
                  !isNonSpatial(item) &&
                  !isDataFlow(item) &&
                  !isModelCacheLayer(item)
                "
                key="1"
                @click="showMetaDataInfo(item)"
              >
                元数据信息
              </mapgis-ui-menu-item>
              <mapgis-ui-menu-item
                v-if="!isNonSpatial(item) && !isDataFlow(item)"
                key="3"
                @click="onUploadLegend(item)"
              >
                上传图例
              </mapgis-ui-menu-item>
            </mapgis-ui-menu>
          </mapgis-ui-dropdown>
        </span>
      </mapgis-ui-tree>
    </div>
    <mapgis-ui-modal
      v-model="showUploader"
      :dialog-style="{ top: '150px' }"
      :width="300"
      :mask="false"
      title="上传图例"
      :footer="null"
    >
      <mapgis-ui-alert
        message="建议上传宽高比为1:1的图片"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />
      <mapgis-ui-upload
        name="file"
        accept=".jpg, image/*"
        :action="uploadUrl"
        :multiple="false"
        method="post"
        :withCredentials="true"
        :before-upload="beforeUpload"
        @change="onChangeFile"
      >
        <mapgis-ui-button>
          <mapgis-ui-iconfont
            type="mapgis-upload"
            :style="{ fontSize: '18px' }"
          />
          上传图片
        </mapgis-ui-button>
      </mapgis-ui-upload>
    </mapgis-ui-modal>

    <mp-window-wrapper :visible="showMetaData">
      <mp-window
        title="元数据信息"
        :is-full-screen="true"
        :shrinkAction="false"
        :fullScreenAction="false"
        :icon="widgetInfo.icon"
        :visible.sync="showMetaData"
        :zIndex="2"
      >
        <template>
          <mp-metadata-info
            :currentConfig="currentConfig"
            :currentOGCMetadata="currentOGCMetadata"
          />
        </template>
      </mp-window>
    </mp-window-wrapper>

    <mp-window-wrapper :visible="showNoSpatial">
      <mp-window
        title="非空间数据"
        :is-full-screen="true"
        :shrinkAction="false"
        :fullScreenAction="false"
        :icon="widgetInfo.icon"
        :visible.sync="showNoSpatial"
        :zIndex="2"
      >
        <template>
          <non-spatial
            :nonSpatialUrl="nonSpatialUrl"
            :url="nonSpatialFileListUrl"
            :type="nonSpatialType"
            :treeConfig="widgetConfig"
            :dataType="dataType"
          ></non-spatial>
        </template>
      </mp-window>
    </mp-window-wrapper>
    <mapgis-ui-mask
      :loading="loading"
      :showSvg="true"
      text="Loading..."
      parentDivClass="mp-map-container"
    ></mapgis-ui-mask>
  </div>
</template>

<script lang="ts">
import {
  AppManager,
  WidgetMixin,
  Document,
  Map,
  LayerType,
  ModelCacheFormat,
  LoadStatus,
  Metadata,
  Layer3D,
  FitBound,
  dataCatalogManagerInstance,
  DataCatalogManager,
  api,
  eventBus,
  events,
  DataFlowList,
  LayerAutoResetManager,
  DataCatalogCheckController,
  LayerPropertyEdit,
  BaseMapController,
  baseConfigInstance,
  DataCatalogUtil,
  LayerFeatureEdit,
} from '@mapgis/web-app-framework'
import MpMetadataInfo from '../../../components/MetadataInfo/MetadataInfo.vue'
import NonSpatial from './non-spatial.vue'
import { lineString } from '@turf/helpers'
import bbox from '@turf/bbox'
import { defaultDataIconsConfig } from '../../../theme/dataIconsConfig.js'

export default {
  name: 'MpDataCatalog',
  mixins: [WidgetMixin],
  components: {
    MpMetadataInfo,
    NonSpatial,
  },
  data() {
    return {
      // 搜索框输入值
      searchValue: '',

      // 记录上一次搜索值
      lastSearchVal: '',

      // 包含搜索关键字的树节点key组成的数组
      hasKeywordArr: [],

      // 高亮搜索节点的下标
      searchIndex: -1,

      // 展开的树节点
      expandedKeys: [],

      // 数据目录树树据
      dataCatalogTreeData: [],

      // 将数据目录转换为一维数组
      allTreeDataConfigs: [],

      // 替换treeNode中的title、key字段为treeData中对应的字段
      replaceFields: {
        title: 'name',
        key: 'guid',
      },

      // 目录树中选中的节点的id列表。
      checkedNodeKeys: [],

      // 目录树中上次选中的节点的id列表
      preCheckedNodeKeys: [],

      dataCatalogManager: dataCatalogManagerInstance,

      // 是否显示元数据信息窗口
      showMetaData: false,

      // 元数据信息组件Props值
      currentConfig: {},

      // 图片上传器的显隐
      showUploader: false,

      // 上传地址
      uploadUrl: '',

      // 上传图例的节点
      legendNode: {},

      // 非空间数据窗口的显隐
      showNoSpatial: false,

      // 获取当前选种的非空间数据资源列表url
      nonSpatialFileListUrl: '',

      // 非空间数据资源url
      nonSpatialUrl: '',

      // 非空间数据类型(文档数据、图片数据、...)
      nonSpatialType: '',

      // 目录树配置
      widgetConfig: {},

      // 服务叠加节点
      imposeNode: {},

      // 目录树更多按钮展示/隐藏
      isChangeDataCatalog: true,

      // 存放数据目录勾选key
      checkedNodeKeysCopy: [],

      // 是否是取消扩展图层标识
      extendLayerRemove: false,
      // 数据目录tab展示页
      dataCatalogTabData: [],
      // dataCatalogTreeData备份供tab切换使用
      dataCatalogTreeDataCopy: [],
      // 当前选中tab
      activeTreeTab: '',
      // 当前选中的key
      activeKey: '',
      // 目录树分类展示下的左右移动箭头
      showTabsIcon: true,
      // 目录树分类展示下的左移动箭头是否可点击
      isPreClick: false,
      // 目录树分类展示下的右移动箭头是否可点击
      isSuffixClick: false,
      // 记录每个tabs中勾选的key
      activeTreeTabRelRelation: {},
      // 目录树分类展示下的勾选标识
      setKeys: false,
      // 滚动距离
      scrollLeft: 0,
      // 图层勾选跳转管理类
      layerAutoResetManager: LayerAutoResetManager,
      // 扩展图层id数组
      extendLayerRemoveIds: [],
      // 最后一次点击的节点，用于高亮
      lastSelect: '',
      // 存储节点的id与节点的下级节点数量的对应关系
      leafLengthMap: {},
      // 保存OGC元数据信息
      currentOGCMetadata: {},
      // 非空间数据的数据类型
      dataType: undefined,
      // 图层加载时的loading状态
      loading: false,
    }
  },
  computed: {
    // 设置选中的树节点
    selectedKeys() {
      if (this.hasKeywordArr.length > 0 && this.searchIndex !== -1) {
        return [this.hasKeywordArr[this.searchIndex]]
      }
      return []
    },
    // 获取节点在目录树中的级别
    nodeLevel() {
      return function (node) {
        return node.pos.split('-').length - 1
      }
    },
    // 是否使用分类展示
    isClassify() {
      return this.widgetInfo.config.otherConfig.isClassify
    },
    // 勾选的图层节点id
    checkKeys() {
      return this.dataCatalogManager.checkedLayerConfigIDs
    },
    // 单次可勾选的最大数量
    selectedMaxCount() {
      return this.widgetInfo.config.otherConfig.selectedMaxCount || 20
    },
  },
  created() {
    this.$message.config({
      top: '100px',
      duration: 2,
      maxCount: 1,
    })
    // 获取目录树配置
    this.widgetConfig = this.widgetInfo.config
  },
  async mounted() {
    this.uploadUrl = `${this.baseUrl}/${this.appProductName}/rest/services/system/ResourceServer/files/pictures`

    // 使用新的app.json中的规范，判断this.application.data是否有且有值就替换this.widgetInfo.config.treeConfig.treeData
    if (this.application.data && this.application.data.length > 0) {
      this.widgetInfo.config.treeConfig.treeData = this.application.data
    }

    // 初始化目录树数据
    this.dataCatalogManager.init(this.widgetInfo.config)
    // 是否对图层节点进行过滤
    const filtTree = this.widgetInfo.config.otherConfig.filtTree || false
    // 组装目录树数据
    this.dataCatalogTreeData =
      await this.dataCatalogManager.getDataCatalogTreeData(filtTree)
    const _allTreeDataConfigs = []
    const { treeData, allTreeDataConfigs } = this.handleTreeData(
      this.dataCatalogTreeData,
      _allTreeDataConfigs
    )
    this.dataCatalogTreeData = treeData
    // 记录将目录树转化为一维数组的所有数据
    this.allTreeDataConfigs = allTreeDataConfigs
    // 目录树分类展示
    if (this.isClassify) {
      this.dataCatalogTreeDataCopy = treeData
      this.dataCatalogTabData = this.getTabsData(treeData)
      // 分类展示默认选中的tab
      this.activeTreeTab =
        this.dataCatalogTabData.length > 0
          ? this.dataCatalogTabData[0].guid
          : ''
      this.activeTreeTab && this.treeTabChange(this.activeTreeTab)
    }

    // 初始化加载图层
    this.initLoadKeys()
    // 初始化存储点击跳转图层
    this.initLocationKeys()

    // 监听tree-tabs-list，当面板宽度超过scrollWidth取消前后处的箭头
    const targetNode = document.getElementById('tree-tabs-list')
    this.observeTab = new ResizeObserver(() => {
      if (targetNode != null) {
        // 控制前后处箭头的显隐
        this.showTabsIcon = targetNode.scrollWidth > targetNode.clientWidth
        this.computedIconClick(targetNode)
      }
    }).observe(targetNode)

    // 接收三维图层加载完成时发送的事件
    this.$root.$on(events.SCENE_LOADED_ON_MAP, this.sceneLoadedCallback)
    // 发送数据目录微件配置信息的事件
    eventBus.$emit(events.DATA_CATALOG_DATA_INFO, this.widgetConfig)
    // 接收扩展图层移除事件
    eventBus.$on(events.EXTEND_LAYER_REMOVE, this.changeCheckedKeys)
    // 接收目录树节点勾选/取消勾选变化事件
    eventBus.$on(events.DATA_CATALOG_CHANGE_NODES, this.dataCatalogChangeNodes)
    // 接收目录树勾选节点事件
    eventBus.$on(events.DATA_CATALOG_CHECK_NODES, this.dataCatalogCheckNodes)
  },
  watch: {
    // 监听目录树节点变化
    checkedNodeKeys: {
      deep: false,
      handler() {
        this.onCheckedNodeKeysChanged()
      },
    },
    // 监听dataCatalogManagerInstance管理类中记录的目录树勾选id的变化
    'dataCatalogManager.checkedLayerConfigIDs': {
      deep: false,
      handler() {
        this.onCheckedLayerConfigIDsChanged()
      },
    },
  },
  methods: {
    // 获取图层节点的服务类型
    getLeafTooltip(item) {
      const text = item.name
      let str
      if (item.serverType !== undefined) {
        switch (item.serverType) {
          case LayerType.IGSMapImage:
            str = '地图服务'
            break
          case LayerType.IGSTile:
            str = '栅格瓦片服务'
            break
          case LayerType.IGSVector:
            str = '图层地图服务'
            break
          case LayerType.VectorTile:
            str = '矢量瓦片服务'
            break
          case LayerType.IGSPanoramic:
            str = 'IGSPanoramic服务'
            break
          case LayerType.DataFlow:
            str = '数据流服务'
            break
          case LayerType.IGSScene:
            str = '场景服务'
            break
          case LayerType.ModelCache:
            str = 'M3D服务'
            if (!!item.customParameters && item.customParameters.length > 0) {
              item.customParameters.forEach((param) => {
                if (!!param.format && param.format === 'cesium3dTileset') {
                  str = '3DTiles服务'
                }
              })
            }
            break
          case LayerType.ArcGISMapImage:
            str = 'ArcGIS地图服务'
            break
          case LayerType.ArcGISTile:
            str = 'ArcGIS瓦片服务'
            break
          case LayerType.OGCWMS:
            str = 'WMS服务'
            break
          case LayerType.OGCWMTS:
            str = 'WMTS服务'
            break
          case LayerType.OGCWFS:
            str = 'WFS服务'
            break
          case LayerType.GeoJson:
            str = 'GEOJSON'
            break
          case LayerType.TILE3D:
            str = '3DTiles'
            break
          case LayerType.STKTerrain:
            str = 'STK地形'
            break
          case LayerType.Plot:
            str = '标绘图层'
            break
          case LayerType.KML:
            str = 'KML'
            break
          case LayerType.KMZ:
            str = 'KMZ'
            break
          case LayerType.CZML:
            str = 'CZML'
            break
          case LayerType.OSM:
            str = 'OSM'
            break
          default:
            break
        }
      }
      if (str && str.length > 0) {
        return `${text}：${str}`
      }
      return text
    },
    // 获取目录树各级节点对应的图标
    nodeIcon(item) {
      let icon
      if (item.serverType !== undefined) {
        const { useLocalDataNodeIcon, dataNodeIcon } =
          this.widgetConfig.treeConfig
        if (
          useLocalDataNodeIcon !== undefined &&
          !useLocalDataNodeIcon &&
          dataNodeIcon !== undefined
        ) {
          return {
            isSvg: dataNodeIcon && dataNodeIcon.indexOf('<svg') >= 0,
            icon: dataNodeIcon,
          }
        }
        let { serviceIcons } = this.application.baseConfig
        if (!serviceIcons || serviceIcons.length == 0) {
          serviceIcons = defaultDataIconsConfig.serviceIcons
        }
        for (let i = 0; i < serviceIcons.length; i++) {
          for (let j = 0; j < serviceIcons[i].children.length; j++) {
            const child = serviceIcons[i].children[j]
            if (LayerType[child.serviceType] === item.serverType) {
              // 模型缓存包含3dtiles
              const formatType = this.getFormatType(item.customParameters)
              if (!formatType) {
                icon = child.icon
              } else {
                icon = this.findFormatTypeIcon(formatType, serviceIcons)
              }
              if (icon.startsWith('/file')) {
                icon = `${this.baseUrl}/${this.appProductName}${icon}`
              }

              return {
                isSvg: icon && icon.indexOf('<svg') >= 0,
                icon,
              }
            }
          }
        }
      }
      if (
        this.widgetInfo.config.iconConfig[this.nodeLevel(item)].startsWith(
          '/file'
        )
      ) {
        icon = `${this.baseUrl}/${this.appProductName}${
          this.widgetInfo.config.iconConfig[this.nodeLevel(item)]
        }`
      } else {
        icon =
          this.baseUrl + this.widgetInfo.config.iconConfig[this.nodeLevel(item)]
      }

      return { isSvg: icon && icon.indexOf('<svg') >= 0, icon }
    },
    getFormatType(customParameters) {
      let type
      customParameters.forEach((item) => {
        if (
          ModelCacheFormat[item.format] === ModelCacheFormat.cesium3dTileset
        ) {
          type = 'TILE3D'
        }
      })
      return type
    },
    findFormatTypeIcon(type, serviceIcons) {
      let icon
      serviceIcons.forEach((item) => {
        if (item.children) {
          item.children.forEach((child) => {
            if (
              child.serviceType === type ||
              LayerType[child.serviceType] === type
            ) {
              icon = child.icon
            }
          })
        }
      })
      return icon
    },
    onClose() {
      this.currentNode = null
    },
    initLoadKeys() {
      // 获取所有图层节点
      const allLayerNodes = this.dataCatalogManager.getAllLayerConfigItems()
      // 获取初始化需要加载的图层id数组
      const initKeys =
        DataCatalogCheckController.getInitLoadLayerKeys(allLayerNodes)
      // 勾选对应的图层节点
      this.dataCatalogChangeNodes(initKeys, true)
    },
    initLocationKeys() {
      // 获取所有图层节点
      const allLayerNodes = this.dataCatalogManager.getAllLayerConfigItems()
      // 设置勾选目录树后需要自动定位到图层所在位置的节点id数组到layerAutoResetManager类中
      this.layerAutoResetManager.dealLocationArr(allLayerNodes)
    },
    // 控制数据目录图层节点勾选
    dataCatalogCheckNodes(keys, checkKeysRelation) {
      // 清空已勾选的图层节点
      if (this.checkedNodeKeys && this.checkedNodeKeys.length > 0) {
        this.dataCatalogCheckNode([], {})
      }

      // 设置需要勾选的图层节点
      setTimeout(() => {
        this.dataCatalogCheckNode(keys, checkKeysRelation)
      }, 1000)
    },
    dataCatalogCheckNode(keys, checkKeysRelation) {
      // 清空勾选节点
      this.checkedNodeKeys = []
      // 目录树分类展示时记录各tab项中的节点勾选关系
      if (this.isClassify) {
        this.activeTreeTabRelRelation = checkKeysRelation
      }
      // 通过该方法添加的图层id记录到layerAutoResetManager类中，勾选后不会执行自动定位到图层所在位置的逻辑
      this.layerAutoResetManager.setUnAutoResetArr(keys)
      // 对checkedNodeKeys重新赋值
      this.checkedNodeKeys = keys
    },
    // 获取当前的目录树结构
    getCurrentData() {
      let currentData = []
      if (this.isClassify) {
        Object.keys(this.activeTreeTabRelRelation).forEach((key) => {
          if (
            this.activeTreeTabRelRelation[key] &&
            this.activeTreeTabRelRelation[key].length > 0
          ) {
            const parent = this.dataCatalogTabData.find(
              (item) => item.guid === key
            )
            currentData.push(parent)
          }
        })
      } else {
        currentData = this.dataCatalogTreeData
      }
      return currentData
    },
    onCheckedNodeKeysChanged() {
      // 列表展示赋值key不需要再次处理
      if (this.setKeys) {
        this.setKeys = !this.setKeys
        return
      }

      // 获取勾选的数据，图例使用
      eventBus.$emit(
        events.DATA_SELECTION_KEYS_CHANGE_EVENT,
        this.getDataCatalogCheckedNodeKeys()
      )

      // 扩展图层在相关的微件中移除，勾选取消即可，此处不做其他处理
      if (this.extendLayerRemove) {
        this.extendLayerRemove = !this.extendLayerRemove
        this.preCheckedNodeKeys = [...this.checkedNodeKeys]
        this.filterRemoveKeys(this.extendLayerRemoveIds)
        this.extendLayerRemoveIds = []
        return
      }
      // 新增勾选的图层节点id数组
      let newChecked = []
      // 取消勾选的图层节点id数组
      let newUnChecked = []

      if (this.isChangeDataCatalog && !this.isClassify) {
        if (this.preCheckedNodeKeys.length === 0) {
          newChecked = this.checkedNodeKeys
        } else if (this.checkedNodeKeys.length === 0) {
          newUnChecked = this.preCheckedNodeKeys
        } else {
          // 计算哪些是新选中的,哪些时新取消选中的。

          // 查找新选中的(在之前的选中中没有,在当前的选中中有)
          for (let i = 0; i < this.checkedNodeKeys.length; i++) {
            let isFind = false
            for (let j = 0; j < this.preCheckedNodeKeys.length; j++) {
              if (this.checkedNodeKeys[i] === this.preCheckedNodeKeys[j]) {
                isFind = true
                break
              }
            }

            if (!isFind) {
              newChecked.push(this.checkedNodeKeys[i])
            }
          }

          // 查找新取消选中的(在之前的选中中有,在当前的选中中没有)
          for (let i = 0; i < this.preCheckedNodeKeys.length; i++) {
            let isFind = false
            for (let j = 0; j < this.checkedNodeKeys.length; j++) {
              if (this.preCheckedNodeKeys[i] === this.checkedNodeKeys[j]) {
                isFind = true
                break
              }
            }

            if (!isFind) {
              newUnChecked.push(this.preCheckedNodeKeys[i])
            }
          }
        }
        // 给dataCatalogManager中的变量赋值
        const checkedLayerConfigIDs = this.getCheckedLayerConfigIDs()

        // 如果两者不相等则重新赋值
        if (
          this.dataCatalogManager.checkedLayerConfigIDs.toString() !==
          checkedLayerConfigIDs.toString()
        ) {
          this.dataCatalogManager.checkedLayerConfigIDs = checkedLayerConfigIDs
        }
      } else if (this.isChangeDataCatalog && this.isClassify) {
        const allCheckedKeys = this.getDataCatalogCheckedNodeKeys()
        if (this.preCheckedNodeKeys.length === 0) {
          newChecked = this.checkedNodeKeys
        } else if (allCheckedKeys.length === 0) {
          newUnChecked = this.preCheckedNodeKeys
        } else {
          // 计算哪些是新选中的,哪些时新取消选中的。

          // 查找新选中的(在之前的选中中没有,在当前的选中中有)
          newChecked = allCheckedKeys.filter(
            (item) => !this.preCheckedNodeKeys.includes(item)
          )

          // 查找新取消选中的(在之前的选中中有,在当前的选中中没有)
          newUnChecked = this.preCheckedNodeKeys.filter(
            (item) => !allCheckedKeys.includes(item)
          )
        }

        // 如果两者不相等则重新赋值
        if (
          this.dataCatalogManager.checkedLayerConfigIDs.toString() !==
          allCheckedKeys.toString()
        ) {
          this.dataCatalogManager.checkedLayerConfigIDs = allCheckedKeys
        }
        // 给this.checkedNodeKeys赋值
        this.checkedNodeKeys = allCheckedKeys
        this.setKeys = true
      }

      // 将新取消选中的图层从document中移除
      this.modifyDocument(newUnChecked, false)

      if (
        newChecked.length > 0 &&
        this.currentNode &&
        this.leafLengthMap[this.currentNode.guid] > this.selectedMaxCount
      ) {
        this.$message.error(
          `添加失败，当前一次允许添加最大节点数为${this.selectedMaxCount}`
        )

        // 清除选中的节点check状态
        newChecked.forEach((item) => {
          this.checkedNodeKeys = this.getCheckedLayerConfigIDs(item)
        })
        return
      }
      // 将新选中的图层节点添加到document
      this.modifyDocument(newChecked, true)

      // 修改说明：原有代码赋址属于浅拷贝，指向同一内存地址，checkedNodeKeys变化时preCheckedNodeKeys也会变化，这样preCheckedNodeKeys就无法记录上一次勾选的checkedNodeKeys。
      // 修改人：何龙 2021年04月21日
      this.preCheckedNodeKeys = this.getDataCatalogCheckedNodeKeys()
    },
    onCheckedLayerConfigIDsChanged() {
      // 如果两者不相等则重新赋值
      if (
        this.dataCatalogManager.checkedLayerConfigIDs.toString() !==
        this.getCheckedLayerConfigIDs().toString()
      ) {
        this.checkedNodeKeys = this.dataCatalogManager.checkedLayerConfigIDs
      }
      // 将checkedNodeKeys的值记录到DataCatalogCheckController类中
      DataCatalogCheckController.setCheckKeys(this.checkedNodeKeys)
      // 将当前目录树数据记录到DataCatalogCheckController类中
      DataCatalogCheckController.setCheckData(this.getCurrentData())
    },
    getCheckedLayerConfigIDs(id) {
      let checkedLayerConfigIDs = []
      // 获取当前勾选的图层节点id数组
      const allCheck = this.isClassify
        ? this.getDataCatalogCheckedNodeKeys()
        : this.checkedNodeKeys
      allCheck.forEach((key) => {
        // 根据id找到图层节点
        const layerConfig = this.dataCatalogManager.getLayerConfigByID(key)

        if (layerConfig) checkedLayerConfigIDs.push(key)
      })

      if (id) {
        // 从勾选的图层节点id数组中移除符合条件的id
        checkedLayerConfigIDs = checkedLayerConfigIDs.filter(
          (item) => item !== id
        )
      }
      return checkedLayerConfigIDs
    },
    modifyDocument(nodekeys, isChecked) {
      // 获取选中节点中的图层节点。
      const layerConfigNodeList: [] = []
      nodekeys.forEach((key) => {
        // 根据id获取图层节点
        const layerConfig = this.dataCatalogManager.getLayerConfigByID(key)
        if (layerConfig) {
          layerConfigNodeList.push(layerConfig)
        }
      })
      if (layerConfigNodeList.length > 0) {
        // 选中节点中保含有图层节点
        const doc: Document = this.document
        const checkedNodeKeys: string[] = this.checkedNodeKeys

        if (isChecked) {
          // 获取到所有图层对象
          const promiseAll = []
          for (let i = 0; i < layerConfigNodeList.length; i++) {
            const layerConfigNode = layerConfigNodeList[i]
            // 将图层节点对象转为图层对象
            promiseAll.push(this.generateLayer(layerConfigNode))
          }
          Promise.all(promiseAll).then((result) => {
            const appendLayer = []
            // 调整图层顺序
            layerConfigNodeList.forEach((item) => {
              if (item) {
                const sortLayer = result.find((layer) => layer.id === item.guid)
                sortLayer && appendLayer.push(sortLayer)
              }
            })
            // 将图层对象添加到document中
            appendLayer.forEach((item) => {
              doc.defaultMap.add(item)
            })
          })
        } else {
          layerConfigNodeList.forEach((layerConfigNode) => {
            // 如果是扩展图层只需要发送eventBus事件
            if (
              Object.prototype.hasOwnProperty.call(
                layerConfigNode,
                'serverType'
              ) &&
              !layerConfigNode.serverType
            ) {
              eventBus.$emit(
                events.DATA_CATALOG_EXTEND_DATA_UNCHECK,
                layerConfigNode
              )
              return
            }
            // 如果是取消选中了节点
            // 1.通过节点的id,将图层从document中移除。
            doc.defaultMap.remove(
              doc.defaultMap.findLayerById(layerConfigNode.guid)
            )
          })
        }

        // 发送勾选/取消勾选的图层节点信息
        layerConfigNodeList.forEach((item) => {
          eventBus.$emit(events.DATA_SELECTION_CHANGE_EVENT, item, isChecked)
        })
      }
    },
    async generateLayer(layerConfigNode) {
      // 如果是扩展图层，直接发送事件
      if (
        Object.prototype.hasOwnProperty.call(layerConfigNode, 'serverType') &&
        !layerConfigNode.serverType
      ) {
        eventBus.$emit(events.DATA_CATALOG_EXTEND_DATA_CHECK, layerConfigNode)
        return
      }
      // 如果是选中了节点
      // 1.根据图层节点的配置,生成定义的图层对象.
      const layer = DataCatalogManager.generateLayerByConfig(layerConfigNode)
      // 设置目录树中节点的title
      layer.description = this.setDescription(layer)

      // 2.将图层添加到全局的document中。
      if (layer) {
        // 将目录树对应节点设置为不可勾选
        const recordCheckLayer = this.disableTreeNodeCheckBox(layer.id)
        // 2.1加载图层
        try {
          if (layer.loadStatus === LoadStatus.notLoaded) {
            await layer.load()
          }
        } catch (error) {
        } finally {
          // 2.2判断图层是否载成功。如果成功则将图层添加到documet中。否则，给出提示，并将数据目录树中对应的节点设为未选中状态。
          if (layer.loadStatus === LoadStatus.loaded) {
            // 判断layer的类型是否为矢量地图、图层底图、geojson类型数据，若为此类型则需要处理配置的样式
            if (
              [
                LayerType.IGSMapImage,
                LayerType.GeoJson,
                LayerType.IGSVector,
              ].includes(layer.type)
            ) {
              // 将sublayers中的子图层都进行处理,前提是管理平台配置了样式
              const featureStyle = layer.extend?.featureStyle
              // 未配置样式的图层正常加载
              if (featureStyle) {
                // 设置配置样式
                LayerFeatureEdit.operateFeatureRelation(
                  layer.type,
                  layer.allSublayers ? layer.allSublayers : [layer],
                  layer.url,
                  featureStyle || {}
                )
              }
            }
            // 如果处于收藏夹复现则无需设置修改的layerProperty信息
            const currentCheckLayerConfig =
              DataCatalogCheckController.getCurrentCheckLayerConfig()
            const relation = currentCheckLayerConfig?.relation
            // 是否属于收藏夹
            const isFavoritesLayer = relation && relation[layer.id]

            // 还原已修改过的layerProperty信息（非收藏夹场景复现）
            if (this.is3DLayer(layer) && !isFavoritesLayer) {
              const editConfigArr = LayerPropertyEdit.propertyConfigArr
              if (editConfigArr && editConfigArr.length > 0) {
                const find = editConfigArr.find(
                  (item) => item.parentId === layer.id
                )
                find && this.dealLayers(layer, find)
              }
            }
            // 收藏夹复现处理opacity和layerProperty
            DataCatalogCheckController.dealLayers(layer, this.is3DLayer(layer))
            // 获取不会自动定位到图层所在位置的图层id
            const unAutoResetArr =
              this.layerAutoResetManager.getUnAutoResetArr()
            if (
              this.is3DLayer(layer) &&
              this.is2DMapMode &&
              !unAutoResetArr.includes(layer.id)
            ) {
              // 处于二维模式时切换到三维模式
              this.switchMapMode()
            }

            // 二维图层如果配置了extend中的location为true则在加载后要执行缩放至操作，三维图层的跳转逻辑则在WebScenePro组件中通过autoReset控制是否跳转
            if (!this.is3DLayer(layer)) {
              const autoResetArr =
                this.layerAutoResetManager.getInitLayerAutoResetArr()

              if (
                autoResetArr.includes(layer.id) &&
                !unAutoResetArr.includes(layer.id)
              ) {
                // 三维模式下的二维图层若extend中的engineType为Mapbox则不加载也不做跳转
                const engineType = layer.extend?.engineType
                if (this.is2DMapMode) {
                  if (
                    ['All', 'Mapbox', 'Leaflet', 'Openlayers'].includes(
                      engineType
                    ) ||
                    !engineType
                  ) {
                    setTimeout(() => {
                      this.fitBounds(layer, this.getDataFlowExtent(layer))
                    }, 1000)
                  }
                } else {
                  // 三维模式下加载的图层设置了engineType属性为二维展示时，不做跳转操作
                  if (
                    !['Mapbox', 'Leaflet', 'Openlayers'].includes(engineType)
                  ) {
                    setTimeout(() => {
                      this.fitBounds(layer, this.getDataFlowExtent(layer))
                    }, 1000)
                  }
                }
              }
            }
          } else {
            this.$message.error(`图层:${layer.title}加载失败`)
            if (this.is3DLayer(layer)) {
              // 图层加载完毕，恢复checkbox可选状态
              this.setCheckBoxEnable(recordCheckLayer, false)
            }
            // checkedNodeKeys.splice(layer.id)
            // 清除选中的节点check状态
            this.checkedNodeKeys = this.getCheckedLayerConfigIDs(layer.id)
            // 分类展示情况下清除选中的节点check状态
            this.filterCheckNodeKeys()
          }
          if (!this.is3DLayer(layer)) {
            // 图层加载完毕，恢复checkbox可选状态
            this.setCheckBoxEnable(recordCheckLayer, false)
          }
        }
        return layer.loadStatus === LoadStatus.loaded ? layer : null
      }
    },
    // 分类展示情况下清除选中的节点check状态
    filterCheckNodeKeys() {
      if (this.isClassify) {
        if (this.checkedNodeKeys.length === 0) {
          this.activeTreeTabRelRelation = {}
        } else {
          Object.keys(this.activeTreeTabRelRelation).forEach((key) => {
            this.activeTreeTabRelRelation[key] = this.activeTreeTabRelRelation[
              key
            ].filter((item) => this.checkedNodeKeys.includes(item))
          })
        }
      }
    },
    // 处理图层layerProperty属性
    dealLayers(layer, config) {
      let sublayers
      if (this.isIGSScene(layer)) {
        if (layer.activeScene) {
          sublayers = layer.activeScene.sublayers
        }
      } else {
        // sublayers = layer.sublayers
      }

      if (sublayers && sublayers.length > 0) {
        const sublayer = sublayers.find((item) => item.id === config.id)
        sublayer.maximumScreenSpaceError =
          config.layerProperty.maximumScreenSpaceError
        sublayer.luminanceAtZenith = config.layerProperty.luminanceAtZenith
        sublayer.layer.layerProperty = { ...config.layerProperty }
      } else {
        layer.maximumScreenSpaceError =
          config.layerProperty.maximumScreenSpaceError
        layer.luminanceAtZenith = config.layerProperty.luminanceAtZenith
        layer.layerProperty = { ...config.layerProperty }
      }
    },
    // 判断是不是三维场景服务图层类型
    isIGSScene({ type, layer }) {
      let layerType = type
      if (layer) {
        layerType = layer.type
      }
      return layerType === LayerType.IGSScene
    },

    // 判断是不是三维图层类型
    is3DLayer(layer) {
      if (layer instanceof Layer3D) {
        return true
      }
      return false
    },
    /**
     * 当加载图层时，图层还在请求，禁用数据目录的checkbox
     * @id 勾选图层的id
     */
    disableTreeNodeCheckBox(id) {
      const layer = this.findTreeNodeConfigById(id)
      if (layer) {
        this.setCheckBoxEnable(layer, true)
      }
      // 这里直接返回查找到node，避免恢复checkbox状态时再去查找
      return layer
    },
    // 通过id去查找treeData对应配置项
    findTreeNodeConfigById(id) {
      let layer = null
      for (let index = 0; index < this.allTreeDataConfigs.length; index++) {
        const element = this.allTreeDataConfigs[index]
        if (id === element.guid) {
          layer = element
          break
        }
      }
      // 这里直接返回查找到node，避免恢复checkbox状态时再去查找
      return layer
    },

    /**
     * 三维图层需要判定图层是否加载到地图上，才能恢复checkbox可选状态，
     * 因为M3D加载到地图上需要时间，当用户快速点击会多次加载而产生bug
     */
    sceneLoadedCallback(id) {
      const layer = this.findTreeNodeConfigById(id)
      if (layer) {
        this.setCheckBoxEnable(layer, false)
      }
    },

    // 设置tree的checkbox是否可以点击
    setCheckBoxEnable(treeDataConfig, disable) {
      if (!disable) {
        this.loading = false
      }
      this.$set(treeDataConfig, 'disableCheckbox', disable)
    },
    // 设置节点的title提示信息
    setDescription(item) {
      const parentName = ''
      const arr = []
      if (this.dataCatalogTreeData)
        this.findParentName(item.id, parentName, this.dataCatalogTreeData, arr)

      if (arr.length > 0) {
        return arr[0]
      }
      return ''
    },
    // 组装节点description属性信息
    findParentName(id, parentName, dataCatalog, arr) {
      dataCatalog.forEach((item) => {
        let copy = parentName
        if (item.guid === id) {
          parentName += item.name
          arr.push(parentName)
        } else if (item.children) {
          copy += `${item.name}-`
          this.findParentName(id, copy, item.children, arr)
        }
      })
    },

    // 按需筛选树节点高亮显示（搜索内容不为空时筛选条件）
    filterTree(node) {
      return (
        node.dataRef.name
          .toUpperCase()
          .indexOf(this.searchValue.toUpperCase()) !== -1
      )
    },

    // 按需筛选树节点（搜索内容为空时筛选条件）
    filterEmpty() {},

    // 目录树展开/收起节点时触发
    onExpand(expandedKeys) {
      this.expandedKeys = expandedKeys
    },
    // 目录树节点勾选事件
    onCheck(checkedKeys, info) {
      // 当前节点信息
      this.currentNode = info.node.dataRef
      // 设置layerAutoResetManager类中记录的unAutoReset属性为空（收藏夹场景复现使用）
      this.layerAutoResetManager.setUnAutoResetArr([])
      // 如果是勾选状态则开启进度条
      if (info.checked) this.loading = true
      // 如果取消收藏夹中的图层则再次勾选不再使用收藏夹的记录状态
      !info.checked && DataCatalogCheckController.operateCheck(checkedKeys)
      // 保持分类展示情况下数据的同步
      if (this.isClassify) {
        const preCheckedKeys = this.activeTreeTabRelRelation[this.activeTreeTab]
        this.activeTreeTabRelRelation[this.activeTreeTab] = checkedKeys
      }
    },

    // 选中目录树节点触发展开/收起
    onSelect(selectedKeys, info) {
      // 将节点信息通过eventBus发送
      this.provideInformation(info.node)
      // 判断当前节点是否展开
      const flag = this.expandedKeys.includes(selectedKeys[0])
      // 通过节点的展开/收起状态让节点收起/展开
      if (flag) {
        this.expandedKeys = this.expandedKeys.filter(
          (item) => item !== selectedKeys[0]
        )
      } else {
        this.expandedKeys.push(selectedKeys[0])
      }
      // 图层跳转逻辑
      if (
        this.dataCatalogManager.checkedLayerConfigIDs.includes(selectedKeys[0])
      ) {
        const layer = this.document.defaultMap.findLayerById(selectedKeys[0])
        if (layer) {
          this.lastSelect = selectedKeys[0]
          // 三维图层在二维模式下需要先切换到三维模式
          if (this.is3DLayer(layer)) {
            this.is2DMapMode && this.switchMapMode()
          }
          setTimeout(() => {
            // 自动定位至图层所在位置
            this.fitBounds(layer, this.getDataFlowExtent(layer))
          }, 1000)
        }
      }
    },
    // 图层自动定位方法
    fitBounds(item, layeExtent) {
      const { Cesium, map, viewer, vueCesium } = this
      const isOutOfRange = FitBound.fitBoundByLayer(
        item,
        {
          Cesium,
          map,
          viewer,
          vueCesium,
        },
        this.is2DMapMode,
        layeExtent
      )
      if (isOutOfRange) {
        this.$message.error('地图范围有误，已调整为经纬度最大范围')
      }
    },
    // 获取流图层范围
    getDataFlowExtent(layerItem) {
      if (layerItem.type === LayerType.DataFlow) {
        // 获取当前流图层
        const dataList = DataFlowList.getDataFlowById(layerItem.id)
        // 处理流图层数据格式
        const lineArr = dataList.map((item) => {
          const {
            geometry: { coordinates },
          } = item
          return coordinates
        })
        // 获取流图层的边界范围
        const line = lineString(lineArr)
        const [xmin, ymin, xmax, ymax] = bbox(line)
        return {
          xmin,
          ymin,
          xmax,
          ymax,
        }
      }

      return undefined
    },

    // 取消扩展图层同步勾选
    changeCheckedKeys(ids) {
      this.extendLayerRemove = !this.extendLayerRemove
      this.extendLayerRemoveIds = ids
      this.dataCatalogManager.checkedLayerConfigIDs =
        this.dataCatalogManager.checkedLayerConfigIDs.filter(
          (item) => !ids.includes(item)
        )
      this.isClassify
        ? this.dataCatalogChangeNodesForClassify(ids, false)
        : this.dataCatalogChangeNodesForNormal(ids, false)
      DataCatalogCheckController.setCheckData(this.getCurrentData())
    },

    // 控制数据目录勾选/取消勾选节点
    dataCatalogChangeNodes(ids, isChecked) {
      this.isClassify
        ? this.dataCatalogChangeNodesForClassify(ids, isChecked)
        : this.dataCatalogChangeNodesForNormal(ids, isChecked)
      this.checkedNodeKeys = isChecked
        ? [
            ...new Set([
              ...this.dataCatalogManager.checkedLayerConfigIDs,
              ...ids,
            ]),
          ]
        : this.dataCatalogManager.checkedLayerConfigIDs.filter(
            (item) => !ids.includes(item)
          )
      // 将当前勾选的相关信息通过DataCatalogCheckController类记录
      DataCatalogCheckController.setCheckData(this.getCurrentData())
    },

    dataCatalogChangeNodesForClassify(ids, isChecked) {
      // 获取目录树所有节点
      const allTreeNodes = this.dataCatalogManager.getAllConfigItems()
      // 获取通过节点勾选变化后的目录树
      const treeData = DataCatalogCheckController.getDataCatalogRelation(
        ids,
        allTreeNodes
      )
      treeData.forEach((item) => {
        // 处理分类展示情况下节点勾选变化
        this.operateTabRelRelation(item, isChecked)
      })
    },

    dataCatalogChangeNodesForNormal(ids, isChecked) {
      if (isChecked) {
        // 排除ids中在数据目录中已勾选的id
        const checkIds = []
        ids.forEach((id) => {
          !this.dataCatalogManager.checkedLayerConfigIDs.includes(id) &&
            checkIds.push(id)
        })
        // 重新给this.dataCatalogManager.checkedLayerConfigIDs赋值，更新目录树节点勾选
        this.dataCatalogManager.checkedLayerConfigIDs = [
          ...this.dataCatalogManager.checkedLayerConfigIDs,
          ...checkIds,
        ]
      } else {
        this.dataCatalogManager.checkedLayerConfigIDs =
          this.dataCatalogManager.checkedLayerConfigIDs.filter(
            (item) => !ids.includes(item)
          )
      }
    },
    // 处理分类展示情况下节点勾选变化
    operateTabRelRelation(data, isAdd) {
      // 获取父节点
      const parent = data.find((item) => !item.parentId)
      const child = []
      // 获取所有子节点
      data.forEach((item) => {
        if (item.parentId) {
          child.push(item.guid)
        }
      })
      let currentCheckKeys
      // 判断是否是‘其他’分组的数据
      const relationKey = data.length > 1 ? parent.guid : 'ungrouped-data'
      // 获取当前展示的tab页中的勾选节点id
      if (data.length > 1) {
        currentCheckKeys = this.activeTreeTabRelRelation[parent.guid] || []
      } else {
        currentCheckKeys = this.activeTreeTabRelRelation['ungrouped-data'] || []
        // ‘其他’分组中的节点没有parentId，此处将该节点当子节点加入到‘其他’分组中
        data.forEach((item) => {
          child.push(item.guid)
        })
      }
      // 获取最新的勾选节点
      if (isAdd) {
        const newCheckKeys = [...new Set([...currentCheckKeys, ...child])]
        this.activeTreeTabRelRelation[relationKey] = newCheckKeys
      } else {
        if (currentCheckKeys.length > 0) {
          const newCheckKeys = currentCheckKeys.filter(
            (item) => !child.includes(item)
          )
          this.activeTreeTabRelRelation[relationKey] = newCheckKeys
        }
      }
    },

    // 筛选所有包含搜索关键字的节点
    hasKeyWord(tree: object[], keyword: string) {
      tree.forEach((item: any, index: number) => {
        if (item.name.toUpperCase().indexOf(keyword.toUpperCase()) !== -1) {
          this.expandedKeys.push(item.guid)
        }
        if (item.children && item.children.length > 0) {
          this.hasKeyWord(item.children, keyword)
        }
      })
    },

    // 获取所有包含关键字节点的父节点
    getAllKeys(tree: object[]) {
      const data: string[] = []
      for (let i = 0; i < tree.length; i++) {
        const node = tree[i]
        if (node.children) {
          const arr = this.getAllKeys(node.children)
          if (
            node.children.some(
              (item) => this.expandedKeys.includes(item.guid) === true
            ) ||
            arr.length > 0
          ) {
            this.expandedKeys.push(node.guid)
            data.push(node.guid)
          }
        }
      }
      return data
    },

    // 点击搜索或按下回车键时的回调
    onSearch(value) {
      this.expandedKeys = []
      const keyword: string = value
      if (keyword !== '') {
        // 递归展开所有和搜索条件的节点
        this.hasKeyWord(this.dataCatalogTreeData, keyword)
        this.hasKeywordArr = JSON.parse(JSON.stringify(this.expandedKeys))
        // 递归展开与搜索条件关联的上级节点
        this.getAllKeys(this.dataCatalogTreeData)
      } else {
        this.hasKeywordArr = []
      }
      // 搜索条件没有变化的情况下再次搜索时目录树滚动至下一个符合条件的搜索结果
      if (this.lastSearchVal === value) {
        if (!this.timer) {
          this.setSearchIndex()
        }
      } else {
        this.searchIndex = -1
        this.timer = setTimeout((_) => {
          this.setSearchIndex()
        }, 700)
      }
      this.lastSearchVal = value
    },

    // 跳转到包含搜索关键字的节点处
    setSearchIndex() {
      if (this.hasKeywordArr.length > 0) {
        if (this.searchIndex >= this.hasKeywordArr.length - 1) {
          this.searchIndex = 0
        } else {
          this.searchIndex++
        }
        const element = this.$el.querySelector(
          `#tree_${this.hasKeywordArr[this.searchIndex]}`
        )
        if (element) {
          // 滚动至对应元素
          element.scrollIntoView()
        }
        this.timer = null
      }
    },

    // 刷新按钮
    async refreshTree() {
      // 获取数据目录微件的配置信息
      const config = await api.getWidgetConfig('data-catalog')
      // 获取一张图的应用信息
      const appConfig = await AppManager.getInstance().getRequest()({
        url: this.application.appConfigPath,
        method: 'get',
      })

      // 使用新的app.json中的规范，判断this.application.data是否有且有值就替换this.widgetInfo.config.treeConfig.treeData
      if (appConfig.data && appConfig.data.length > 0) {
        config.treeConfig.treeData = appConfig.data
      }
      // 初始化数据目录
      this.dataCatalogManager.init(config)

      this.dataCatalogTreeData =
        await this.dataCatalogManager.getDataCatalogTreeData(true)
      const _allTreeDataConfigs = []
      // 组装tree组件展示需要的属性
      const { treeData, allTreeDataConfigs } = this.handleTreeData(
        this.dataCatalogTreeData,
        _allTreeDataConfigs
      )
      this.dataCatalogTreeData = treeData
      this.allTreeDataConfigs = allTreeDataConfigs
      if (this.isClassify) {
        this.dataCatalogTreeDataCopy = treeData
        this.dataCatalogTabData = this.getTabsData(treeData)
        this.activeTreeTab && this.treeTabChange(this.activeTreeTab)
      }
    },

    // 收藏按钮
    bookMarksCheck() {
      eventBus.$emit(events.DATA_CATALOG_ADD_COLLECT)
    },

    resizeCheck() {
      // 将目录树勾选节点置空
      this.dataCatalogCheckNode([], {})
      // 将DataCatalogCheckController类中的当前图层勾选信息属性设置为空
      DataCatalogCheckController.setCurrentCheckLayerConfig(null)
      // 将DataCatalogCheckController类中的当前勾选图层的变化信息设置为空数组
      DataCatalogCheckController.setCurrentLayerChangeConfig([])
      // 将DataCatalogCheckController类中当前勾选图层中无子图层的图层设置为空数组
      DataCatalogCheckController.setCurrentLayerNoChildList([])
      // 将DataCatalogCheckController类中当前勾选图层时的场景设置信息设置为空对象
      DataCatalogCheckController.setCurrentCheckSceneSettingConfig({})
      // 将DataCatalogCheckController类中记录场景设置信息的配置还原成初始化状态
      DataCatalogCheckController.restoreSceneConfig()
      // 将BaseMapController类中的是否重置标识设置为true
      BaseMapController.isResize = true
      // 将BaseMapController类中的底图信息设置为空
      BaseMapController.setBaseMapInfo = null
    },

    // 非空间数据加载
    onClick(item) {
      const widgetConfig = this.widgetInfo.config
      this.nonSpatialType = item.data
      this.nonSpatialFileListUrl = undefined
      // if (item.description.includes('非空间数据')) {
      if (item.serverType === LayerType.NOSPATIALDATA) {
        if (
          widgetConfig.treeConfig.useLocalData ||
          widgetConfig.treeConfig.useLocalParam
        ) {
          this.nonSpatialUrl = widgetConfig.urlConfig.nonSpatialUrl
          if (this.nonSpatialUrl) {
            // 获取配置的非空间数据地址
            const ftpServer = this.nonSpatialUrl.search('ftp:')
            const httpServer = this.nonSpatialUrl.search('http:')
            const httpsServer = this.nonSpatialUrl.search('https:')
            if (ftpServer > -1) {
              this.dataType = 'ftp'
              this.nonSpatialFileListUrl = `${this.baseUrl}/api/non-spatial/files?pageNumber=0&pageSize=1000&path=${item.data}&protocol=ftp&url=${this.nonSpatialUrl}`
            } else if (httpServer > -1 || httpsServer > -1) {
              this.dataType = 'hdfs'
              this.nonSpatialFileListUrl = this.nonSpatialUrl
            }
            // 获取当前节点配置的地址,若当前节点配置的是url则使用该url
            const { dataUrl } = item
            if (dataUrl.indexOf('://') > -1) {
              this.nonSpatialFileListUrl = dataUrl
            } else {
              this.nonSpatialFileListUrl += dataUrl
            }
          } else {
            // 无配置的非空间数据地址采用图层中配置的信息
            const { dataUrl } = item
            if (dataUrl && dataUrl.indexOf('://') > -1) {
              this.nonSpatialFileListUrl = dataUrl
              const ftpServer = dataUrl.search('ftp:')
              const httpServer = dataUrl.search('http:')
              const httpsServer = dataUrl.search('https:')
              if (ftpServer > -1) {
                this.dataType = 'ftp'
              } else if (httpServer > -1 || httpsServer > -1) {
                this.dataType = 'hdfs'
              }
            }
          }
          if (!this.nonSpatialFileListUrl) {
            this.$message.info('该非空间数据节点无配置信息！')
            return
          }
          this.showNoSpatial = true
        }
      }
    },

    /**
     * 对目录树数据进行处理
     * @data 目录树原始数据
     * @arr 将多维数组转换为一维数组，通过arr来记录
     */
    handleTreeData(data: object[], allTreeDataConfigs: []) {
      const this_ = this
      const treeData = data.map((item: any) => {
        // 设置目录树展示所需的slot和checkbox
        this_.$set(item, 'scopedSlots', { title: 'custom' })
        this_.$set(item, 'disableCheckbox', false)
        /**
         * 修改说明：图层下的节点设置为不可选
         * 修改人：龚跃健
         * 修改时间：2022/1/24
         */
        // 通过类型去判断是否为非空间数据
        if (
          item.description.includes('非空间数据') ||
          item.serverType === LayerType.NOSPATIALDATA ||
          (!item.children &&
            !Object.prototype.hasOwnProperty.call(item, 'serverType'))
        ) {
          // 非空间数据的节点不展示checkbox
          this_.$set(item, 'checkable', false)
        }
        allTreeDataConfigs.push(item)
        // 递归处理children节点
        if (item.children) {
          this_.handleTreeData(item.children, allTreeDataConfigs)
        }
        return item
      })
      return {
        treeData,
        allTreeDataConfigs,
      }
    },

    // 串联该节点所在层级的description
    getNodeLabel(node, index, labelArr, nodeParentLevel) {
      labelArr.push(node[nodeParentLevel[index]].description)
      if (
        node[nodeParentLevel[index]].children &&
        node[nodeParentLevel[index]].children.length > 0
      ) {
        index++
        this.getNodeLabel(
          node[nodeParentLevel[index - 1]].children,
          index,
          labelArr,
          nodeParentLevel
        )
      }
    },

    // 判断是否是OGC图层
    isOGCLayer(type) {
      return type === LayerType.OGCWMS || type === LayerType.OGCWMTS
    },

    // 根据url获取domain及docName
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

    // 元数据信息按钮响应事件
    async showMetaDataInfo(item) {
      if (this.isOGCLayer(item.serverType)) {
        const url = item.serverURL
        let getCapabilitiesURL = ''
        let tempUrl = url
        if (item.tokenValue && item.tokenValue.length > 0) {
          const tokenKey = item.tokenKey ? item.tokenKey : 'token'
          tempUrl += `?${item.tokenKey}=${item.tokenValue}`
        }
        if (baseConfigInstance.config.token && item.serverName) {
          const token = baseConfigInstance.config.token
          // 有服务名直接取服务名，没有服务名根据url解析，但是第三方服务根据url解析不到正确的服务名，无法获取云管的元数据信息，因此第三方服务必须要有服务名
          let domain
          let docName
          if (item.serverName) {
            const url = new URL(tempUrl)
            domain = url.origin
            docName = item.serverName
          } else {
            const res = this.parseUrl(tempUrl)
            domain = res.domain
            docName = res.docName
          }
          const ip = item.ip || baseConfigInstance.config.ip
          const port = item.port || baseConfigInstance.config.port
          const option = { domain, docName, token, ip, port }
          const metadata = await Metadata.CloudMetaDataQuery.query(option)
          if (metadata) {
            this.currentOGCMetadata = {
              ...JSON.parse(JSON.stringify(metadata)),
              type: item.serverType,
            }
            this.showMetaData = true
            return
          }
        }
        if (item.serverType === LayerType.OGCWMS) {
          getCapabilitiesURL =
            Metadata.OGCMetadataQuery.generateWMSGetCapabilitiesURL(tempUrl)
        } else if (item.serverType === LayerType.OGCWMTS) {
          getCapabilitiesURL =
            Metadata.OGCMetadataQuery.generateWMTSGetCapabilitiesURL(tempUrl)
        }
        this.showMetaData = false
        window.open(getCapabilitiesURL)
      } else {
        if (item.serverURL.includes('igs/rest')) {
          const layer = {
            ...item,
            type: item.serverType,
          }
          this.showMetaData = true
          this.currentConfig = layer
        } else {
          // 第三方注册服务
          if (baseConfigInstance.config.token) {
            const token = baseConfigInstance.config.token
            const ip = item.ip || baseConfigInstance.config.ip
            const port = item.port || baseConfigInstance.config.port
            const docName = item.serverName
            const option = { token, ip, port, docName }
            const metadata = await Metadata.CloudMetaDataQuery.query(option)
            if (metadata) {
              this.currentOGCMetadata = {
                ...JSON.parse(JSON.stringify(metadata)),
                type: item.serverType,
              }
              this.showMetaData = true
              return
            }
          }
          window.open(item.serverURL)
        }
      }
    },

    // 点击上传图例响应事件
    onUploadLegend(item) {
      this.showUploader = true
      this.legendNode = item
    },

    // 上传文件之前的钩子
    beforeUpload(file) {
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        this.$message.error('上传图片大小需小于2M')
      }
      return isLt2M
    },

    // 上传文件状态改变时的回调
    async onChangeFile(info) {
      if (info.file.status === 'uploading' || info.file.status === 'error') {
        return
      }
      if (info.file.status === 'done') {
        const url = info.file.response.url
        const legendConfig = await api.getWidgetConfig('legend')
        // const key = this.legendNode.name
        const key = DataCatalogUtil.getTreeNodeLabel(
          this.legendNode,
          this.dataCatalogTreeData
        )
        if (url) {
          legendConfig[key] = url
          const res = await api.saveWidgetConfig({
            name: 'legend',
            config: JSON.stringify(legendConfig),
          })
          eventBus.$emit(events.UPLOAD_LEGEND_SUCCESS_EVENT)
          this.showUploader = false
        }
      }
    },

    // 判断节点是否为非空间数据
    isNonSpatial(item) {
      return (
        item.description.indexOf('非空间数据') > -1 ||
        item.serverType === LayerType.NOSPATIALDATA
      )
    },
    // 判断节点是否为流图层
    isDataFlow(item) {
      return item.serverType === LayerType.DataFlow
    },

    /**
     * 判断是否是ModelCache图层
     * @param item layer图层
     * @returns boolean
     */
    isModelCacheLayer({ serverType }) {
      return serverType === LayerType.ModelCache
    },

    /**
     * 获取叶子节点的总数和被选中数
     */
    getLeafStatus(item) {
      const status = this.getLeafStatusRecursion(item)
      this.leafLengthMap[item.guid] = status.leafTotal
      return `(${status.leafChecked}/${status.leafTotal})`
    },

    /**
     * 获取叶子节点的总数和被选中数递归函数
     */
    getLeafStatusRecursion(item) {
      let leafTotal = 0
      let leafChecked = 0
      for (let i = 0; i < item.children.length; i++) {
        const children = item.children[i]
        if (!children.children || children.children.length === 0) {
          leafTotal++
          const id = children.guid
          // 判断该节点是否被勾选
          if (this.dataCatalogManager.checkedLayerConfigIDs.includes(id)) {
            leafChecked++
          }
        } else {
          const childrenStatus = this.getLeafStatusRecursion(children)
          leafTotal += childrenStatus.leafTotal
          leafChecked += childrenStatus.leafChecked
        }
      }
      return { leafTotal, leafChecked }
    },

    // 组装分类展示的目录树数据
    getTabsData(treeData) {
      const tabsData = []
      const tab = {
        name: '其他',
        guid: 'ungrouped-data',
        dataId: 'ungrouped-data',
        children: [],
      }
      treeData.forEach((item) => {
        item.children ? tabsData.push(item) : tab.children.push(item)
      })
      tabsData.push(tab)
      return tabsData
    },
    // 分类展示切换tab
    treeTabChange(val) {
      this.activeTreeTab = val
      this.dataCatalogTreeData = this.dataCatalogTabData.find(
        (item) => item.guid === val
      )?.children
    },
    divMousewheel(event) {
      // 获取滚动方向
      const detail = event.wheelDelta || event.detail
      // 定义滚动方向，其实也可以在赋值的时候写
      const moveForwardStep = 1
      const moveBackStep = -1
      // 定义滚动距离
      let step = 0
      // 判断滚动方向,这里的100可以改，代表滚动幅度，也就是说滚动幅度是自定义的
      if (detail < 0) step = moveForwardStep * 50
      else step = moveBackStep * 50

      // 对需要滚动的元素进行滚动操作
      if (
        event.currentTarget.scrollLeft + step >=
        event.currentTarget.scrollWidth
      ) {
        event.currentTarget.scrollLeft = event.currentTarget.scrollWidth
      } else if (event.currentTarget.scrollLeft + step <= 0) {
        event.currentTarget.scrollLeft = 0
      } else {
        event.currentTarget.scrollLeft += step
      }
      this.scrollLeft = event.currentTarget.scrollLeft
      this.computedIconClick(event.currentTarget)
    },
    computedIconClick(targetNode) {
      // 控制前置箭头是否可以点击
      this.isPreClick = targetNode.scrollLeft === 0
      // 控制后置箭头是否可以点击
      this.isSuffixClick =
        targetNode.scrollWidth - targetNode.offsetWidth <= targetNode.scrollLeft
    },
    // 分类展示下点击向左箭头
    goback() {
      const targetNode = document.getElementById('tree-tabs-list')
      // 定义滚动距离
      const step = 50
      if (targetNode.scrollLeft - step <= 0) {
        targetNode.scrollLeft = 0
      } else {
        targetNode.scrollLeft -= step
      }
      this.scrollLeft = targetNode.scrollLeft
      this.computedIconClick(targetNode)
    },
    // 分类展示下点击向右箭头
    goforward() {
      const targetNode = document.getElementById('tree-tabs-list')
      // 定义滚动距离
      const step = 50
      if (targetNode.scrollLeft + step >= targetNode.scrollWidth) {
        targetNode.scrollLeft = targetNode.scrollWidth
      } else {
        targetNode.scrollLeft += step
      }
      this.scrollLeft = targetNode.scrollLeft
      this.computedIconClick(targetNode)
    },
    // 获取目录树勾选的节点id数组
    getDataCatalogCheckedNodeKeys() {
      if (!this.isClassify) {
        return [...this.checkedNodeKeys]
      } else {
        // 将其他tab页的勾选全部放到一起
        let allCheck = []
        Object.keys(this.activeTreeTabRelRelation).forEach((item) => {
          allCheck = [
            ...new Set([...allCheck, ...this.activeTreeTabRelRelation[item]]),
          ]
        })
        return allCheck
      }
    },
    // 移除this.activeTreeTabRelRelation中记录的对应节点id
    filterRemoveKeys(ids) {
      Object.keys(this.activeTreeTabRelRelation).forEach((item) => {
        const keys = this.activeTreeTabRelRelation[item]
        this.activeTreeTabRelRelation[item] = keys.filter(
          (key) => !ids.includes(key)
        )
      })
    },
    // 关闭当前微件后再次打开自动滚动到上一次记录的位置（分类展示）
    scrollTargetPosition() {
      // this.$nextTick在收藏夹切换回数据目录时会失效
      // this.$nextTick(() => {
      //   if (this.scrollLeft !== 0) {
      //     const targetNode = document.getElementById('tree-tabs-list')
      //     if (targetNode) targetNode.scrollLeft = this.scrollLeft
      //   }
      // })
      setTimeout(() => {
        if (this.scrollLeft !== 0) {
          this.reComputed()
        }
      }, 500)
    },
    // 在微件的onActive函数中执行滚动方法（分类展示）
    onActive() {
      this.scrollTargetPosition()
    },
    // 计算滚动距离以及是否存在/可点击左右箭头（分类展示）
    reComputed() {
      const targetNode = document.getElementById('tree-tabs-list')
      if (targetNode) targetNode.scrollLeft = this.scrollLeft
      this.computedIconClick(targetNode)
    },
    // 点击右侧箭头展示所有tab项后对应的点击逻辑（分类展示）
    srcollToSelect(data) {
      if (this.activeTreeTab === data.guid) return
      this.treeTabChange(data.guid)
      const targetNode = document.getElementById(data.guid)
      const scrollNode = document.getElementById('tree-tabs-list')
      const scrollWidth = targetNode ? targetNode.offsetLeft - 20 : 0
      this.scrollLeft = scrollWidth
      this.reComputed()
    },
    provideInformation(node) {
      const { dataRef } = node
      // 当前节点为叶子节点并且处于勾选状态时将该节点通过eventBus发出
      if (!dataRef.children) {
        const checked = this.dataCatalogManager.checkedLayerConfigIDs.includes(
          dataRef.guid
        )
        eventBus.$emit(events.DATA_CATALOG_SELECT_NODE, {
          node: dataRef,
          checked,
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-data-catalog {
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  .toolbar {
    display: flex;
    justify-content: center;
    align-content: center;
    .action-more {
      display: flex;
      align-items: center;
      font-size: 17px;
      padding-left: 12px;
    }
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
  .tree-container {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
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
      > span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .check-light {
      background: $primary-2;
    }
    ::v-deep .mapgis-ui-tree li .mapgis-ui-tree-node-content-wrapper {
      padding: 0;
    }

    ::v-deep .mapgis-ui-tree li.filter-node > span {
      color: $warning-color !important;
    }
  }
  .tree-tabs-list-content {
    position: relative;
    display: flex;
    > i {
      margin-top: 8px;
      line-height: 24px;
    }
    > i:hover {
      color: $primary-5;
    }
    .tree-tabs-list {
      display: flex;
      justify-content: space-between;
      /* 设置超出滚动 */
      overflow-x: auto;
      padding-top: 8px;
      margin: 0 8px;
      > span {
        display: inline-block;
        margin-right: 5px;
        /* 超出滚动的关键，没有它元素会自动缩小，不会滚动 */
        flex-shrink: 0;
        cursor: pointer;
        margin-right: 8px;
        user-select: none;
        background: $background-color-light;
        padding: 0 8px;
        border-radius: 3px;
      }
      .active {
        font-weight: 500;
        color: $primary-5;
      }
      .active:hover {
        color: $primary-5;
      }
      > span:hover {
        color: $primary-3;
      }
      > span:last-child {
        margin-right: 0;
      }
    }
  }
  .tree-tabs-list {
    ::v-deep .mapgis-ui-tabs-bar {
      border-bottom-color: transparent;
      margin: 0;
    }
    ::v-deep .mapgis-ui-tabs-ink-bar {
      visibility: hidden;
    }
    ::v-deep .mapgis-ui-tabs .mapgis-ui-tabs-nav .mapgis-ui-tabs-tab {
      padding: 15px 4px;
    }
    display: flex;
    justify-content: space-between;
    /* 设置超出滚动 */
    overflow-x: auto;

    > span {
      display: inline-block;
      margin-right: 5px;
      /* 超出滚动的关键，没有它元素会自动缩小，不会滚动 */
      flex-shrink: 0;
      cursor: pointer;
      margin-right: 16px;
      :hover {
        color: $primary-5;
      }
      .active {
        font-weight: 500;
      }
    }
  }
  .tree-tabs-list::-webkit-scrollbar {
    /* 隐藏滚动条 */
    display: none;
  }
}
.tabs-detail-list {
  .tabs-detail-info {
    padding: 5px 5px;
    cursor: pointer;
  }
  .tabs-detail-info:hover {
    color: $primary-3;
  }
  .active {
    font-weight: 500;
    color: $primary-5;
    background: $background-color-light;
    border-radius: 3px;
  }
  .active:hover {
    color: $primary-5;
  }
}
.mapgis-ui-dropdown-trigger.anticon-more {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  cursor: pointer;
}

.filter-dropdown {
  flex-direction: row;
}

.total-text {
  font-size: xx-small;
  color: gray;
}
</style>
<style lang="scss">
.tabs-detail-list {
  .mapgis-ui-popover-inner-content {
    max-height: 60vh;
    overflow: auto;
  }
}
</style>
