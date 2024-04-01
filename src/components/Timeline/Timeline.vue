<template>
  <div class="mp-timeline">
    <mapgis-ui-row type="flex" align="middle">
      <mapgis-ui-col class="btnClass">
        <mapgis-ui-iconfont
          :type="isPlay ? 'mapgis-zanting' : 'mapgis-play-circle-fill'"
          class="mapgis-play-circle-fill"
          @click="startOrPause"
        /><span>{{ state }}</span>
      </mapgis-ui-col>
      <mapgis-ui-col class="btnClass">
        <mapgis-ui-tooltip>
          <template slot="title">
            <mapgis-ui-input-number
              :min="0.5"
              :max="4"
              :step="0.5"
              v-model="speed"
              :formatter="(value) => `${value}X`"
              :parser="(value) => value.replace('X', '')"
              @change="onSpeedChange"
            ></mapgis-ui-input-number>
          </template>
          <mapgis-ui-iconfont
            type="mapgis-unorderedlist"
            class="mapgis-unorderedlist"
          />
        </mapgis-ui-tooltip>
        <span>倍速</span>
      </mapgis-ui-col>

      <mapgis-ui-col>
        <span>{{ startTime }}</span>
      </mapgis-ui-col>

      <mapgis-ui-col :flex="1">
        <vue-slider
          v-model="playTime"
          :min="0"
          :max="maxSize"
          :process="process"
          :tooltipFormatter="formatter"
          :clickable="false"
          @drag-end="onDragend"
        >
          <template slot="dot" slot-scope="record">
            <div
              class="currentPoint"
              v-if="playTime.length === 3 && record.index === 1"
              :style="{
                display: showCurrentPonit,
              }"
            ></div>
            <div class="endPoint" v-else></div>
          </template>
        </vue-slider>
      </mapgis-ui-col>
      <mapgis-ui-col>
        <span>{{ endTime }}</span>
      </mapgis-ui-col>
      <mapgis-ui-col>
        <div class="currentTime">
          <b>{{ currentPlayTime }}</b>
        </div>
        <div>
          <mapgis-ui-space>
            <span>{{ startPlayTime }}</span
            >~<span>{{ endPlayTime }}</span>
          </mapgis-ui-space>
        </div>
      </mapgis-ui-col>
    </mapgis-ui-row>
  </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import { ExhibitionMixin, Exhibition, Voxel } from '@mapgis/web-app-framework'

const { IAttributeTableExhibition } = Exhibition

