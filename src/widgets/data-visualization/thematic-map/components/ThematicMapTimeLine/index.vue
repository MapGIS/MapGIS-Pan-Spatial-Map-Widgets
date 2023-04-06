<template>
  <!-- 时间轴 -->
  <mp-window-wrapper :visible="visible">
    <mp-window
      title="时间轴"
      :visible.sync="visible"
      :vertical-offset="50"
      :max-width="360"
      :has-padding="false"
      anchor="bottom-center"
    >
      <div class="thematic-map-time-line">
        <mapgis-ui-spin :spinning="loading">
          <!-- 时间轴 -->
          <mapgis-ui-row-flex
            v-show="timeList.length"
            :span="[2, 22]"
            align="top"
          >
            <template #label>
              <mapgis-ui-tooltip placement="bottom" :title="autoPlay.tooltip">
                <mapgis-ui-iconfont
                  class="thematic-map-time-line-btn"
                  :type="autoPlay.type"
                  @click="btnPlay"
                />
              </mapgis-ui-tooltip>
            </template>
            <div id="thematic-map-time-line-chart" />
          </mapgis-ui-row-flex>
          <!-- 空数据友好提示 -->
          <mapgis-ui-empty v-show="!timeList.length" />
        </mapgis-ui-spin>
      </div>
    </mp-window>
  </mp-window-wrapper>
</template>
<script lang="ts">
import * as echarts from 'echarts'
import { ModuleType, mapGetters, mapMutations } from '../../store'
import { chartOption } from './config/timeLineChartOption'

export default {
  name: 'ThematicMapTimeLine',
  computed: {
    ...mapGetters([
      'loading',
      'isVisible',
      'selectedSubjectTime',
      'selectedSubjectTimeList',
    ]),
    // 时间轴的列表数据
    timeList() {
      return this.selectedSubjectTimeList || []
    },

    // 显示开关
    visible: {
      get() {
        return this.isVisible(ModuleType.TIMELINE) && this.timeList.length > 1
      },
      set(nV) {
        if (!nV) {
          this.resetVisible(ModuleType.TIMELINE)
        }
      },
    },

    // 播放文案和提示设置
    autoPlay() {
      let type = 'mapgis-play-circle'
      let tooltip = '播放'
      if (this.isPlay) {
        type = 'mapgis-pause-circle'
        tooltip = '暂停'
      }
      return { type, tooltip }
    },
  },
  methods: {
    ...mapMutations(['resetVisible', 'setSelectedSubjectTime']),
    /**
     * 播放或暂停
     */
    btnPlay() {
      this.isPlay = this.timeList.length > 1 ? !this.isPlay : false
      this.onUpdateChart()
    },

    /**
     * 重置
     */
    reset() {
      this.currentIndex = 0
      this.isPlay = false
    },

    /**
     * 更新图表
     */
    onUpdateChart() {
      this.$nextTick(() => {
        if (this.chart) {
          this.chart.setOption(
            chartOption({
              currentIndex: this.currentIndex,
              autoPlay: this.isPlay,
              data: this.timeList,
            })
          )
          this.chart.resize()
        }
      })
    },

    /**
     * 时间轴变化
     * @param {object} param
     */
    onTimelinechanged({ currentIndex }) {
      this.currentIndex = currentIndex
      this.setSelectedSubjectTime(this.timeList[currentIndex])
    },

    /**
     * selecteTime变化
     */
    onSelecteTimeChange(value) {
      const index = value ? this.timeList.indexOf(value) : 0
      if (this.currentIndex !== index) {
        this.currentIndex = index
        this.onUpdateChart()
      }
    },
  },
  data() {
    return {
      // 图表
      chart: null,

      // 播放开关
      isPlay: false,

      // 当前播放的数据索引
      currentIndex: 0,
    }
  },
  watch: {
    /**
     * 监听: 显示和隐藏开挂
     */
    visible(nV) {
      if (nV) {
        this.onUpdateChart()
      }
    },
    /**
     * 监听:属性表时间选项的变化,同步更新时间轴当前选中的项
     */
    selectedSubjectTime(nV) {
      this.onSelecteTimeChange(nV)
    },
  },

  mounted() {
    this.chart = echarts.init(
      document.getElementById('thematic-map-time-line-chart')
    )
    this.chart.on('timelinechanged', this.onTimelinechanged)
    this.onSelecteTimeChange(this.selectedSubjectTime)
  },

  beforeDestroy() {
    if (this.chart) {
      this.chart.off('timelinechanged')
    }
  },
}
</script>
<style lang="scss" scoped>
@import './index.less';
.thematic-map-time-line {
  .thematic-map-time-line-btn {
    &:hover {
      color: $primary-color;
    }
  }
}
</style>
