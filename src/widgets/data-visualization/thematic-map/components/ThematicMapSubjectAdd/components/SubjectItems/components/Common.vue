<template>
  <div class="common">
    <!-- 服务地址设置 -->
    <div class="server-tree-select">
      <mapgis-ui-row-flex
        :label-width="76"
        label-align="right"
        label="服务类型"
      >
        <mapgis-ui-select
          v-model="layerServiceType"
          :options="layerServiceTypes"
          placeholder="请选择服务类型"
          @change="changeLayerServiceType"
        />
      </mapgis-ui-row-flex>
    </div>

    <!-- 服务地址设置 -->
    <div class="server-tree-select">
      <mapgis-ui-row-flex
        :label-width="76"
        label-align="right"
        label="服务地址"
        class=""
        style="display: flex"
      >
        <div class="row-flex-div">
          <mp-tree-select
            @change="selfUriChange"
            :value="selfUri"
            :load-data="catalogTreeLoadData"
            :tree-data="currentTreeData"
            :loading="loading"
            :replace-fields="{
              key: 'guid',
              title: 'name',
            }"
            filter-prop="serverUri"
            label-prop="serverUri"
            placeholder="请选择或按照示例输入服务地址"
          />
          <mapgis-ui-upload
            v-show="showUpload"
            name="file"
            accept=".json"
            :action="uploadUrl"
            :multiple="false"
            method="post"
            :withCredentials="true"
            :data="getData"
            :showUploadList="false"
            @change="onChangeFile"
          >
            <mapgis-ui-button>
              <mapgis-ui-iconfont
                type="mapgis-upload"
                :style="{ fontSize: '18px' }"
              />
            </mapgis-ui-button>
          </mapgis-ui-upload>
        </div>
      </mapgis-ui-row-flex>
      <mapgis-ui-row-flex :label-width="76" class="server-tree-select-example">
        {{ exampleContent }}
      </mapgis-ui-row-flex>
      <!-- 统计属性 -->
      <mapgis-ui-row-flex
        :label-width="76"
        label-align="right"
        label="统计属性"
      >
        <mapgis-ui-select
          v-if="
            layerServiceType === layerServiceTypeEnum.igsImage ||
            layerServiceType === layerServiceTypeEnum.igsVector ||
            layerServiceType === layerServiceTypeEnum.geojson
          "
          v-model="field"
          :options="fields"
          placeholder="请选择统计属性"
        />
        <mapgis-ui-input v-else v-model="field" placeholder="请输入统计属性" />
      </mapgis-ui-row-flex>
    </div>
  </div>
