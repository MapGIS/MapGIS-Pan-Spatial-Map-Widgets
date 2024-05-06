<template>
  <div class="mp-attribute-table-list">
    <mapgis-ui-tabs
      v-if="options.length > 0 && options.length <= 9"
      v-model="activeOptionId"
      type="card"
      size="small"
      hide-add
    >
      <mapgis-ui-tab-pane
        v-for="option in options"
        :key="option.id"
        :tab="option.name"
      >
        <component
          :is="attributeTableComponent"
          :ref="option.id"
          :option="option"
          :exhibition="exhibition"
        />
      </mapgis-ui-tab-pane>
      <mapgis-ui-toolbar-command
        title="导出所有属性表"
        icon="export"
        slot="tabBarExtraContent"
        class="exportClass"
        @click="exportAllCSV"
      />
    </mapgis-ui-tabs>
    <div v-else>
      <div>
        <div style="display: flex" class="mp-attribute-table-tag-container">
          <mapgis-ui-col class="mp-attribute-table-tag">
            <mapgis-ui-checkable-tag
              v-for="tag in options"
              :key="tag.id"
              :checked="activeOptionId === tag.id"
            >
              <span @click="changeCheckTag(tag)">{{ tag.name }}</span>
            </mapgis-ui-checkable-tag>
          </mapgis-ui-col>
          <mapgis-ui-toolbar-command
            title="导出所有属性表"
            icon="export"
            slot="tabBarExtraContent"
            class="exportClass"
            @click="exportAllCSV"
          />
        </div>
      </div>
      <component
        :is="attributeTableComponent"
        ref="activeTag"
        :option="currentOption"
        :exhibition="exhibition"
      />
    </div>
    <mapgis-ui-mask
      :parentDivClass="'map-wrapper'"
      :loading="maskShow"
      :text="maskText"
    ></mapgis-ui-mask>
  </div>
</template>

<script lang="ts">
import {
  ExhibitionMixin,
  Exhibition,
  LayerType,
} from '@mapgis/web-app-framework'
import axios from 'axios'
import MpAttributeTable from '../AttributeTable/AttributeTable.vue'

const { IAttributeTableListExhibition } = Exhibition

