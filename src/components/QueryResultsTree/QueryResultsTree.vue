<template>
  <div class="mp-query-result-tree">
    <mapgis-ui-spin :spinning="loading">
      <mapgis-ui-empty v-if="!treeData.length" />
      <mapgis-ui-tree
        v-else
        @load="onTreeLoad"
        @check="onTreeSelect"
        @select="onTreeSelect"
        :checkedKeys="selectedKeys"
        :selectedKeys="selectedKeys"
        :expandedKeys.sync="expandedKeys"
        :load-data="loadDataMethod"
        :tree-data="treeData"
        :replace-fields="{ title: 'layerName' }"
        :checkable="multiple"
      >
        <div slot="custom" slot-scope="item">
          <div>
            <span>
              {{ item.layerName }}
            </span>
            <span v-show="item.total !== undefined" class="total-text">{{
              `(${item.total})`
            }}</span>
          </div>
          <mapgis-ui-pagination
            v-show="
              item.expanded &&
              !!item.dataRef.children &&
              item.dataRef.children.length > 0
            "
            simple
            :current="item.currentPage"
            :total="item.total"
            :pageSize="item.pageSize"
            size="small"
            class="pagination"
            @change="
              (page, pageSize) => {
                pageChange(page, pageSize, item.dataRef)
              }
            "
          />
        </div>
      </mapgis-ui-tree>
    </mapgis-ui-spin>
  </div>
</template>

