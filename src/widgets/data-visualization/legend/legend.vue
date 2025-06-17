<template>
  <div class="mp-widget-legend">
    <mp-window-wrapper :visible="visible">
      <template v-slot:default="slotProps">
        <mp-window
          anchor="top-right"
          title="图例"
          :visible.sync="visible"
          :horizontalOffset="10"
          :verticalOffset="235"
          :fullScreenAction="false"
          :shrinkAction="false"
          :width="270"
          :height="390"
          v-bind="slotProps"
        >
          <template>
            <div id="legendContainer">
              <mapgis-ui-collapse
                v-if="data && data.length > 0"
                :activeKey="activeKey"
                :bordered="false"
                @change="collapseChange"
              >
                <mapgis-ui-collapse-panel
                  v-for="item in data"
                  :key="item.description"
                  :class="item.description"
                >
                  <template v-if="item.description" slot="header">
                    <mapgis-ui-tooltip>
                      <template v-if="item.description" slot="title">
                        {{ item.description }}
                      </template>
                      <div>{{ item.legendLabel || item.name }}</div>
                    </mapgis-ui-tooltip>
                  </template>
                  <img class="contain-img" :src="item.imgUrl" alt="" />
                </mapgis-ui-collapse-panel>
              </mapgis-ui-collapse>
            </div>
          </template>
        </mp-window>
      </template>
    </mp-window-wrapper>
    <mp-map-widget-button :widget="widget" @click="onClickWidget" />
  </div>
</template>

<script lang="ts">
import {
  AppManager,
  WidgetMixin,
  AppMixin,
  dataCatalogManagerInstance,
  api,
  eventBus,
  events,
  DataCatalogUtil,
} from '@mapgis/web-app-framework'
import { Result } from 'ant-design-vue'