</template>
<script lang="ts">
import {
  Layer,
  LayerType,
  Catalog,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import url from 'url'
import _cloneDeep from 'lodash/cloneDeep'
import _last from 'lodash/last'
import FieldInstance from '../../../store/fields'
import { INewSubjectConfig, LayerServiceType } from '../../../../../store'

interface IServerParams {
  ip: string
  port: string
  gdbp?: string
  docName?: string
  layerName?: string
  layerIndex?: string
}

interface IField {
  type: string
  label: string
  value: string
}

export default {
  name: 'Common',
  props: {
    subjectConfig: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      // 属性列表
      fields: [],

      // 目录树
      catalogTreeData: [],

      // 对应当前layerServiceType的treeData
      currentTreeData: [],

      layerServiceTypeEnum: LayerServiceType,

      uploadUrl: `${this.baseUrl}/api/local-storage`,
    }
  },
  computed: {
    // 示例
    examples() {
      return [
        {
          label: '示例1',
          serverType: this.layerServiceTypeEnum.igsImage,
          content:
            'http://<server>:<port>/igs/rest/mrms/docs/{docName}?layerName={layerName}&layerIndex={layerIndex}',
        },
        {
          label: ' 示例2',
          serverType: this.layerServiceTypeEnum.igsVector,
          content: 'http://<server>:<port>/igs/rest/mrms/layers?gdbp={gdbp}',
        },
        {
          label: ' 示例3',
          serverType: this.layerServiceTypeEnum.geojson,
          content: 'http://localhost:8080/static/json/省级行政区x.json',
        },
        {
          label: ' 示例4',
          serverType: this.layerServiceTypeEnum.igsScene,
          content:
            'http://192.168.82.89:8089/igs/rest/services/白模/SceneServer',
        },
      ]
    },
    layerServiceTypes() {
      return [
        { label: 'MapGIS 地图服务', value: this.layerServiceTypeEnum.igsImage },
        {
          label: 'MapGIS 图层地图服务',
          value: this.layerServiceTypeEnum.igsVector,
        },
        { label: 'GEOJSON 服务', value: this.layerServiceTypeEnum.geojson },
        { label: 'M3D 服务', value: this.layerServiceTypeEnum.igsScene },
      ]
    },
    exampleContent() {
      return (
        this.examples.find((item) => item.serverType === this.layerServiceType)
          ?.content || ''
      )
    },

    showUpload() {
      return this.layerServiceType === this.layerServiceTypeEnum.geojson
    },
    layerServiceType: {
      get() {
        return (
          this.subjectConfig.layerServiceType ||
          this.layerServiceTypes[0]?.value
        )
      },
      set(nV) {
        this.$emit('change', {
          ...this.subjectConfig,
          layerServiceType: nV,
        })
      },
    },
    // 服务地址
    selfUri: {
      get() {
        const { gdbp, docName, layerServiceType, src, ...others } =
          this.subjectConfig
        const serverType =
          layerServiceType && LayerType[layerServiceType]
            ? LayerType[layerServiceType]
            : docName
            ? LayerType.IGSMapImage
            : gdbp
            ? LayerType.IGSVector
            : null
        const serverURL = src || ''
        return this.getServerUri({
          ...others,
          gdbp,
          docName,
          serverType,
          serverURL,
        })
      },
      set(value) {
        this.$emit('change', this.getServerParams(value))
      },
    },

    // 统计属性
    field: {
      get() {
        return this.subjectConfig.field || this.fields[0]?.value
      },
      set(nV) {
        this.$emit('change', {
          ...this.subjectConfig,
          field: nV,
        })
      },
    },
  },
  methods: {
    getData(file) {
      return {
        name: 'file',
      }
    },
    /**
     * 是否gdbp
     */
    isGdbp(serverType) {
      return LayerType.IGSVector === serverType
    },

    /**
     * 是否doc
     */
    isDoc(serverType) {
      return LayerType.IGSMapImage === serverType
    },

    /**
     * 是否GeoJson
     */
    isGeoJson(serverType) {
      return LayerType.GeoJson === serverType
    },

    /**
     * 是否IGSScene
     */
    isIGSScene(serverType) {
      return LayerType.IGSScene === serverType
    },

    /**
     * IGSMapImage地图文档(5)
     * IGSVector矢量(6)
     * GeoJson(28)
     * IGSScene(22)
     */
    isSupportedData(serverType: LayerType) {
      return (
        serverType &&
        (this.isGdbp(serverType) ||
          this.isDoc(serverType) ||
          this.isGeoJson(serverType) ||
          this.isIGSScene(serverType))
      )
    },

    /**
     * server全地址
     */
    getServerUri(node: Layer) {
      const {
        ip,
        port,
        gdbp,
        gdbps,
        serverType,
        layerIndex,
        layerName,
        docName,
        serverURL,
      } = node
      let domain
      if (!!serverURL && serverURL.length > 0) {
        const url = new URL(serverURL)
        domain = url.origin
      } else {
        const protocol = window.location.protocol
        domain = `${protocol}//${ip}:${port}`
      }
      let serverUri = `${domain}/igs/rest/mrms/`
      switch (serverType) {
        case LayerType.IGSMapImage:
          serverUri = `${domain}/igs/rest/mrms/docs/${docName}?layerName=${layerName}&layerIndex=${layerIndex}`
          break
        case LayerType.IGSVector:
          serverUri = `${domain}/igs/rest/mrms/layers?gdbps=${gdbp || gdbps}`
          break
        case LayerType.GeoJson:
          serverUri = serverURL
          break
        case LayerType.IGSScene:
          serverUri = serverURL
          break
        default:
          serverUri = ''
          break
      }
      return serverUri
    },

    /**
     * 根据uri获取服务参数
     */
    getServerParams(uri) {
      const { layerServiceType } = this
      let params: Record<string, any>
      if (uri) {
        const {
          hostname: ip,
          port,
          pathname,
          query: { gdbps, layerName, layerIndex },
        } = url.parse(uri, true)
        const docName = _last(pathname.split('/'))

        if (layerServiceType === LayerServiceType.igsVector) {
          params = {
            ip,
            port,
            gdbp: gdbps,
            layerServiceType,
          }
        } else if (layerServiceType === LayerServiceType.igsImage) {
          params = {
            ip,
            port,
            docName,
            layerName,
            layerIndex,
            layerServiceType,
          }
        } else if (
          layerServiceType === LayerServiceType.geojson ||
          layerServiceType === LayerServiceType.igsScene
        ) {
          params = {
            src: uri,
            layerServiceType,
          }
        }
      }

      return params
    },

    /**
     * 处理目录树， 筛选出IGSVector和IGSMapImage数据
     */
    handleCatalog(tree: Layer[], layerServiceType?) {
      for (let i = 0; i < tree.length; i++) {
        const node = tree[i]
        const isLeaf =
          this.isGdbp(node.serverType) ||
          this.isGeoJson(node.serverType) ||
          this.isIGSScene(node.serverType)
        this.$set(node, 'isLeaf', isLeaf)
        this.$set(node, 'selectable', isLeaf)
        this.$set(node, 'serverUri', this.getServerUri(node))
        if (node.children && node.children.length > 0) {
          this.handleCatalog(node.children, layerServiceType)
        }
        if (node.children && node.children.length === 0) {
          node.children = null
        }
        switch (layerServiceType) {
          case LayerServiceType.igsImage:
            if (!this.isDoc(node.serverType) && !node.children) {
              tree.splice(i, 1)
              i--
            }
            break
          case LayerServiceType.igsVector:
            if (!this.isGdbp(node.serverType) && !node.children) {
              tree.splice(i, 1)
              i--
            }
            break
          case LayerServiceType.geojson:
            if (!this.isGeoJson(node.serverType) && !node.children) {
              tree.splice(i, 1)
              i--
            }
            break
          case LayerServiceType.igsScene:
            if (!this.isIGSScene(node.serverType) && !node.children) {
              tree.splice(i, 1)
              i--
            }
            break
          default:
            if (!this.isSupportedData(node.serverType) && !node.children) {
              tree.splice(i, 1)
              i--
            }
            break
        }
      }
      return tree
    },

    changeLayerServiceType() {
      this.currentTreeData = this.handleCatalog(
        _cloneDeep(this.catalogTreeData),
        this.layerServiceType
      )
    },

    /**
     * 获取目录树数据
     */
    getCatalogTreeData() {
      this.loading = true
      dataCatalogManagerInstance
        .getDataCatalogTreeData()
        .then((result) => {
          this.catalogTreeData = this.handleCatalog(_cloneDeep(result))
          this.changeLayerServiceType()
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 异步加载目录树节点数据的回调
     */
    async catalogTreeLoadData(treeNode: any) {
      const {
        dataRef,
        dataRef: { ip, port, serverName, serverType, children },
      } = treeNode
      if (!children && serverType === LayerType.IGSMapImage) {
        const { DocumentCatalog } = Catalog
        const docInfo = await DocumentCatalog.getDocInfo({
          ip,
          port,
          serverName,
        })
        if (docInfo && docInfo.MapInfos.length) {
          const { CatalogLayer } = docInfo.MapInfos[0]
          const layerIndex =
            DocumentCatalog.getLayerIndexesByNamesOrCodes(CatalogLayer)
          const layers = DocumentCatalog.getLayersByIndexes(
            layerIndex.join(','),
            CatalogLayer
          )
          treeNode.dataRef.children = layers.map(
            ({ LayerName, LayerIndex }) => ({
              name: LayerName,
              guid: LayerIndex,
              isLeaf: true,
              selectable: true,
              serverUri: this.getServerUri({
                ip,
                port,
                serverType,
                docName: serverName,
                layerName: LayerName,
                layerIndex: LayerIndex,
              }),
            })
          )
          this.catalogTreeData = [...this.catalogTreeData]
        }
      }
    },

    /**
     * 设置查询的属性列表
     */
    setFields(serverParams) {
      if (serverParams) {
        const { ip, port, gdbp, docName, layerIndex, layerServiceType } =
          serverParams

        FieldInstance.fetchFields(serverParams).then((fields) => {
          this.fields = fields.map(({ alias, value }) => ({
            label: alias,
            value,
          }))
          this.field = this.fields[0]?.value
        })
      }
    },

    /**
     * 服务地址变化
     */
    selfUriChange(value: string) {
      if (!/^(https|http)?:\/\//.test(value)) {
        this.$message.warn('请输入正确的数据服务地址')
        return
      }
      this.selfUri = value
      this.setFields(this.getServerParams(value))
    },
    // 上传文件状态改变时的回调
    onChangeFile(info) {
      if (info.file.status === 'uploading' || info.file.status === 'error') {
        return
      }
      if (info.file.status === 'done') {
        const url = info.file.response.url
        if (url) {
          this.selfUriChange(`${this.baseUrl}${url}`)
        }
      }
    },
  },

  created() {
    this.getCatalogTreeData()
  },
}
</script>

<style lang="scss" scoped>
.common {
  // ::v-deep {
  .mapgis-ui-input,
  .mapgis-ui-select-selection {
    border-color: transparent;
    &:hover {
      border-color: $primary-color;
    }
  }
  // }
  .server-tree-select {
    &-example {
      word-break: break-all;
      white-space: normal;
      font-size: $font-size-sm;
      color: #a7a4a4;
      margin: 4px 0;
    }
    + div {
      margin: 10px 0 12px 0;
    }
  }

  .row-flex-div {
    display: flex;
  }
}
</style>