<script lang="ts">
import { Rectangle } from '@mapgis/webclient-es6-service/common/Rectangle'
import {
  UUID,
  Layer,
  LayerType,
  Rectangle3D,
  Objects,
  Feature,
  Catalog,
  MapMixin,
  baseConfigInstance,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import _last from 'lodash/last'

const { DocumentCatalog } = Catalog
const {
  FeatureQueryParam,
  FeatureIGS,
  FeatureGeoJSON,
  GFeature,
  ArcGISFeatureQuery,
  FeatureQuery,
  FeatureConvert,
} = Feature

interface ILayerParams extends Layer {
  ip: string
  port: string
  docName?: stirng
  tileName?: stirng
}

interface ILayerInfoItem {
  layerName: string
  layerIndex: string
  layerId?: string
  layerGdbp?: string
}

interface ITreeNode extends ILayerInfoItem {
  key: string
  children?: ITreeNode[]
  isLeaf?: boolean
  selectable?: boolean
  feature?: GFeature
  total?: number | undefined
  currentPage?: number
  pageSize?: number
}

/**
 * 目前支持的图层类型有:
 * IGSTile瓦片(4) IGS瓦片
 * IGSMapImage地图(5) IGS矢量文档(doc)
 * IGSVector矢量(6) IGS矢量图层(gdbp)
 * IGSScene(23) 三维DOC3D和IGSIMAGE3D (gdbp)
 * ArcGISMapImage(10)  ArcGIS IMAGE REST
 */
export default {
  name: 'MpQueryResultTree',
  mixins: [MapMixin],
  props: {
    // 组件唯一标识
    vueKey: String,
    // 待查询的图层：支持查询的类型图层如下：1.在线地图服务图层。2.在线矢量图层。3.关联了在线地图服务的在线瓦片图层
    layer: {
      type: Object,
      default: () => ({}),
    },
    // 待查询的图层的查询范围
    geometry: {
      type: Object,
    },
    // 参与查询的地图索引,可选属性,仅对1、3两种类型的图层有效。
    mapIndex: {
      type: Number,
      default: 0,
    },
    // 参与查询的子图层名称列表,名称之间以逗号分隔。可选属性,仅对1、3两种类型的图层有效。
    querySublayerNames: {
      type: String,
      default: '',
    },
    // 参与查询的行政区划代码列表,行政区划代码之间以逗号分隔。可选属性,仅对1、3两种类型的图层有效，且图层url中须含有行政区代码。
    queryDistrictCode: {
      type: String,
      default: '',
    },
    // 是否多选
    multiple: {
      type: Boolean,
      default: false,
    },
    // 分页显示的条目数
    pageCount: {
      type: Number,
      default: 10,
    },
    // 分页显示时的当前页码，从1开始。
    page: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      loading: false,
      // 结果树数据
      treeData: [] as ITreeNode[],

      // 已经加载的节点的children集合
      loadedNodeDataChildren: [] as ITreeNode[],

      // 已经加载的节点的dataRef集合
      loadedNodeData: [] as ITreeNode[],

      // 展开的节点
      expandedKeys: [] as string[],

      // 选中的节点
      selectedKeys: [] as string[],
    }
  },
  computed: {
    // 根据图层url格式化图层的ip,port,docName等信息
    layerParams() {
      const { ip: baseIp, port: basePort } = baseConfigInstance.config
      const _ip = baseIp
      const _port = basePort
      let _domain

      if (typeof this.layer._parseUrl === 'function') {
        const { domain, docName } = this.layer._parseUrl(this.layer.url)
        _domain = domain
        this.layer.docName = docName //eslint-disable-line
      }

      this.layer.ip = _ip //eslint-disable-line
      this.layer.port = _port //eslint-disable-line
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.layer.domain = _domain

      return this.layer
    },
  },
  methods: {
    /**
     * 获取IGSMapImage图层信息
     * @param {object}
     */
    async getIGSMapImageLayerInfo({ ip, port, domain, docName }: ILayerParams) {
      const docInfo = await DocumentCatalog.getDocInfo({
        ip,
        port,
        domain,
        serverName: docName,
      })
      if (docInfo && docInfo.MapInfos.length > this.mapIndex) {
        const mapInfo: DocInfoMapInfo = docInfo.MapInfos[this.mapIndex]
        if (mapInfo) {
          const { CatalogLayer } = mapInfo
          const layerIndexes: string[] =
            DocumentCatalog.getLayerIndexesByNamesOrCodes(
              CatalogLayer,
              this.querySublayerNames,
              this.queryDistrictCode,
              [],
              []
            )
          const layers = DocumentCatalog.getLayersByIndexes(
            layerIndexes.join(','),
            CatalogLayer
          )
          return layers.map<ILayerInfoItem>(({ LayerName, LayerIndex }) => ({
            layerName: LayerName,
            layerIndex: LayerIndex,
          }))
        }
      }
      return []
    },

    /**
     * 获取IGSTile图层信息
     * @param {object}
     */
    async getIGSTileLayerInfo({
      ip,
      port,
      domain,
      id,
      serverName,
    }: ILayerParams) {
      const layerConfig = dataCatalogManagerInstance.getLayerConfigByID(id)
      const docName =
        layerConfig && layerConfig.bindData
          ? layerConfig.bindData.serverName
          : serverName
      const res = await this.getIGSMapImageLayerInfo({
        ip,
        port,
        domain,
        docName,
      })
      return res
    },

    /**
     * 获取IGSVector图层信息
     * @param {object}
     */
    getIGSVectorLayerInfo({ gdbps }: ILayerParams) {
      const res: ILayerInfoItem[] = []
      if (gdbps) {
        res.push({
          layerName: _last(gdbps.split('/')),
          layerIndex: '',
        })
      }
      return res
    },

    /**
     * 获取IGSScene图层信息
     * @param {object}
     */
    getArcGISMapImageLayerInfo({ id, allSublayers }: ILayerParams) {
      return allSublayers.reduce<ILayerInfoItem[]>(
        (arr, { id, title, visible }, index) => {
          if (visible) {
            arr.push({
              layerId: id,
              layerIndex: id,
              layerName: title,
            })
          }
          return arr
        },
        []
      )
    },

    /**
     * 获取IGSScene图层信息
     * @param {object}
     */
    getIGSSceneLayerInfo({ id, activeScene }: ILayerParams) {
      const layerConfig = dataCatalogManagerInstance.getLayerConfigByID(id)
      if (layerConfig && layerConfig.bindData) {
        const { gdbps } = layerConfig.bindData
        return activeScene.sublayers.reduce<ILayerInfoItem[]>(
          (arr, item, index) => {
            if (item.visible) {
              arr.push({
                layerId: item.id,
                layerName: item.title || item.name,
                layerIndex: `${index}`,
                layerGdbp: gdbps,
              })
            }
            return arr
          },
          []
        )
      }
      return []
    },

    /**
     * 获取数据
     */
    async getTreeData() {
      try {
        this.loading = true
        const {
          layerParams,
          layerParams: { isVisible, type },
        } = this
        if (isVisible) {
          let treeData = []
          switch (type) {
            case LayerType.IGSMapImage:
              treeData = await this.getIGSMapImageLayerInfo(layerParams)
              break
            case LayerType.IGSTile:
              treeData = await this.getIGSTileLayerInfo(layerParams)
              break
            case LayerType.IGSVector:
              treeData = this.getIGSVectorLayerInfo(layerParams)
              break
            case LayerType.ArcGISMapImage:
              treeData = this.getArcGISMapImageLayerInfo(layerParams)
              break
            case LayerType.IGSScene:
              treeData = this.getIGSSceneLayerInfo(layerParams)
              break
            default:
              break
          }
          this.treeData = treeData.map<ITreeNode>((node: ILayerInfoItem) => ({
            ...node,
            key: UUID.uuid(),
            selectable: false,
            scopedSlots: { title: 'custom' },
            total: undefined,
            currentPage: this.page,
            pageSize: this.pageCount,
          }))
          if (this.treeData.length) {
            this.expandedKeys.push(this.treeData[0]?.key)
          }
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * igs要素查询
     * @param {Object} queryOptions 要素查询参数
     */
    async igsQueryFeature(queryOptions) {
      let total = 0
      let features = []
      if (queryOptions.needTotal) {
        // 初次查询或者查询几何变化的时候，需要查询总数
        const params = { ...queryOptions, page: 0, pageCount: 1, f: 'json' }
        const result = await FeatureQuery.query(params)
        total = result.TotalCount
      }
      const geojson = await FeatureQuery.query(queryOptions)
      if (geojson && geojson.features && geojson.features.length) {
        features = geojson.features.map((item) => ({
          key: UUID.uuid(),
          isLeaf: true,
          selectable: true,
          layerName: item.properties.fid,
          feature: item,
        }))
      }
      return { features, total }
    },

    /**
     * igs三维要素查询
     * @param {Object} queryOptions 要素查询参数
     * @param {string} specialLayerId 图层ID
     */
    async igsQuery3DFeature(
      queryOptions: FeatureQueryParam,
      specialLayerId: string
    ) {
      const sceneController = Objects.SceneController.getInstance(
        this.Cesium,
        this.vueCesium,
        this.vueCesium.getViewer(this.vueKey)
      )
      if (!sceneController) {
        return Promise.reject('viewer未初始化')
      }
      const featureIGS: FeatureIGS = await FeatureQuery.query(
        queryOptions,
        false,
        true
      )
      const { AttStruct, SFEleArray } = featureIGS
      if (!SFEleArray || !SFEleArray.length) {
        return []
      }
      const source = sceneController.findSource(specialLayerId)
      const features = SFEleArray.map(({ AttValue = [], bound = {}, FID }) => {
        const boundObj = source
          ? sceneController.localExtentToGlobelExtent(
              bound,
              source.root.transform
            )
          : bound
        const properties = {
          FID,
          specialLayerId: specialLayerId,
          specialLayerBound: boundObj,
          ...AttStruct.FldName.reduce((obj, n, i) => {
            obj[n] = AttValue[i]
            return obj
          }, {}),
        }
        return {
          key: UUID.uuid(),
          isLeaf: true,
          selectable: true,
          layerName: FID,
          feature: {
            geometry: {
              coordinates: [],
              type: '3DPolygon',
            },
            properties,
          },
        }
      })
      const total = featureIGS.TotalCount
      return { features, total }
    },

    /**
     * arcgis要素查询
     * @param {Object} queryOptions 要素查询参数
     */
    async arcGISQueryFeature(queryOptions: FeatureQueryParam) {
      const { layerIndex, serverUrl, geometry, f } = queryOptions
      const { count: total } = await ArcGISFeatureQuery.getTotal({
        geometry,
        layerIndex,
        serverUrl,
        f,
      })
      const { features }: FeatureGeoJSON = await ArcGISFeatureQuery.query({
        ...queryOptions,
        total,
      })
      const geojsonFeatures =
        features && features.length
          ? features.map((item: GFeature) => ({
              key: UUID.uuid(),
              isLeaf: true,
              selectable: true,
              layerName: item.properties.ID,
              feature: item,
            }))
          : []
      return { features: geojsonFeatures, total }
    },

    /**
     * 要素查询
     * @param {Object}
     */
    async queryFeatures({
      layerId,
      layerIndex,
      layerGdbp,
      currentPage,
      pageSize,
      needTotal,
    }) {
      const { ip, port, domain, type, docName, gdbps, url } = this.layerParams
      const queryOptions = {
        ip,
        port,
        domain,
        page: currentPage - 1,
        pageCount: pageSize,
        geometry: this.geometry,
        coordPrecision: 8,
        f: 'json',
        needTotal,
      }
      let children = []
      switch (type) {
        case LayerType.IGSMapImage:
          children = await this.igsQueryFeature({
            ...queryOptions,
            mapIndex: this.mapIndex,
            layerIdxs: layerIndex,
            docName,
            f: 'geojson',
          })
          break
        case LayerType.IGSVector:
          children = await this.igsQueryFeature({
            ...queryOptions,
            gdbp: gdbps,
            f: 'geojson',
          })
          break
        case LayerType.ArcGISMapImage:
          children = await this.arcGISQueryFeature({
            ...queryOptions,
            serverUrl: url,
            layerIndex,
          })
          break
        case LayerType.IGSScene:
          children = await this.igsQuery3DFeature(
            {
              ...queryOptions,
              gdbp: layerGdbp,
              rtnLabel: false,
            },
            layerId
          )
          break
        default:
          break
      }
      return children
    },

    /**
     * 图层分页查询
     * @param page 当前页码
     * @param pageSize 总页数
     * @param dataRef node节点对象
     */
    pageChange(page, pageSize, dataRef) {
      const { layerId, layerIndex, layerGdbp } = dataRef
      const needTotal = false
      const currentPage = page
      console.log(page, pageSize, dataRef)
      this.loading = true
      return new Promise((resolve) => {
        this.queryFeatures({
          layerId,
          layerIndex,
          layerGdbp,
          currentPage,
          pageSize,
          needTotal,
        })
          .then((children) => {
            dataRef.children = children.features
            dataRef.currentPage = page
            const loadedKeys = []
            const featuresArr = []
            this.loadedNodeData.forEach((item) => {
              if (item.key == dataRef.key) {
                item.children = children.features
              }
              loadedKeys.push(item.key)
              featuresArr.push(item.children)
            })
            const loadedNodeDataChildren = featuresArr.flat()
            this.$emit('on-loaded', loadedKeys, loadedNodeDataChildren)
            this.loadedNodeDataChildren = loadedNodeDataChildren
            this.treeData = [...this.treeData]
            this.loading = false
          })
          .catch((e) => {
            this.$message.error(e || '请求错误')
            this.loading = false
          })
      })
    },

    /**
     * 异步加载数据
     * @param {object}
     */
    loadDataMethod({ dataRef }) {
      return new Promise((resolve) => {
        if (!dataRef || dataRef.children) {
          resolve()
          return
        }
        // 第一次查询，增加查总数功能
        const { layerId, layerIndex, layerGdbp, currentPage, pageSize } =
          dataRef
        const needTotal = true
        this.queryFeatures({
          layerId,
          layerIndex,
          layerGdbp,
          currentPage,
          pageSize,
          needTotal,
        })
          .then((children) => {
            dataRef.children = children.features
            dataRef.total = children.total
            this.treeData = [...this.treeData]
            resolve()
          })
          .catch((e) => {
            this.$message.error(e || '请求错误')
            resolve([])
          })
      })
    },

    /**
     *  节点加载
     *  @param {array}
     * @param {object}
     */
    onTreeLoad(loadedKeys, { node: { dataRef } }) {
      this.loadedNodeData.push(dataRef)
      this.loadedNodeDataChildren = [
        ...this.loadedNodeDataChildren,
        ...(dataRef.children || []),
      ]
      this.$emit('on-loaded', loadedKeys, this.loadedNodeDataChildren)
    },

    /**
     * 节点选中
     * @param selectedKeys
     * @param treeNode
     */
    onTreeSelect(selectedKeys, { selectedNodes, checkedNodes, node }) {
      this.selectedKeys = selectedKeys
      const vnodes = this.multiple ? checkedNodes : selectedNodes
      // 选中节点数据
      const data = node.dataRef
      // 选中节点的数据集合
      const selectedData = vnodes.length
        ? vnodes.map(({ data }) => data.props.dataRef)
        : []
      this.$root.$emit('clear-query-selection', this.vueKey)
      this.$emit('on-select', selectedKeys, selectedData, data)
    },

    /**
     * 清除节点选中和已加载的节点的children集合
     */
    onClearTreeSelect(vueKey) {
      if (this.vueKey !== vueKey) {
        this.selectedKeys = []
      }
    },

    /**
     * 刷新
     */
    onRefresh() {
      this.loading = true
      this.selectedKeys = []
      this.loadedNodeDataChildren = []
      Promise.all(
        this.loadedNodeData.map((dataRef) => {
          const { layerId, layerIndex, layerGdbp, currentPage, pageSize } =
            dataRef
          // 更新查询范围后，增加查总数功能
          const needTotal = true
          return this.queryFeatures({
            layerId,
            layerIndex,
            layerGdbp,
            currentPage,
            pageSize,
            needTotal,
          })
        })
      )
        .then((childrenArr = []) => {
          const loadedKeys = []
          const featuresArr = []
          this.loadedNodeData.forEach((dataRef, i) => {
            loadedKeys.push(dataRef.key)
            dataRef.children = childrenArr[i].features || []
            dataRef.total = childrenArr[i].total || 0
            featuresArr.push(dataRef.children)
          })
          const loadedNodeDataChildren = featuresArr.flat()
          this.$emit('on-loaded', loadedKeys, loadedNodeDataChildren)
          this.loadedNodeDataChildren = loadedNodeDataChildren
          this.treeData = [...this.treeData]
          this.loading = false
        })
        .catch((e) => {
          this.loading = false
          this.$message.error(e || '请求错误')
        })
    },
  },
  watch: {
    'layer.id': {
      handler() {
        this.getTreeData()
      },
    },
    geometry: {
      handler(nV) {
        if (nV) {
          this.onRefresh()
        }
      },
      deep: true,
    },
  },

  created() {
    this.getTreeData()
    this.$root.$on('clear-query-selection', this.onClearTreeSelect)
  },

  beforeDestroy() {
    this.$root.$off('clear-query-selection', this.onClearTreeSelect)
  },
}
</script>
<style scoped lang="scss">
@import '../../theme/index.scss';

.mp-query-result-tree {
  padding: 4px 8px;
  overflow: auto;
  @include hoverScrollbar();
  .mapgis-ui-tree > li:first-child {
    padding-top: 0;
  }
  .mapgis-ui-tree > li:last-child {
    padding-bottom: 10px;
  }

  .total-text {
    font-size: xx-small;
    color: gray;
  }

  ::v-deep .mapgis-ui-tree-node-content-wrapper {
    width: 100%;
  }

  .pagination {
    float: right;
    margin-right: 12px;
    font-size: 12px;
  }

  ::v-deep .mapgis-ui-pagination.mini .mapgis-ui-pagination-prev {
    min-width: 12px;
    line-height: 15px;
  }
  ::v-deep .mapgis-ui-pagination.mini .mapgis-ui-pagination-next {
    min-width: 12px;
    line-height: 15px;
  }

  ::v-deep .mapgis-ui-pagination-simple .mapgis-ui-pagination-simple-pager {
    margin-right: 0px;
    line-height: 15px;
  }

  ::v-deep
    .mapgis-ui-pagination-simple
    .mapgis-ui-pagination-simple-pager
    input {
    margin-right: 0px;
    padding: 0 0;
  }

  ::v-deep .mapgis-ui-pagination-slash {
    margin: 0 0;
  }

  ::v-deep .mapgis-ui-tree-node-content-wrapper-open {
    height: 40px;
  }
}
</style>
