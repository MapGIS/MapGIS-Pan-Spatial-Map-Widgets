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
  </div>
</template>

<script lang="ts">
import {
  ExhibitionMixin,
  Exhibition,
  LayerType,
} from '@mapgis/web-app-framework'

const { IAttributeTableListExhibition } = Exhibition

export default {
  name: 'MpAttributeTableList',
  mixins: [ExhibitionMixin],
  props: {
    // 属性表选项
    exhibition: {
      type: IAttributeTableListExhibition,
      required: true,
    },
  },
  computed: {
    activeOptionId: {
      get() {
        return this.exhibition.activeOptionId
      },
      set(id: string) {
        this.exhibition.activeOptionId = id
      },
    },
    attributeTableComponent() {
      return 'MpAttributeTable'
    },
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
    currentOption() {
      return this.options.find((item) => item.id === this.activeOptionId)
    },
  },
  watch: {
    activeOptionId: {
      handler(newVal, oldVal) {
        if (this.options.length > 9) {
          this.$refs.activeTag.deActivateExhibition()
          this.$refs.activeTag.activateExhibition()
          this.$refs.activeTag.resizeExhibition()
        } else {
          // 延迟10毫秒执行
          setTimeout(() => {
            if (this.$refs[oldVal] && this.$refs[oldVal][0]) {
              this.$refs[oldVal][0].deActivateExhibition()
            }
            if (this.$refs[newVal] && this.$refs[newVal][0]) {
              this.$refs[newVal][0].activateExhibition()
              this.$refs[newVal][0].resizeExhibition()
            }
          }, 10)
        }
      },
    },
  },
  methods: {
    onResize() {
      if (this.$refs[this.activeOptionId]) {
        this.$refs[this.activeOptionId][0] &&
          this.$refs[this.activeOptionId][0].resizeExhibition()
      }
    },

    onActive() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        this.$refs[this.activeOptionId][0].activateExhibition()
        this.$refs[this.activeOptionId][0].resizeExhibition()
      }
    },

    onDeActive() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        this.$refs[this.activeOptionId][0].deActivateExhibition()
      }
    },

    onClose() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        this.$refs[this.activeOptionId][0].closeExhibition()
      }
    },
    changeCheckTag(tag) {
      if (tag.id === this.activeOptionId) return
      this.exhibition.activeOptionId = tag.id
    },

    exportAllCSV() {
      const { serverType, serverUrl, gdbp } = this.options[0]
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
          dataUrl = `${domain}/igs/rest/services/system/ResourceServer/tempData/features/query?url=${gdbp}&f=csv&resultRecordCount=1000`
          break
        default:
          break
      }
      if (!dataUrl) {
        return this.$message.error('此服务不支持导出')
      }
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = dataUrl
      a.click()
      a.remove()
      this.$message.success('导出成功')
    },
  },
}
</script>

<style lang="less" scoped>
.mp-attribute-table-list {
  padding-top: 2px;
  .exportClass {
    color: var(--text-color);
    margin-right: 14px;
    &:hover {
      color: @primary-color;
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
