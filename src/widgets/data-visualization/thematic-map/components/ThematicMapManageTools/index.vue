<template>
  <!-- 侧边工具栏 -->
  <transition name="fade">
    <mp-window-wrapper :visible="visible">
      <mapgis-ui-placement
        v-show="visible"
        class="thematic-map-manage-tools"
        position="center-right"
        :offset="[12, 0]"
      >
        <mapgis-ui-row v-for="item in iconList" :key="item.icon">
          <mapgis-ui-col>
            <mapgis-ui-tooltip placement="left" :title="item.title">
              <!-- {{item.icon}} -->
              <mapgis-ui-iconfont
                :type="item.icon"
                @click.stop="iconChange(item.type)"
              />
            </mapgis-ui-tooltip>
          </mapgis-ui-col>
        </mapgis-ui-row>
      </mapgis-ui-placement>
    </mp-window-wrapper>
  </transition>
</template>
<script lang="ts">
import {
  LayerServiceType,
  mapGetters,
  mapMutations,
  ModuleType,
} from '../../store'

interface IIcon {
  icon: string
  title: string
  type: keyof ModuleType
}

export default {
  name: 'ThematicMapManageTools',
  computed: {
    ...mapGetters(['isVisible', 'subjectData', 'selectedSubjectTimeList']),
    // 按钮列表
    iconList() {
      return this.getIconList()
    },

    // 是否可见
    visible() {
      return this.isVisible(ModuleType.TOOLS) && !!this.iconList.length
    },
  },
  methods: {
    ...mapMutations(['setVisible']),
    /**
     * 获取按钮列表
     */
    getIconList() {
      const list: Array<IIcon> = []
      if (this.subjectData?.table) {
        const tableConfig = {
          icon: 'mapgis-table',
          title: '属性表',
          type: ModuleType.TABLE,
        }
        list.push(tableConfig)
      }
      if (
        this.subjectData?.graph &&
        this.subjectData?.layerServiceType !== LayerServiceType.geojson
      ) {
        const graphConfig = {
          icon: 'mapgis-barchart',
          title: '统计表',
          type: ModuleType.GRAPH,
        }
        list.push(graphConfig)
      }
      if (
        this.selectedSubjectTimeList &&
        this.selectedSubjectTimeList.length > 1
      ) {
        const timelineConfig = {
          icon: 'mapgis-time-circle',
          title: '时间轴',
          type: ModuleType.TIMELINE,
        }
        list.push(timelineConfig)
      }
      return list
    },

    /**
     * 按钮变化
     * @param {string} type 类型
     */
    iconChange(type: keyof ModuleType) {
      this.setVisible(type)
    },
  },
}
</script>

<style lang="scss" scoped>
@import './index.scss';
.thematic-map-manage-tools {
  background-color: $body-background;
  border-radius: $border-radius-base;
  border: 1px solid $border-color-base;
  box-shadow: $box-shadow-base;
  .mapgis-ui-row {
    .anticon {
      color: $primary-color;
    }
    &:not(:last-of-type) .mapgis-ui-col {
      border-bottom: 1px solid $border-color-base;
    }
  }
}
</style>
