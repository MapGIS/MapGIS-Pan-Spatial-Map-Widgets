<template>
  <mp-window-wrapper :visible="visible">
    <mp-window
      title="新建专题图"
      :visible.sync="visible"
      :vertical-offset="50"
      :has-padding="false"
      anchor="top-center"
    >
      <div class="thematic-map-subject-add" v-if="visible">
        <div class="subject-add-content">
          <!-- 基础配置 -->
          <base-items v-model="subjectNodeBase" />
          <!-- 主题配置 -->
          <subject-items
            v-show="subjectType"
            v-model="subjectNodeConfig"
            :subject-type="subjectType"
          />
        </div>
        <!-- 取消\保存按钮 -->
        <div class="subject-add-save-btn">
          <mapgis-ui-button @click="onCancel">取消</mapgis-ui-button>
          <mapgis-ui-button type="primary" @click="onSave"
            >保存</mapgis-ui-button
          >
        </div>
      </div>
    </mp-window>
  </mp-window-wrapper>
</template>
<script lang="ts">
import { UUID } from '@mapgis/web-app-framework'
import _uniqBy from 'lodash/uniqBy'
import {
  mapGetters,
  mapMutations,
  ModuleType,
  ISubjectType,
  INewSubjectConfig,
  ISubjectConfigNode,
} from '../../store'
import BaseItems from './components/BaseItems'
import SubjectItems from './components/SubjectItems'
import dep from './store/dep'

export default {
  name: 'ThematicMapSubjectAdd',
  components: {
    BaseItems,
    SubjectItems,
  },
  computed: {
    ...mapGetters(['isVisible', 'subjectConfig']),
    // 显示开关
    visible: {
      get() {
        return this.isVisible(ModuleType.CREATE)
      },
      set(nV) {
        if (!nV) {
          this.resetVisible(ModuleType.CREATE)
        }
      },
    },
    // 专题节点的父节点title
    parentTitle() {
      return this.subjectNodeBase.parentTitle
    },

    // 专题节点的专题类型
    subjectType() {
      return this.subjectNodeBase.type
    },
  },
  methods: {
    ...mapMutations(['resetVisible', 'updateSubjectConfig']),
    /**
     * 添加节点
     */
    addNodeToTreeNode(
      tree: Array<ISubjectConfigNode>,
      node: INewSubjectConfig
    ) {
      return tree.map((item) => {
        if (item.id === node.parentId) {
          if (item.children && item.children.length) {
            const index = item.children.findIndex(({ id }) => id === node.id)
            if (index !== -1) {
              item.children.splice(index, 1, node)
            } else {
              item.children.push(node)
            }
          } else {
            item.children = [node]
          }
        } else if (item.children && item.children.length) {
          this.addNodeToTreeNode(item.children, node)
        }
        return item
      })
    },

    /**
     * 添加根级节点
     */
    addNodeToTreeRoot(
      tree: Array<ISubjectConfigNode>,
      node: INewSubjectConfig
    ) {
      const parentId = `root-${UUID.uuid()}`
      const rootNode = {
        id: parentId,
        title: node.parentTitle,
        nodeType: 'panel',
        visible: true,
        children: [{ ...node, parentId }],
      }
      return [...tree, rootNode]
    },

    /**
     * 创建专题节点
     * 如果没有指定的parentId，则自创建一个分类节点并挂载新建的专题图;
     * 如果指点parentId， 则直接挂载至指定的节点
     */
    createSubjectConfigNode(node: INewSubjectConfig) {
      let config = this.subjectConfig
      if (!node.parentId) {
        config = this.addNodeToTreeRoot(config, node)
      } else {
        config = this.addNodeToTreeNode(config, node)
      }
      this.updateSubjectConfig(config)
        .then(() => {
          console.log('保存-----------', config)
          this.$message.success('保存成功')
          this.onCancel()
        })
        .catch((err) => {
          this.$message.error('保存失败')
        })
    },

    /**
     * 取消
     */
    onCancel() {
      this.visible = false
      this.subjectNodeBase = {}
      this.subjectNodeConfig = []
    },

    /**
     * 保存
     * todo 专题配置表单校验?是否使用a-form来实现, 业务组件如何触发校验?包装a-form-item?
     */
    onSave() {
      if (!this.parentTitle) {
        this.$message.warning('请填写或选择专题分类')
      } else if (!this.subjectType) {
        this.$message.warning('请选择专题类型')
      } else if (!this.subjectNodeConfig.length) {
        this.$message.warning('请填写专题配置')
      } else {
        const subjectStyleComps = dep.getSub() // 获取专题图样式配置组件
        let configs = _uniqBy(this.subjectNodeConfig, ({ time }) => time)
        const { type } = this.subjectNodeBase
        if (type === 'SubSectionMap' || type === 'StatisticLabel') {
          // 分段专题图\等级符号专题图
          if (subjectStyleComps.length >= configs.length) {
            configs = configs.map((c, i) => ({
              ...c,
              themeStyle: {
                styleGroups:
                  subjectStyleComps[i].getFormResult().themeStyle[
                    subjectStyleComps[i].id
                  ], // 获取样式配置结果
              },
            }))
          }
        }
        this.createSubjectConfigNode({
          ...this.subjectNodeBase,
          config: configs,
        })
      }
    },
  },
  props: {
    node: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      // 专题配置基础信息(隶属的专题分类,专题名,专题类型等)
      subjectNodeBase: {},

      // 专题配置的配置集合
      subjectNodeConfig: [],
    }
  },
  watch: {
    // 监听: 需要编辑的专题图节点
    node: {
      deep: true,
      handler({ config, ...others }) {
        this.subjectNodeBase = others
        this.subjectNodeConfig = config
      },
    },
  },
}
</script>

<style lang="scss" scoped>
.thematic-map-subject-add {
  .subject-add-save-btn {
    border-top: 1px solid $border-color-split;
  }
}
</style>

<style lang="less">
@import './index.less';
</style>
