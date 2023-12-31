<template>
  <div class="base-items">
    <!-- 专题名称 -->
    <mapgis-ui-row-flex :label-width="84" label="专题分类">
      <mp-tree-select
        @change="subjectClassifyChange"
        :value="subjectClassify"
        :tree-data="thematicMapTree"
        :replace-fields="{ key: 'id' }"
        :default-expand-all="true"
        description="输入内容可自动创建专题分类"
        placeholder="输入内容可自动创建专题分类"
      />
    </mapgis-ui-row-flex>
    <!-- 专题图名称 -->
    <mapgis-ui-row-flex :label-width="84" label="专题图名称">
      <mapgis-ui-input
        @change="subjectTitleChange"
        :value="baseItemsObj.title"
        :allow-clear="true"
        placeholder="请输入专题图名称"
      />
    </mapgis-ui-row-flex>
    <!-- 专题图类型 -->
    <mapgis-ui-row-flex :label-width="84" label="专题图类型">
      <mapgis-ui-select
        @change="subjectTypeChange"
        :options="subjectTypeList"
        :value="baseItemsObj.type"
        placeholder="请选择专题图类型"
      />
    </mapgis-ui-row-flex>
  </div>
</template>
<script lang="ts">
import { UUID } from '@mapgis/web-app-framework'
import _cloneDeep from 'lodash/cloneDeep'
import {
  mapGetters,
  subjectTypeList,
  ISubjectType,
  INewSubjectConfig,
  ISubjectConfigNode,
} from '../../../../store'

export default {
  name: 'BaseItems',
  computed: {
    ...mapGetters(['subjectConfig']),
    // 专题节点公共的基础数据
    baseItemsObj: {
      get() {
        return { ...this.value }
      },
      set(nV) {
        this.$emit('input', {
          id: `subject-${UUID.uuid()}`,
          visible: true,
          nodeType: 'subject',
          ...nV,
        })
      },
    },
  },
  props: {
    value: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      // 专题类型列表
      subjectTypeList: subjectTypeList,

      // 专题分类
      subjectClassify: '',

      // 专题图树
      thematicMapTree: [],
    }
  },
  methods: {
    /**
     * 专题图节点选择变化
     */
    subjectClassifyChange(value: stirng, key?: string) {
      this.subjectClassify = value
      this.baseItemsObj = {
        ...this.baseItemsObj,
        parentId: key,
        parentTitle: value,
      }
    },

    /**
     * 专题类型选择变化
     */
    subjectTypeChange(type: ISubjectType) {
      this.baseItemsObj = {
        ...this.baseItemsObj,
        type,
      }
    },

    /**
     * 专题名称变化
     */
    subjectTitleChange(e) {
      this.baseItemsObj = {
        ...this.baseItemsObj,
        title: e.target.value,
      }
    },

    /**
     * 格式化专题图树
     * @param tree
     */
    normalizeThematicMapTree(tree: Array<ISubjectConfigNode>) {
      if (!tree.length) return []
      return tree.map((node) => {
        this.$set(node, 'selectable', node.nodeType !== 'subject')
        if (node.nodeType === 'list') {
          this.$set(node, 'children', [])
        } else if (node.children && node.children.length) {
          this.normalizeThematicMapTree(node.children)
        }
        return node
      })
    },

    /**
     * 设置专题图树
     * @param tree
     */
    setThematicMapTree(tree: Array<ISubjectConfigNode>) {
      this.thematicMapTree = this.normalizeThematicMapTree(_cloneDeep(tree))
    },
  },
  watch: {
    /**
     * 监听: 专题配置变化
     */
    'value.parentTitle': {
      handler(nV) {
        this.subjectClassify = nV
      },
    },

    /**
     * 监听: 专题配置变化
     */
    subjectConfig: {
      deep: true,
      handler(nV) {
        this.setThematicMapTree(nV)
      },
    },
  },

  created() {
    this.subjectClassify = this.value.parentTitle
    this.setThematicMapTree(this.subjectConfig)
  },
}
</script>
<style lang="less" scoped>
.base-items {
  .mapgis-ui-row-flex {
    margin-bottom: 12px;
  }
}
</style>