export default {
  name: 'MpAttributeTableList',
  mixins: [ExhibitionMixin],
  components: { MpAttributeTable },
  props: {
    // 属性表选项
    exhibition: {
      type: IAttributeTableListExhibition,
      required: true,
    },
  },
  data() {
    return {
      maskText: '导出中，请稍候...',
      maskShow: false,
    }
  },
  computed: {
    // 当前激活的面板id
    activeOptionId: {
      get() {
        return this.exhibition.activeOptionId
      },
      set(id: string) {
        this.exhibition.activeOptionId = id
      },
    },
    // 内容组件
    attributeTableComponent() {
      return 'MpAttributeTable'
    },
    // 当前内容组件的配置信息
    options() {
      return this.exhibition.options
    },
    tableExhibition() {
      return function (option) {
        return {
          id: option.id,
          name: option.name,
          option: option,
        }
      }
    },
    // 当前展示tab项的配置信息
    currentOption() {
      return this.options.find((item) => item.id === this.activeOptionId)
    },
  },
  watch: {
    activeOptionId: {
      handler(newVal, oldVal) {
        // 查询的属性表中包含9个以上的tab项时使用标签样式展示tab项
        if (this.options.length > 9) {
          // 调用对应组件的deActivateExhibition方法将之前处于展示状态的tab项清除
          this.$refs.activeTag.deActivateExhibition()
          // 调用对应组件的activateExhibition方法将需要展示的tab项激活
          this.$refs.activeTag.activateExhibition()
          // 调用对应组件的resizeExhibition方法重新计算展示内容高度
          this.$refs.activeTag.resizeExhibition()
        } else {
          // 延迟10毫秒执行
          setTimeout(() => {
            if (this.$refs[oldVal] && this.$refs[oldVal][0]) {
              // 将之前处于展示状态的tab项清除
              this.$refs[oldVal][0].deActivateExhibition()
            }
            if (this.$refs[newVal] && this.$refs[newVal][0]) {
              // 将需要展示的tab项激活
              this.$refs[newVal][0].activateExhibition()
              // 重新计算展示内容高度
              this.$refs[newVal][0].resizeExhibition()
            }
          }, 10)
        }
      },
    },
  },
  methods: {
    // 父组件通过ref调用该组件的deActivateExhibition方法时触发
    onResize() {
      if (this.$refs[this.activeOptionId]) {
        // 通过ref调用子组件的resizeExhibition方法，即子组件的onResize方法
        this.$refs[this.activeOptionId][0] &&
          this.$refs[this.activeOptionId][0].resizeExhibition()
      }
    },
    // 父组件通过ref调用该组件的activateExhibition方法时触发
    onActive() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        // 通过ref调用子组件的activateExhibition方法，即子组件的onActive方法
        this.$refs[this.activeOptionId][0].activateExhibition()
        // 通过ref调用子组件的resizeExhibition方法，即子组件的onResize方法
        this.$refs[this.activeOptionId][0].resizeExhibition()
      }
    },
    // 父组件通过ref调用该组件的deActivateExhibition方法时触发
    onDeActive() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        // 通过ref调用子组件的deActivateExhibition方法，即子组件的onDeActive方法
        this.$refs[this.activeOptionId][0].deActivateExhibition()
      }
    },
    // 父组件通过ref调用该组件的closeExhibition方法时触发
    onClose() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        // 通过ref调用子组件的closeExhibition方法，即子组件的onClose方法
        this.$refs[this.activeOptionId][0].closeExhibition()
      }
    },
    // tab项标签展示时，选中标签时
    changeCheckTag(tag) {
      if (tag.id === this.activeOptionId) return
      // 设置当前激活的tab项
      this.exhibition.activeOptionId = tag.id
    },
    // 导出所有属性表
    exportAllCSV() {
      const { serverType, serverUrl, gdbp, is3dBind2dData } = this.options[0]
      let { serverName } = this.options[0]
      let { domain } = this.options[0]
      if (!domain && !!serverUrl && serverUrl.length > 0) {
        const url = new URL(serverUrl)
        domain = url.origin
      }
      let dataUrl
      switch (serverType) {
        case LayerType.IGSMapImage:
          // 有冒号说明是文件夹里面的服务，新接口支持的格式为文件夹/服务名，因此需将冒号替换成/
          if (serverName.indexOf(':') > -1) {
            serverName = serverName.replace(':', '/')
          }
          dataUrl = `${domain}/igs/rest/services/${serverName}/MapServer/query?f=csv&resultRecordCount=1000`
          break
        case LayerType.IGSScene:
          if (is3dBind2dData) {
            if (serverName.indexOf(':') > -1) {
              serverName = serverName.replace(':', '/')
            }
            dataUrl = `${domain}/igs/rest/services/${serverName}/MapServer/query?f=csv&resultRecordCount=1000`
          } else {
            dataUrl = `${domain}/igs/rest/services/system/ResourceServer/tempData/features/query?url=${gdbp}&f=csv&resultRecordCount=1000`
          }

          break
        default:
          break
      }
      if (!dataUrl) {
        return this.$message.error('此服务不支持导出')
      }
      this.maskShow = true
      axios({
        method: 'get',
        url: dataUrl,
        responseType: 'blob',
      })
        .then((res) => {
          this.downloadCsv(res.data)
        })
        .catch((err) => {
          this.maskShow = false
          this.$message.error('导出失败')
          console.log(err)
        })
    },

    downloadCsv(data) {
      if (!data) {
        return this.$message.error('解析数据为空！')
      }
      const blob = new Blob([`\uFEFF${data}`], {
        type: 'text/csv',
      })
      // 创建一个新的url，此url指向新建的Blob对象
      const url = URL.createObjectURL(data)
      // 创建a标签，并隐藏a标签
      const link = document.createElement('a')
      link.style.display = 'none'
      // a标签的href属性指定下载链接
      link.href = url
      const datetime = Date.now()
      link.download = `attrData_${datetime}.csv`
      link.click()
      link.remove()
      // URL.revokeObjectURL() 静态方法用来释放一个之前已经存在的、通过调用
      URL.revokeObjectURL(url)
      this.maskShow = false
      this.$message.success('导出成功')
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-attribute-table-list {
  padding-top: 2px;
  .exportClass {
    color: $text-color;
    margin-right: 14px;
    &:hover {
      color: $primary-color;
    }
  }
  .mp-attribute-table-tag-container {
    .exportClass {
      margin: 7px 19px 0 0;
    }
  }
  .mp-attribute-table-tag {
    display: flex;
    flex-wrap: wrap;
    max-height: 44px;
    overflow: auto;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>
