<template>
  <div class="mp-flooding">
    <mapgis-3d-analysis-flood
      v-if="loaded"
      :startHeight="startHeight"
      :minHeight="minHeight"
      :maxHeight="maxHeight"
      :floodColor="floodColor"
      :floodSpeed="floodSpeed"
      :specularIntensity="specularIntensity"
      :amplitude="amplitude"
      :animationSpeed="animationSpeed"
      :frequency="frequency"
      @load="load"
      @showProgress="showProgress"
      @closeProgress="closeProgress"
    />
    <mp-window-wrapper>
      <mp-window
        title="洪水淹没进度"
        anchor="bottom-center"
        :width="350"
        :height="80"
        :verticalOffset="40"
        :shrinkAction="false"
        :fullScreenAction="false"
        :visible="progressVisible"
        @update:visible="clear"
      >
        <mapgis-ui-row type="flex">
          <mapgis-ui-col flex="250px">
            <mapgis-ui-row>
              <mapgis-ui-col>
                <mapgis-ui-slider
                  :min="
                    HeightProgress.startHeightCopy
                      ? HeightProgress.startHeightCopy
                      : 0
                  "
                  :max="
                    HeightProgress.maxHeightCopy
                      ? HeightProgress.maxHeightCopy
                      : 100
                  "
                  :value="currentHeight"
                ></mapgis-ui-slider>
              </mapgis-ui-col>
            </mapgis-ui-row>
            <mapgis-ui-row type="flex" justify="space-between">
              <mapgis-ui-col>{{
                HeightProgress.startHeightCopy
                  ? HeightProgress.startHeightCopy
                  : 0
              }}</mapgis-ui-col>
              <mapgis-ui-col>{{
                HeightProgress.maxHeightCopy
                  ? (HeightProgress.maxHeightCopy +
                      HeightProgress.startHeightCopy) /
                    2
                  : 50
              }}</mapgis-ui-col>
              <mapgis-ui-col>{{
                HeightProgress.maxHeightCopy
                  ? HeightProgress.maxHeightCopy
                  : 100
              }}</mapgis-ui-col>
            </mapgis-ui-row>
          </mapgis-ui-col>
          <mapgis-ui-col style="line-height: 50px" flex="30px"
            >(m)</mapgis-ui-col
          >
          <mapgis-ui-col
            ><mapgis-ui-toolbar-command
              title="开始"
              :icon="isStart ? 'pause-circle' : 'play-circle'"
              @click="start"
          /></mapgis-ui-col>
        </mapgis-ui-row>
      </mp-window>
    </mp-window-wrapper>
  </div>
</template>
<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpFlooding',
  mixins: [WidgetMixin],
  data() {
    return {
      loaded: false,
      startHeight: undefined,
      minHeight: undefined,
      maxHeight: undefined,
      floodColor: undefined,
      floodSpeed: undefined,
      specularIntensity: undefined,
      amplitude: undefined,
      animationSpeed: undefined,
      frequency: undefined,
      floodAnalysis: null,
      progressVisible: false,
      progressData: {},
      currentHeight: undefined,
      isStart: false,
      timer: undefined,
    }
  },
  computed: {
    HeightProgress() {
      return this.progressData
    },
  },

  methods: {
    setConfig(config) {
      const {
        startHeight = 0,
        minHeight = 0,
        maxHeight = 2000,
        floodColor = 'rgba(149,232,249,0.5)',
        floodSpeed = 80,
        specularIntensity = 2,
        amplitude = 10,
        animationSpeed = 0.01,
        frequency = 500,
      } = config
      this.startHeight = startHeight
      this.minHeight = minHeight
      this.maxHeight = maxHeight
      this.floodColor = floodColor
      this.floodSpeed = floodSpeed
      this.specularIntensity = specularIntensity
      this.amplitude = amplitude
      this.animationSpeed = animationSpeed
      this.frequency = frequency

      this.loaded = true
    },

    load(floodAnalysis) {
      this.floodAnalysis = floodAnalysis
    },

    onActive() {
      this.floodAnalysis.mount()
    },

    // 微件失活时
    onDeActive() {
      this.floodAnalysis.unmount()
    },

    // 清除洪水淹没分析结果
    clear() {
      this.floodAnalysis.remove()
    },
    closeProgress() {
      this.progressVisible = false
      this.progressData = {}
      this.currentHeight = undefined
      clearInterval(this.timer)
      this.isStart = false
    },
    showProgress(progressData) {
      this.progressData = JSON.parse(JSON.stringify(progressData))
      this.progressVisible = true
      this.currentHeight = 0
    },
    start() {
      this.floodAnalysis._doAnalysis()
      this.isStart = true
      const { startHeightCopy, maxHeightCopy, floodSpeedCopy } =
        this.progressData
      let count = 1
      this.timer = setInterval(() => {
        this.currentHeight = startHeightCopy + floodSpeedCopy * count
        count++
        if (this.currentHeight >= maxHeightCopy) {
          this.isStart = false
          clearInterval(this.timer)
        }
      }, 1000)
    },
  },
}
</script>

<style lang="less" scoped>
.mp-window-wrapper {
  color: #fff;
  // background-color: rgba(20, 67, 125, 1);
  ::v-deep .window-head {
    border-bottom: none;
    height: 30px;
    line-height: 30px;
  }
  ::v-deep .mapgis-ui-slider-rail {
    background-color: rgba(203, 203, 203, 1);
  }
  ::v-deep .mapgis-ui-slider-handle {
    // background-color: #1890ff;
  }
  ::v-deep .mapgis-ui-toolbar-command {
    line-height: 60px;
    font-size: 25px;
  }
}
</style>
