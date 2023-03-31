<template>
  <div class="subject-items">
    <!-- 设置面板头部 -->
    <mapgis-ui-toolbar :bordered="false" class="subject-items-head">
      <mapgis-ui-toolbar-title :has-padding="false">
        专题图设置
      </mapgis-ui-toolbar-title>
      <mapgis-ui-toolbar-command-group>
        <mapgis-ui-toolbar-command @click="add" title="新增" icon="plus" />
        <template v-if="configList.length">
          <template v-if="!showCheckbox">
            <mapgis-ui-toolbar-command @click="edit" title="编辑" icon="edit" />
          </template>
          <template v-else>
            <mapgis-ui-toolbar-command
              @click="remove"
              title="删除"
              icon="delete"
            />
            <mapgis-ui-toolbar-command
              @click="cancel"
              title="取消"
              icon="close"
            />
          </template>
        </template>
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-toolbar>
    <!-- 设置面板内容 -->
    <div class="subject-items-content">
      <mapgis-ui-empty class="subject-items-empty" v-if="!configList.length" />
      <mapgis-ui-collapse
        v-else
        @change="panelChange"
        :activeKey="activePanel"
        :accordion="true"
        class="subject-items-collapse"
      >
        <mapgis-ui-collapse-panel v-for="(config, i) in configList" :key="i">
          <!-- 年度/时间 -->
          <mapgis-ui-row-flex
            slot="header"
            :span="panelHeaderSpan"
            justify="space-between"
          >
            <mapgis-ui-input
              slot="label"
              @click.stop
              @blur="timeBlur(config.time)"
              v-model="config.time"
              size="small"
              placeholder="请输入年度/时间"
              class="subject-items-time"
            />
            <mapgis-ui-checkbox
              @click.stop
              @change="checked($event, config, i)"
              v-show="showCheckbox"
              :checked="config._checked"
            />
          </mapgis-ui-row-flex>
          <!-- 服务设置等公共设置项 -->
          <common
            @change="configChange($event, config)"
            :subject-config="config"
          />
          <!-- 样式、属性表、统计表、弹框配置 -->
          <mapgis-ui-tabs type="card" size="small" class="subject-items-card">
            <mapgis-ui-tab-pane
              v-for="{ key, tab } in configTabList"
              :key="key"
              :tab="tab"
            >
              <component
                @change="configChange($event, config)"
                :subject-config="config"
                :subject-type="subjectType"
                :is="key"
              />
            </mapgis-ui-tab-pane>
          </mapgis-ui-tabs>
        </mapgis-ui-collapse-panel>
      </mapgis-ui-collapse>
    </div>
  </div>
</template>
<script lang="ts">
import { ISubjectType, INewSubjectConfig } from '../../../../store'
import Common from './components/Common.vue'
import SubjectStyles from './components/SubjectStyles'
import AttributeTable from './components/AttributeTable.vue'
import StatisticGragh from './components/StatisticGragh.vue'
import Popup from './components/Popup.vue'

export default {
  name: 'SubjectItems',
  components: {
    Common,
    SubjectStyles,
    AttributeTable,
    StatisticGragh,
    Popup,
  },
  props: {
    subjectType: {
      type: String,
    },
    value: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      activePanel: '0',

      showCheckbox: false,

      checkedPanels: [],
    }
  },
  computed: {
    configTabList() {
      if (
        this.subjectType === 'DataShowSubject' ||
        this.subjectType === 'HeatMap' ||
        this.subjectType === 'StatisticLabel' ||
        this.subjectType === 'Label' ||
        this.subjectType === 'HexBin'
      ) {
        return [
          {
            key: 'SubjectStyles',
            tab: '样式配置',
          },
          {
            key: 'AttributeTable',
            tab: '表格配置',
          },
          {
            key: 'StatisticGragh',
            tab: '统计图配置',
          },
        ]
      }
      return [
        {
          key: 'SubjectStyles',
          tab: '样式配置',
        },
        {
          key: 'AttributeTable',
          tab: '表格配置',
        },
        {
          key: 'StatisticGragh',
          tab: '统计图配置',
        },
        {
          key: 'Popup',
          tab: '弹框配置',
        },
      ]
    },

    panelHeaderSpan() {
      return this.showCheckbox ? [23, 1] : [24, 0]
    },
    configList: {
      get() {
        return this.value
      },
      set(config) {
        this.$emit('input', config)
      },
    },
  },
  methods: {
    /**
     * 更新属性
     */
    setProperties(source, target) {
      for (const key in source) {
        this.$set(target, key, source[key])
      }
    },

    /**
     * 面板change
     */
    panelChange(key: string) {
      this.activePanel = key
    },

    /**
     * 专题配置change
     */
    configChange(newConfig: Record<string, any>, config: INewSubjectConfig) {
      this.setProperties(newConfig, config)
      console.log('配置数据', { ...config })
    },

    /**
     * 专题图年度输入失焦
     */
    timeBlur(time: string) {
      if (this.configList.filter((c) => time && c.time === time).length > 1) {
        this.$message.warning(
          `存在相同的年度"${time}"， 若继续保存，将会保存最新配置的年度`
        )
      }
    },

    /**
     * 新增年度
     */
    add() {
      debugger
      const node = {
        time: '',
        _checked: false,
      }
      this.configList = this.configList.concat(node)
      this.showCheckbox = false
    },

    /**
     * 编辑
     */
    edit() {
      this.showCheckbox = !this.showCheckbox
    },

    /**
     * 移除年度
     */
    remove() {
      if (!this.checkedPanels.length) {
        this.$message.warning('请选择需要删除的年度')
        return
      }
      this.checkedPanels.forEach((index) => this.configList.splice(index, 1))
    },

    /**
     * 选中年度
     */
    checked(e: Event, config: Record<string, unknown>, index: number) {
      e.stopPropagation()
      const { checked } = e.target
      this.$set(config, '_checked', checked)
      if (checked) {
        this.checkedPanels.push(index)
      } else {
        this.checkedPanels.splice(index, 1)
      }
    },

    /**
     * 取消选中年度
     */
    cancel() {
      this.showCheckbox = false
      this.checkedPanels = []
      this.configList.forEach((v) => this.$set(v, '_checked', false))
    },
  },
}
</script>
<style lang="less">
@import './index.less';
</style>

<style lang="scss" scoped>
.subject-items {
  .mapgis-ui-collapse {
    .mapgis-ui-collapse-item {
      border-bottom: 1px solid $border-color-base;
      // 需要穿透
      .mapgis-ui-collapse-header {
        border-left: none !important;
      }
      .mapgis-ui-tabs-content {
        color: $text-color !important;
        border-top: 1px solid $border-color-base;
      }
    }
  }
  border: 1px solid $border-color-base;
  &-head {
    border-bottom: 1px solid $border-color-base;
  }
  &-collapse.mapgis-ui-collapse {
    .mapgis-ui-collapse-item {
      .mapgis-ui-collapse-header {
        color: $text-color-secondary;
      }
    }
  }
  &-card.mapgis-ui-tabs.mapgis-ui-tabs-card {
    .mapgis-ui-tabs-bar {
      border-color: $white;
    }

    .mapgis-ui-tabs-content {
      background: $white;
    }

    .mapgis-ui-tabs-tab {
      &-active {
        border-color: $white;
        background: $white;
      }
    }
  }
}
::v-deep .mapgis-ui-empty {
  .mapgis-ui-empty-image {
    height: 100% !important;
  }
}
</style>
