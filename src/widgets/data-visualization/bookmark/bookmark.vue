<template>
  <div class="mp-widget-bookmark">
    <mapgis-ui-tree
      v-if="treeData.length > 0"
      :tree-data="treeData"
      :defaultExpandAll="true"
      :showLine="true"
      :replaceFields="replaceFields"
    >
      <mapgis-ui-iconfont slot="switcherIcon" type="mapgis-down" />
      <template #custom="item">
        <div v-if="item.children && item.children.length > 0">
          <mapgis-ui-tooltip>
            <template v-if="item.description" slot="title">
              {{ item.description }}
            </template>
            <span>{{ item.name }}</span>
          </mapgis-ui-tooltip>
        </div>
        <mapgis-ui-dropdown v-else :trigger="['contextmenu']">
          <mapgis-ui-tooltip>
            <template v-if="item.description" slot="title">
              {{ item.description }}
            </template>
            <div @click="onClickBookmark(item)">{{ item.name }}</div>
          </mapgis-ui-tooltip>
          <mapgis-ui-menu slot="overlay">
            <mapgis-ui-menu-item key="1" @click="onDeleteBookmark(item)">
              删除该项
            </mapgis-ui-menu-item>
          </mapgis-ui-menu>
        </mapgis-ui-dropdown>
      </template>
    </mapgis-ui-tree>
    <mapgis-ui-empty v-else :image="simpleImage" />
  </div>
</template>

<script lang="ts">
import { MapgisUiEmpty } from '@mapgis/webclient-vue-ui'
import {
  WidgetMixin,
  UUID,
  api,
  eventBus,
  events,
} from '@mapgis/web-app-framework'
import { TreeConfig } from './tree-config'

