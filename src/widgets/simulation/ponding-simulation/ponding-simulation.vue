<template>
  <div>
    <mapgis-3d-ponding-simulation
      @loaded="loaded"
      @isPonding="
        (e) => {
          pond = e
        }
      "
      @costTime="
        (e) => {
          sliderValue = e
        }
      "
      :pondingTime="pondingTime"
      :multiSpeed="multiSpeed"
    />
    <mp-window-wrapper :visible="showTimeline">
      <mapgis-ui-placement
        :position="'bottom-left'"
        v-show="showTimeline"
        :offset="[52, 60]"
        style="right: 0px"
      >
        <mapgis-3d-ponding-simulation-timeline
          v-if="showTimeline"
          :costTime="sliderValue"
          :isPlaying="pond"
          @updateTime="
            (e) => {
              pondingTime = e
            }
          "
          @updateSpeed="
            (e) => {
              multiSpeed = e
            }
          "
          @play="addSimulation"
          @loaded="handleLoaded"
        />
      </mapgis-ui-placement>
    </mp-window-wrapper>
  </div>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpPondingSimulation',
  mixins: [WidgetMixin],
  data() {
    return {
      pondingTime: 24,
      multiSpeed: 1,
      pond: false,
      sliderValue: 0,
      showTimeline: false,
    }
  },

  methods: {
    /**
     * 微件打开时
     */
    onOpen() {
      this.ponding.mounted()
      this.showTimeline = true
    },

    /**
     * 微件关闭时
     */
    onClose() {
      this.ponding.destroyed()
      this.showTimeline = false
    },

    loaded(ponding) {
      this.ponding = ponding
    },

    handleLoaded(timeline) {
      this.timeline = timeline
    },

    addSimulation() {
      this.ponding.addSimulation()
    },
  },
}
</script>

<style lang="less" scoped></style>