export default {
  name: 'MpLegend',
  mixins: [WidgetMixin, AppMixin],
  data() {
    return {
      // 图例微件的显隐
      visible: false,
      // 目录树数据
      treeData: [],
      // 被勾选的目录树数据
      checkedTreeData: [],
      // 被勾选的目录树节点key
      checkedNodesKeys: [],
      // 上一次被勾选的目录树节点key
      preCheckedNodesKeys: [],
      // 图例数据
      data: [],
      activeKey: [],
      scrollPositionKey: undefined,
    }
  },
  created() {
    // 监听事件在组件创建的时候，就进行，不然数据目录默认加载的数据，无法监听到
    eventBus.$on(events.UPLOAD_LEGEND_SUCCESS_EVENT, this.onGetConfig)
    eventBus.$on(
      events.DATA_SELECTION_KEYS_CHANGE_EVENT,
      this.onCheckedKeysChange
    )
  },
  methods: {
    async onOpen() {
      await this.getTreedata()
      this.$message.config({
        top: '100px',
        duration: 2,
        maxCount: 1,
      })
    },
    async getTreedata() {
      const config = await api.getWidgetConfig('data-catalog')
      const appConfig = await AppManager.getInstance().getRequest()({
        url: this.application.appConfigPath,
        method: 'get',
      })
      // 使用新的app.json中的规范，判断this.application.data是否有且有值就替换this.widgetInfo.config.treeConfig.treeData
      if (appConfig.data && appConfig.data.length > 0) {
        config.treeConfig.treeData = appConfig.data
      }
      dataCatalogManagerInstance.init(config)
      this.treeData = await dataCatalogManagerInstance.getDataCatalogTreeData()
    },
    beforeDestroy() {
      eventBus.$off(events.UPLOAD_LEGEND_SUCCESS_EVENT)
      eventBus.$off(events.DATA_SELECTION_KEYS_CHANGE_EVENT)
    },
    // 微件点击事件回调
    onClickWidget() {
      this.visible = !this.visible
      if (this.visible && this.data.length === 0) {
        this.$message.warning(
          '未选择数据或未配置数据图例，可在后台配置或在数据目录节点上上传图例'
        )
      }
    },
    // 获取被选中的树节点数据(仅包含叶子节点)
    getCheckNodeData(treeData) {
      treeData.forEach((item) => {
        if (item.children && item.children.length > 0) {
          this.getCheckNodeData(item.children)
        } else {
          if (this.checkedNodesKeys.includes(item.guid)) {
            this.checkedTreeData.push(item)
          }
        }
      })
    },
    // 监听上传图例成功事件回调
    onGetConfig({ node, legendUrl }) {
      if (node.children && node.children.length > 0) {
        // 说明不是叶子节点上传图例，则把this.treeData清空
        this.treeData = []
        this.initData()
        return
      }

      // 如果是叶子节点上上传图例，则直接更新this.data
      const labelLegend = DataCatalogUtil.getTreeNodeLabelLegend(
        node,
        this.treeData
      )
      const { labelArr, labelLengendArr } = labelLegend
      const length = labelLengendArr.length
      // 根节点到子节点的label串
      let tempDescription = labelArr.join('-')
      let tempLengendLabel = labelArr[labelArr.length - 1]
      // 子节点上的legend
      let tempLegend =
        labelLengendArr[length - 1] && labelLengendArr[length - 1].legend
          ? labelLengendArr[length - 1].legend
          : null
      let tempName =
        labelLengendArr[length - 1] && labelLengendArr[length - 1].name
          ? labelLengendArr[length - 1].name
          : null
      if (tempName !== tempLengendLabel) {
        // 如果图例的name与计算label数组最后一个对不上，则说明子节点上没有图例
        this.treeData = []
        this.initData()
        return
      }
      let hasItem = false
      for (let i = 0; i < this.data.length; i++) {
        const item = this.data[i]
        if (item.description === tempDescription) {
          hasItem = true
          // 说明data里存在相同的节点图例
          if (!tempLegend || tempLegend == '') {
            // 图例为空，直接删除
            this.data.splice(i, 1)
            const activeKeyIndex = this.activeKey.indexOf(tempDescription)
            if (activeKeyIndex > 0) {
              this.activeKey.splice(activeKeyIndex, 1)
            }
            if (this.scrollPositionKey === tempDescription) {
              this.scrollPositionKey = undefined
            }
          } else {
            this.$set(this.data[i], 'imgUrl', this.getImage(tempLegend))
          }
          break
        } else if (tempDescription.includes(item.description)) {
          // 如果该子节点之前用的是父节点的图例，现在改用自己的，则直接清空this.treeData，重新获取
          this.treeData = []
          this.initData()
          return
        }
      }
      // 如果不存在图例，则直接push到data中
      if (!hasItem) {
        const obj = {
          description: tempDescription,
          legendLabel: tempLengendLabel,
          imgUrl: this.getImage(tempLegend),
          name: tempName,
        }
        this.data.push(obj)
      }
      if (this.checkedNodesKeys.includes(node.guid)) {
        // 滑动条定位的地方
        this.scrollPositionKey = tempDescription
        if (!this.activeKey.includes(tempDescription) && !!tempDescription) {
          this.activeKey.push(tempDescription)
        }
      }
    },

    // 监听目录树勾选节点变化时回调事件
    onCheckedKeysChange(keys) {
      this.checkedNodesKeys = keys
      this.initData()
    },

    // 初始化图例数据
    async initData() {
      if (this.treeData.length < 1) {
        // 监听到数据目录默认加载的数据的时候，如果还没有获取到数据目录，则获取后，再初始化图例数据
        await this.getTreedata()
      }
      // const newConfig = await api.getWidgetConfig('legend')
      this.checkedTreeData = []
      this.getCheckNodeData(this.treeData)

      this.data = []
      this.scrollPositionKey = undefined
      for (let i = 0; i < this.checkedTreeData.length; i++) {
        const item = this.checkedTreeData[i]
        let obj = {}
        // 1、获取根节点到节点的节点label和legend
        const labelLegend = DataCatalogUtil.getTreeNodeLabelLegend(
          item,
          this.treeData
        )
        const { labelArr, labelLengendArr } = labelLegend
        const length = labelLengendArr.length
        // 根节点到子节点的label串
        let tempDescription = labelArr.join('-')
        let tempLengendLabel = labelArr[labelArr.length - 1]
        // 子节点上的legend
        let tempLegend =
          labelLengendArr[length - 1] && labelLengendArr[length - 1].legend
            ? labelLengendArr[length - 1].legend
            : null
        let tempName =
          labelLengendArr[length - 1] && labelLengendArr[length - 1].name
            ? labelLengendArr[length - 1].name
            : null
        for (let j = length - 1; j >= 0; j--) {
          const { name, legend } = labelLengendArr[j]
          const description = labelArr.slice(0, j + 1).join('-')
          const legendLabel = labelArr[j]
          // 第一种情况，根节点上没有legend，向上父节点上找
          if (!tempLegend || tempLegend.length == 0) {
            // 父节点上有legend
            if (legend && legend.length > 0) {
              tempLegend = legend
              tempDescription = description
              tempLengendLabel = legendLabel
              tempName = name
              obj = {
                description: tempDescription,
                legendLabel: tempLengendLabel,
                imgUrl: this.getImage(tempLegend),
                name: tempName,
              }
              break
            }
            // 父节点上没有legend，继续往上找
            continue
          } else {
            // 第二种情况，根节点上有legend，向上父节点上找，看是否与父节点的legend重复
            // 父节点上有legend
            if (legend && legend.length > 0) {
              // 子节点的legend与父节点不相同，取子节点的
              if (legend !== tempLegend) {
                obj = {
                  description: tempDescription,
                  legendLabel: tempLengendLabel,
                  imgUrl: this.getImage(tempLegend),
                  name: tempName,
                }
                break
              } else {
                // 子节点的legend与父节点相同，取父节点的，并且继续往上找
                tempDescription = description
                tempLengendLabel = legendLabel
                tempLegend = legend
                tempName = name
                if (j === 0) {
                  // 如果到根节点，子节点的legend还与父节点相同，则直接取根节点的
                  obj = {
                    description: tempDescription,
                    legendLabel: tempLengendLabel,
                    imgUrl: this.getImage(tempLegend),
                    name: tempName,
                  }
                  break
                }
              }
            } else {
              // 父节点上没有legend
              if (j === 0) {
                // 如果到根节点，父节点还是没有legend，则直接取子节点的
                obj = {
                  description: tempDescription,
                  legendLabel: tempLengendLabel,
                  imgUrl: this.getImage(tempLegend),
                  name: tempName,
                }
                break
              }
            }
          }
        }
        if (Object.keys(obj).length > 0) {
          const dataItem = this.data.find(
            (item) => item.description == obj.description
          )
          if (!dataItem) {
            // 如果不存在，则追加
            this.data.push(obj)
          }
        }
        if (
          !this.preCheckedNodesKeys.includes(item.guid) &&
          this.checkedNodesKeys.includes(item.guid)
        ) {
          // 滑动条定位的地方
          this.scrollPositionKey = obj.description
          if (!this.activeKey.includes(obj.description) && !!obj.description) {
            this.activeKey.push(obj.description)
          }
        }
      }
      this.preCheckedNodesKeys = this.checkedNodesKeys
      if (this.scrollPositionKey) {
        setTimeout(() => {
          const mainContainer =
            document.getElementById('legendContainer').parentElement // 父级容器
          const scrollToContainer = mainContainer.getElementsByClassName(
            this.scrollPositionKey
          )[0] // 指定的class
          if (scrollToContainer !== undefined) {
            mainContainer.scrollTop = scrollToContainer.offsetTop
          }
        }, 500)
      }
    },
    collapseChange(keys) {
      this.activeKey = [...keys]
    },
    getImage(image) {
      // 如果image是完整的路径，则直接返回全路径
      if (image.includes('://')) {
        return image
      }
      if (image.startsWith('/file')) {
        return `${this.baseUrl}/${this.appProductName}${image}`
      }
      return `${this.baseUrl}${image}`
    },
  },
  beforeDestroy() {
    eventBus.$off(events.UPLOAD_LEGEND_SUCCESS_EVENT)
    eventBus.$off(events.DATA_SELECTION_KEYS_CHANGE_EVENT)
  },
}
</script>

<style lang="scss" scoped>
.contain-img {
  width: 246px;
  height: 246px;
  object-fit: contain;
  background: rgba(128, 128, 128, 0.2);
}

::v-deep .mapgis-ui-collapse-content > .mapgis-ui-collapse-content-box {
  padding: unset;
}

::v-deep
  .mapgis-ui-collapse
  > .mapgis-ui-collapse-item
  > .mapgis-ui-collapse-header {
  padding: unset;
  padding-left: 20px;
}

::v-deep
  .mapgis-ui-collapse
  > .mapgis-ui-collapse-item
  > .mapgis-ui-collapse-header
  .mapgis-ui-collapse-arrow {
  left: 2px;
}
</style>
