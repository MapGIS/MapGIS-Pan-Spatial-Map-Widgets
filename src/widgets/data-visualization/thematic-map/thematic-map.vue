<template>
  <div class="mp-widget-thematic-map" v-if="!flag">
    <!-- 专题图树 -->
    <mapgis-ui-group-tab
      :has-top-margin="false"
      :has-bottom-margin="false"
      size="default"
      title="专题"
    >
      <mapgis-ui-toolbar-command-group slot="handle">
        <mapgis-ui-toolbar-command
          @click="createSubject"
          title="新建专题图"
          icon="plus"
        />
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-group-tab>
    <mapgis-ui-spin :spinning="loading">
      <mapgis-ui-empty v-if="!thematicMapTree.length" />
      <mapgis-ui-tree
        v-else
        @check="onTreeCheck"
        :show-line="true"
        :tree-data="thematicMapTree"
        :checkedKeys="checkedThematicMapKeys"
        :replace-fields="{ key: 'id' }"
        checkable
      >
        <span slot="custom" slot-scope="node" class="tree-node">
          <mapgis-ui-dropdown :trigger="['contextmenu']">
            <span>{{ node.title }}</span>
            <mapgis-ui-menu
              slot="overlay"
              @click="onTreeNodeMenuClick($event, node)"
            >
              <mapgis-ui-menu-item
                v-show="!node.checkable"
                :key="thematicMapNodeHandles.CREATE"
                >新建</mapgis-ui-menu-item
              >
              <mapgis-ui-menu-item
                v-show="node.checkable"
                :key="thematicMapNodeHandles.EDIT"
                >编辑</mapgis-ui-menu-item
              >
              <mapgis-ui-menu-item :key="thematicMapNodeHandles.REMOVE"
                >删除</mapgis-ui-menu-item
              >
            </mapgis-ui-menu>
          </mapgis-ui-dropdown>
        </span>
      </mapgis-ui-tree>
    </mapgis-ui-spin>
    <!-- 5类专题图图层 -->
    <thematic-map-layers />
    <!-- 属性表 -->
    <thematic-map-attribute-table />
    <!-- 统计表 -->
    <thematic-map-statistic-graph />
    <!-- 时间轴 -->
    <thematic-map-time-line />
    <!-- 工具栏 -->
    <thematic-map-manage-tools />
    <!-- 新建专题图 -->
    <thematic-map-subject-add :node="currentThematicMapNode" />
  </div>
</template>

<script lang="ts">
import {
  WidgetMixin,
  baseConfigInstance,
  UUID,
} from '@mapgis/web-app-framework'
import _cloneDeep from 'lodash/cloneDeep'
import {
  ModuleType,
  INewSubjectConfig,
  mapMutations,
  mapGetters,
  moduleTypeList,
} from './store'
import store from './store/module/index'

import ThematicMapAttributeTable from './components/ThematicMapAttributeTable'
import ThematicMapStatisticGraph from './components/ThematicMapStatisticGraph'
import ThematicMapTimeLine from './components/ThematicMapTimeLine'
import ThematicMapManageTools from './components/ThematicMapManageTools'
import ThematicMapSubjectAdd from './components/ThematicMapSubjectAdd'
import ThematicMapLayers from './components/ThematicMapLayers'

enum ThematicMapNodeHandles {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  REMOVE = 'REMOVE',
}