export default {
  name: 'MpTimeline',
  components: {
    VueSlider,
  },
  props: {
    exhibition: IAttributeTableExhibition,
  },
  mixins: [ExhibitionMixin],
  data() {
    return {
      // 基准时间时间戳
      baseDate: undefined,
      isPlay: false,
      playTime: [0, 10],
      // 开始时间时间戳
      startTimestamp: 0,
      // 结束时间时间戳
      endTimestamp: 0,
      process: (dotsPos) => {
        if (dotsPos.length === 2) {
          return [[dotsPos[0], dotsPos[1], { backgroundColor: '#6e6f70' }]]
        } else {
          return [
            [dotsPos[0], dotsPos[1], { backgroundColor: '#1890ff' }],
            [dotsPos[1], dotsPos[2], { backgroundColor: '#6e6f70' }],
          ]
        }
      },
      speed: 1,
      maxSize: 1000,
      test: 0,
    }
  },
  computed: {
    timeScale() {
      switch (this.unit) {
        case 'years': {
          return 31536000000
        }
        case 'months': {
          return 259200000
        }
        case 'weeks': {
          return 604800000
        }
        case 'days': {
          return 86400000
        }
        case 'hours': {
          return 3600000
        }
        case 'minutes': {
          return 60000
        }
        case 'seconds': {
          return 1000
        }
        default: {
          return 1
        }
      }
    },
    startTime() {
      return this.formatter(this.startTimestamp, false)
    },
    endTime() {
      return this.formatter(this.endTimestamp, false)
    },
    totalTimestamp() {
      return this.endTimestamp - this.startTimestamp
    },
    startPlayTime() {
      return this.formatter(this.playTime[0])
    },
    endPlayTime() {
      return this.formatter(this.playTime[this.playTime.length - 1])
    },
    currentPlayTime() {
      return this.formatter(
        this.playTime.length > 2 ? this.playTime[1] : this.playTime[0]
      )
    },
    showCurrentPonit() {
      if (this.playTime.length === 2) {
        return 'none'
      } else {
        return this.playTime[1] === this.playTime[0] ||
          this.playTime[1] === this.playTime[2]
          ? 'none'
          : 'block'
      }
    },
    state() {
      return this.isPlay ? '暂停' : '播放'
    },
  },
  created() {
    const voxelMetaData = Voxel.getMetaData(this.exhibition.option.id)
    const {
      dimensions: {
        time: { size },
      },
      variables: {
        time: { values, units },
      },
    } = voxelMetaData
    const unitsArr = units.split(' since ')
    this.baseDate = new Date(unitsArr[1]).getTime() // 获取基准时间
    this.unit = unitsArr[0] // 获取时间单位
    this.maxSize = size - 1
    this.voxel = Voxel.getPrimitives(this.exhibition.option.id)
    this.playTime = [0, this.maxSize]
    // 保存元数据当中的时间信息
    this.values = values
    this.startTimestamp = values[0] * this.timeScale + this.baseDate
    this.endTimestamp =
      values[values.length - 1] * this.timeScale + this.baseDate
  },
  methods: {
    /**
     * @description 将时间戳标准化成 year-month-day hour-min-second的形式
     * @param value  时间戳
     * @param format 是否需要计算基准时间，默认为true
     * @returns String
     */
    formatter(value, format = true) {
      this.test = value
      let time
      if (format) {
        time = this.values[value] * this.timeScale + this.baseDate
      } else {
        time = value
      }
      const date = new Date(time)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hour = date.getHours()
      const min = date.getMinutes()
      const second = date.getSeconds()
      switch (this.unit) {
        case 'years': {
          return `${year}`
        }
        case 'month': {
          return `${year}-${month < 10 ? `0${month}` : month}`
        }
        case 'weeks':
        case 'days': {
          return `${year}-${month < 10 ? `0${month}` : month}-${
            day < 10 ? `0${day}` : day
          }`
        }
        case 'hours': {
          return `${year}-${month < 10 ? `0${month}` : month}-${
            day < 10 ? `0${day}` : day
          }  ${hour < 10 ? `0${hour}` : hour}`
        }
        case 'minutes': {
          return `${year}-${month < 10 ? `0${month}` : month}-${
            day < 10 ? `0${day}` : day
          }  ${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}`
        }
        case 'seconds': {
          return `${year}-${month < 10 ? `0${month}` : month}-${
            day < 10 ? `0${day}` : day
          }  ${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}:${
            second < 10 ? `0${second}` : second
          }`
        }
        default: {
          break
        }
      }
    },
    /**
     * @description 开始或暂停
     * @returns
     */
    startOrPause() {
      if (!this.isPlay) {
        this.isPlay = true
        if (this.playTime.length > 2) {
          if (this.playTime[1] === this.playTime[2]) {
            this.playTime.splice(1, 1, this.playTime[0])
          }
        } else {
          this.playTime.splice(1, 0, this.playTime[0])
        }
        this.timer = setInterval(() => {
          this.$set(this.playTime, 1, this.playTime[1] + 1)
          this.voxel.setPlaybackFrame(this.playTime[1])
          if (this.playTime[1] === this.playTime[2]) {
            this.isPlay = false
            clearInterval(this.timer)
          }
        }, 1000 / this.speed)
      } else {
        this.isPlay = false
        clearInterval(this.timer)
      }
    },
    /**
     * @description 改变速率
     * @returns
     */
    onSpeedChange() {
      this.activateExhibition()
      if (this.isPlay) {
        this.timer && clearInterval(this.timer)
        this.timer = setInterval(() => {
          this.$set(this.playTime, 1, this.playTime[1] + 1)
          this.voxel.setPlaybackFrame(this.playTime[1])
          if (this.playTime[1] === this.playTime[2]) {
            this.isPlay = false
            clearInterval(this.timer)
          }
        }, 1000 / this.speed)
      }
    },
    /**
     * @description 拖拽时间轴上的游标
     * @returns
     */
    onDragend(index) {
      if (this.playTime.length > 2) {
        if (index === 1) {
          this.voxel.setPlaybackFrame(this.playTime[1])
        } else {
          if (this.isPlay) {
            this.isPlay = false
            this.timer && clearInterval(this.timer)
          }
          this.playTime.splice(1, 1)
        }
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-timeline {
  padding: 18px 100px;
  .btnClass {
    display: flex;
    align-items: center;
    span {
      margin: 0px 20px 0 10px;
    }
  }
  .mapgis-play-circle-fill {
    cursor: pointer;
    font-size: 24px;
    &:hover {
      color: $hover-color;
    }
  }
  .mapgis-unorderedlist {
    cursor: pointer;
    font-size: 24px;
    &:hover {
      color: $hover-color;
    }
  }
  /deep/ .vue-slider-rail {
    height: 5px !important;
  }
  .endPoint {
    margin-left: 5px;
    width: 5px;
    height: 13px;
    cursor: pointer;
    background-color: #919191;
  }
  .currentPoint {
    width: 8px;
    height: 8px;
    margin-top: 2px;
    margin-left: 3px;
    border-radius: 50%;
    background-color: #1890ff;
  }
  .mapgis-ui-col {
    margin-right: 40px;
    &:nth-child(3) {
      margin-right: 0px;
    }
    &:nth-child(4) {
      margin-left: 20px;
      margin-right: 20px;
    }
    &:nth-child(6) {
      margin-right: 0px;
    }
  }

  .currentTime {
    text-align: center;
    font-size: 24px;
  }
}
</style>