export default {
  name: 'MpBookmark',
  mixins: [WidgetMixin],
  data() {
    return {
      treeData: [],
      replaceFields: { title: 'name', key: 'guid' },
      baseTreeData: null,
      // 判断是否是批量添加
      isBatAdd: false,
      nodeParentLevel: [],
    }
  },

  beforeCreate() {
    this.simpleImage = MapgisUiEmpty.PRESENTED_IMAGE_SIMPLE
  },

  mounted() {
    this.treeData = this.widgetInfo.config
    eventBus.$on(events.ADD_DATA_BOOKMARK_EVENT, this.onAddDataBookmark)
    eventBus.$on(
      events.ADD_ALL_SELECTED_DATA_BOOKMARK_EVENT,
      this.onAddAllSelectdDataBookmark
    )
  },
  methods: {
    onAddDataBookmark(data, baseTreeData: Array<Record<string, any>>) {
      this.isBatAdd = false
      this.addToMark(data, baseTreeData)
    },
    onAddAllSelectdDataBookmark(
      type: string,
      checkedKeys: string[],
      baseTreeData: Array<Record<string, any>>
    ) {
      this.isBatAdd = true
      this.baseTreeData = baseTreeData
      this.addAllSelectedToMark(type, checkedKeys, baseTreeData)
      this.saveBookmarks()
    },
    // 单击选中该项响应事件
    onClickBookmark(node) {
      eventBus.$emit(events.OPEN_DATA_BOOKMARK_EVENT, node)
    },
    // 右键删除该项响应事件
    onDeleteBookmark(node) {
      const index = this.treeData[0].children.findIndex(
        (item) =>
          item[TreeConfig.getInstance().config.GUID] ===
          node[TreeConfig.getInstance().config.GUID]
      )
      this.treeData[0].children.splice(index, 1)
      this.saveBookmarks()
    },
    // 遍历所勾选节点中所有的叶子节点
    addAllSelectedToMark(type, checkedKeys, treeData) {
      treeData.forEach((item) => {
        if (item.children && item.children.length > 0) {
          this.addAllSelectedToMark(type, checkedKeys, item.children)
        } else {
          if (
            checkedKeys.includes(item[TreeConfig.getInstance().config.GUID])
          ) {
            this.addToMark({ params: item, type }, this.baseTreeData)
          }
        }
      })
    },
    // 添加到书签
    addToMark({ params, type }, baseTreeData: Array<Record<string, any>>) {
      const this_ = this
      const labelArr = []
      const copyParams = JSON.parse(JSON.stringify(params))
      this.nodeParentLevel = []

      this.baseTreeData = baseTreeData
      if (params.pos) {
        this.getParentLevel(params)
      } else {
        this.getParentLevel2(params, baseTreeData, [])
      }

      if (this.nodeParentLevel.length > 0) {
        this.getNodeLabel(baseTreeData, 0, labelArr)
      }
      const treeNodeLabel = labelArr.join('-')
      copyParams.description = treeNodeLabel

      if (this.treeData.some((item) => item.name === type)) {
        const childrenArr = this.treeData[0].children
        if (
          childrenArr.some(
            (item) =>
              item[TreeConfig.getInstance().config.GUID] ===
              params[TreeConfig.getInstance().config.GUID]
          )
        ) {
          const index = childrenArr.find(
            (item) =>
              item[TreeConfig.getInstance().config.GUID] ===
              params[TreeConfig.getInstance().config.GUID]
          )
          this.$confirm({
            title: '提示',
            content: `已收藏 ${copyParams.name}, 是否要覆盖之前的收藏?`,
            onOk() {
              this_.$set(childrenArr, index, copyParams)
              this_.showMessage()
            },
            onCancel() {},
          })
        } else {
          this.treeData[0].children.push(copyParams)
          this.showMessage()
        }
      } else {
        this.treeData.push({
          name: type,
          guid: UUID.uuid(),
          children: [copyParams],
        })
        this.showMessage()
      }
      if (!this.isBatAdd) {
        this.saveBookmarks()
      }
    },
    // 添加书签成功后提示信息
    showMessage() {
      this.$message.config({
        top: '100px',
        duration: 1,
        maxCount: 3,
      })
      this.$message.success({
        content: '收藏成功，通过收藏夹或者书签功能查看',
      })
    },
    // 串联该节点所在层级的label(去除首层节点的label)
    getNodeLabel(node, index, labelArr) {
      if (index >= 0) {
        labelArr.push(node[this.nodeParentLevel[index]].name)
      }
      if (
        node[this.nodeParentLevel[index]].children &&
        node[this.nodeParentLevel[index]].children.length > 0
      ) {
        index++
        this.getNodeLabel(
          node[this.nodeParentLevel[index - 1]].children,
          index,
          labelArr
        )
      }
    },
    // 获取该节点在目录树中的层级(节点中有pos属性)
    getParentLevel(node: Record<string, any>) {
      this.nodeParentLevel = node.pos
        .split('-')
        .slice(1)
        .map((item) => +item)
    },
    // 获取该节点在目录树中的层级(节点中无pos属性)
    getParentLevel2(
      params: Record<string, any>,
      baseTreeData: Record<string, any>,
      arr: number[]
    ) {
      for (let i = 0; i < baseTreeData.length; i++) {
        const newArr = JSON.parse(JSON.stringify(arr))
        const item = baseTreeData[i]
        newArr.push(i)
        if (item.children && item.children.length > 0) {
          this.getParentLevel2(params, item.children, newArr)
        } else if (
          item[TreeConfig.getInstance().config.GUID] ===
          params[TreeConfig.getInstance().config.GUID]
        ) {
          this.nodeParentLevel = newArr
        }
      }
    },
    saveBookmarks() {
      api
        .saveWidgetConfig({
          name: 'bookmark',
          config: JSON.stringify(this.treeData),
        })
        .catch(() => {
          this.$message.config({
            top: '100px',
            duration: 1,
            maxCount: 3,
          })
          this.$message.error('配置文件更新失败')
        })
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-bookmark {
  ::v-deep .mapgis-ui-tree > li {
    &:last-child {
      padding-bottom: 0;
    }
    &:first-child {
      padding-top: 0;
    }
  }
  ::v-deep .mapgis-ui-empty-normal {
    color: $text-color;
    margin: 8px 0;
  }
}
</style>