export default {
  name: 'MpThematicMap',
  components: {
    ThematicMapAttributeTable,
    ThematicMapStatisticGraph,
    ThematicMapTimeLine,
    ThematicMapManageTools,
    ThematicMapSubjectAdd,
    ThematicMapLayers,
  },
  mixins: [WidgetMixin],
  computed: {
    ...mapGetters(['subjectConfig']),
    // 选中的专题图树节点key集合
    checkedThematicMapKeys() {
      return this.checkedThematicMapNodes.map(({ id }) => id)
    },
  },
  provide() {
    return { popupShowType: baseConfigInstance.config.popupShowType }
  },
  data() {
    return {
      // 放置面板打开时多次触发更新
      flag: true,

      // 数据加载提示
      loading: false,

      // 专题图树
      thematicMapTree: [],

      // 专题图节点的操作按钮
      thematicMapNodeHandles: ThematicMapNodeHandles,

      // 选中的专题图树节点集合
      checkedThematicMapNodes: [],

      // 当前操作的专题图节点
      currentThematicMapNode: {},
    }
  },
  methods: {
    ...mapMutations([
      'setVisible',
      'setBaseConfig',
      'setSubjectConfig',
      'updateSubjectConfig',
      'setSelectedSubjectList',
      'resetVisible',
    ]),
    /**
     * 展示专题图树加载提示
     */
    setLoadingShow() {
      if (!this.loading) {
        this.loading = true
      }
    },

    /**
     * 隐藏专题图树加载提示
     */
    setLoadingHide() {
      if (this.loading) {
        this.loading = false
      }
    },

    /**
     * 设置面板显示
     * @param type 打开参数对应的面板
     * @param exclude 打开除参数外的面板
     */
    setModulesShow(type: ModuleType, exclude: ModuleType = ModuleType.CREATE) {
      if (type) {
        this.setVisible(type)
      } else {
        moduleTypeList.forEach((v) => v !== exclude && this.setVisible(v))
      }
    },

    /**
     * 设置面板隐藏
     * @param exclude
     * 若有参数则关闭除参数以外的面板
     * 若无参数则隐藏所有默认配置的面板
     */
    setModulesHide(exclude: ModuleType) {
      moduleTypeList.forEach((t) => t !== exclude && this.resetVisible(t))
    },

    /**
     * 新建专题图
     */
    createSubject() {
      this.currentThematicMapNode = {
        checkable: true,
        id: `subject-${UUID.uuid()}`,
        nodeType: 'subject',
        scopedSlots: { title: 'custom' },
        parentTitle: nodeData.title,
        parentId: nodeData.id,
        title: undefined,
        visible: true,
      }
      this.setVisible(ModuleType.CREATE)
    },

    /**
     * 格式化专题图树
     * @param tree
     */
    normalizeThematicMapTree(tree: Array<ISubjectConfigNode>) {
      return tree.map((node) => {
        this.$set(node, 'checkable', node.nodeType === 'subject')
        this.$set(node, 'scopedSlots', { title: 'custom' })
        if (node.children && node.children.length) {
          this.normalizeThematicMapTree(node.children)
        }
        return node
      })
    },

    /**
     * todo 创建节点
     */
    onTreeNodeCreate(nodeData: ISubjectConfigNode) {
      if (nodeData.nodeType === 'panel') {
        this.currentThematicMapNode = {
          checkable: true,
          id: `subject-${UUID.uuid()}`,
          nodeType: 'subject',
          scopedSlots: { title: 'custom' },
          parentTitle: nodeData.title,
          parentId: nodeData.id,
          title: undefined,
          visible: true,
        }
      } else {
        this.currentThematicMapNode = nodeData
      }
      this.setModulesShow(ModuleType.CREATE)
    },

    /**
     * 编辑节点
     */
    onTreeNodeEdit(nodeData: ISubjectConfigNode) {
      this.currentThematicMapNode = nodeData
      this.setModulesShow(ModuleType.CREATE)
    },

    /**
     * 移除节点
     */
    onTreeNodeRemove(nodeData: ISubjectConfigNode) {
      this.setSelectedSubjectList(
        this.checkedThematicMapNodes.filter((s) => s.id !== nodeData.id)
      )
      const recursion = (
        tree: Array<ISubjectConfigNode>,
        node: ISubjectConfigNode
      ) => {
        for (let i = 0; i < tree.length; i++) {
          const n = tree[i]
          if (n.id === node.id) {
            tree.splice(
              tree.findIndex(({ id }) => id === node.id),
              1
            )
            i--
          } else if (n.children && n.children.length) {
            recursion(n.children, node)
          }
        }
        return tree
      }
      this.updateSubjectConfig(recursion(this.subjectConfig, nodeData))
        .then(() => {
          this.$message.success('删除成功')
        })
        .catch((err) => {
          this.$message.error('删除失败')
        })
    },

    /**
     * 节点下拉菜单点击
     * @param key ThematicMapNodeHandles
     * @param dataRef 节点数据
     */
    onTreeNodeMenuClick({ key }, { dataRef }) {
      switch (key) {
        case ThematicMapNodeHandles.CREATE:
          this.onTreeNodeCreate(dataRef)
          break
        case ThematicMapNodeHandles.EDIT:
          this.onTreeNodeEdit(dataRef)
          break
        case ThematicMapNodeHandles.REMOVE:
          this.onTreeNodeRemove(dataRef)
          break
        default:
          break
      }
    },

    /**
     * 专题图树选中
     */
    onTreeCheck(checkedKeys, { checkedNodes, node, event }) {
      this.checkedThematicMapNodes = checkedNodes.map(
        ({ data }) => data.props.dataRef
      )
      this.setSelectedSubjectList(this.checkedThematicMapNodes)
      if (!this.checkedThematicMapNodes.length) {
        this.setModulesHide(ModuleType.TOOLS)
      } else {
        this.setModulesShow()
      }
    },

    /**
     * 清除
     */
    onClear() {
      this.flag = true
      this.checkedThematicMapNodes = []
      this.setLoadingHide()
      // 重置缓存
      this.setModulesHide()
      this.setBaseConfig(null)
      this.setSubjectConfig([])
      this.setSelectedSubjectList([])
    },

    /**
     * 专题图面板打开
     * fixme 未对接服务，取store里缓存的配置
     */
    onOpen() {},

    onActive() {
      if (this.flag) {
        this.setSubjectConfig(this.subjectConfig)
        this.setModulesShow(ModuleType.TOOLS)
        this.flag = false
      }
    },

    /**
     * 专题图面板关闭
     */
    onClose() {},
  },
  watch: {
    /**
     * 保存后更新了store里的subjectConfig后需要更新专题配置树
     */
    subjectConfig: {
      deep: true,
      handler(nV) {
        this.setLoadingShow()
        this.thematicMapTree = this.normalizeThematicMapTree(_cloneDeep(nV))
        this.setLoadingHide()
      },
    },
  },

  created() {
    const { subjectConfig } = this.widgetInfo.config
    let { baseConfig } = this.widgetInfo.config
    if (!baseConfig) {
      // 防止后面因为baseconfig未定义导致进程中断
      baseConfig = {
        baseIp: '',
        basePort: '',
        isOverlay: true,
        isLocation: true,
        startZindex: 3000,
      }
    }
    this.setBaseConfig(baseConfig)
    this.setSubjectConfig(subjectConfig)
  },

  beforeDestroy() {
    this.onClear()
  },
}
</script>
<style lang="scss" scoped>
.mp-widget-thematic-map {
  height: 100%;
  overflow-y: auto;
  .mapgis-ui-empty {
    margin-top: 10%;
  }
}
.tree-node-context-menue {
  box-shadow: $box-shadow-base;
}
::v-deep .mapgis-ui-empty {
  margin-top: 20%;
}

::v-deep
  .mapgis-ui-tree.mapgis-ui-tree-show-line
  li
  span.mapgis-ui-tree-switcher {
  background: transparent;
}
</style>
