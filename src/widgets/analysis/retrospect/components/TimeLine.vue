<template>
  <div :id="id" class="time-line-chart" />
</template>

<script lang="ts">
import * as echarts from 'echarts'

export default {
  name: 'TimeLine',
  data() {
    return {
      chart: null,
    }
  },
  props: {
    id: String,
    value: {
      default: 0,
      type: Number,
    },
    timeLineList: {
      default: () => [],
      type: Array,
    },
    playInterval: {
      default: 3,
      type: Number,
    },
    autoPlay: {
      default: false,
      type: Boolean,
    },
  },

  computed: {
    timelineOptions() {
      return {
        currentIndex: this.value,
        autoPlay: this.autoPlay,
        playInterval: this.playInterval * 1000,
        data: this.timeLineList,
      }
    },
    option() {
      return {
        baseOption: {
          timeline: {
            ...this.timelineOptions,
            axisType: 'category',
            symbol: 'diamond',
            padding: 0,
            left: 0,
            right: 0,
            controlStyle: {
              itemSize: 15,
              itemGap: 5,
              normal: { color: '#333' },
              emphasis: { color: '#1e90ff' },
              showPlayBtn: false,
            },
            lineStyle: { color: '#666', width: 1, type: 'dashed' },
            checkpointStyle: {
              symbol: 'diamond',
              symbolSize: 14,
              borderColor: 'auto',
              borderWidth: 'auto',
              label: { show: false, textStyle: { color: 'auto' } },
            },
            trigger: 'axis',
            axisPointer: {
              // 坐标轴指示器，坐标轴触发有效
              type: 'shadow', // 默认为直线，可选为：'line' | 'shadow'
            },
          },
          tooltip: {
            position: 'bottom',
          },
        },
      }
    },
    chartEl() {
      return document.getElementById(this.id)
    },
  },

  watch: {
    timelineOptions: {
      deep: true,
      handler: 'timelineOptionsChange',
    },
  },

  mounted() {
    this.chart = echarts.init(this.chartEl as HTMLDivElement)
    this.chart.on('timelinechanged', ({ currentIndex }) =>
      this.$emit('input', currentIndex)
    )
    this.chart.setOption(this.option, true)
  },

  methods: {
    timelineOptionsChange() {
      this.chart.setOption(this.option, true)
    },

    resize(width) {
      if (this.chart) {
        this.chartEl.style.width = width
        this.chart.resize({ width })
      }
    },
  },

  beforeDestroy() {
    if (this.chart) {
      this.chart.off('timelinechanged')
    }
  },
}
</script>

<style lang="less" scoped>
.time-line-chart {
  width: 288px;
  height: 48px;
  margin: 10px 0 10px;
}
</style>
