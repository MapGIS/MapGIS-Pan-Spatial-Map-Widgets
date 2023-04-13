<template>
  <div class="mp-widget-terrain-analysis">
    <div class="terrain-analysis-types">
      <div v-for="type in analysis" :key="type.key" class="analysis-type">
        <img
          :src="typeImage(type.image)"
          :class="['analysis-type-img', type.key === tab ? 'active-type' : '']"
          @click="changeTab(type.key)"
        />
        <div class="analysis-type-text">{{ type.title }}</div>
      </div>
    </div>
    <mp-aspect-slope v-show="tab === 'aspectSlope'" ref="aspectSlopeAnalysis" />
    <mp-contour-analysis v-show="tab === 'contour'" ref="contourAnalysis" />
    <mp-flooding v-show="tab === 'flooding'" ref="floodingAnalysis" />
    <mp-cut-fill-analysis v-show="tab === 'cut-fill'" ref="cutFillAnalysis" />
  </div>
</template>

<script lang="ts">
import { WidgetMixin, api } from '@mapgis/web-app-framework'
import MpAspectSlope from './aspect-slope-analysis.vue'
import MpFlooding from './flooding.vue'
import MpCutFillAnalysis from './cut-fill-analysis.vue'
import MpContourAnalysis from './contour-analysis.vue'

export default {
  name: 'MpTerrainAnalysis',
  mixins: [WidgetMixin],
  components: {
    MpAspectSlope,
    MpFlooding,
    MpCutFillAnalysis,
    MpContourAnalysis,
  },

  data() {
    return {
      tab: 'aspectSlope',
      preTab: 'aspectSlope',
      analysis: [
        {
          title: '坡向坡度',
          key: 'aspectSlope',
          image: 'aspect.png',
        },
        {
          title: '等值线',
          key: 'contour',
          image: 'contour.png',
        },
        {
          title: '淹没',
          key: 'flooding',
          image: 'flooding.png',
        },
        {
          title: '填挖方',
          key: 'cut-fill',
          image: 'cut-fill.png',
        },
      ],
    }
  },

  computed: {
    // 获取当前面板对应的组件
    currentAnalysisComponent() {
      return this.getAnalysisComponent(this.tab)
    },

    typeImage() {
      return function (image) {
        return `${this.appAssetsUrl}${this.widgetInfo.uri}/images/${image}`
      }
    },
  },

  methods: {
    getAnalysisComponent(tab: string) {
      if (tab == 'aspectSlope') {
        return this.$refs.aspectSlopeAnalysis
      } else if (tab == 'contour') {
        return this.$refs.contourAnalysis
      } else if (tab == 'flooding') {
        return this.$refs.floodingAnalysis
      } else if (tab == 'cut-fill') {
        return this.$refs.cutFillAnalysis
      }
      return null
    },

    // 切换面板
    changeTab(activeKey: string) {
      this.tab = activeKey
      if (this.preTab !== this.tab) {
        const preAnalysisComponent = this.getAnalysisComponent(this.preTab)
        preAnalysisComponent.onDeActive()
        this.preTab = this.tab
      }
      if (this.tab === 'flooding') {
        this.setFloodConfig()
      }
      if (this.currentAnalysisComponent) {
        this.currentAnalysisComponent.onActive()
      }
    },

    // 微件打开时
    onOpen() {
      this.currentAnalysisComponent.onActive()
    },

    async setFloodConfig() {
      let config = await api.getWidgetConfig('terrain-analysis')
      config = config || {}
      const { floodAnalysis } = config
      this.$refs.floodingAnalysis.setConfig(floodAnalysis)
    },

    // 微件激活时
    onActive() {
      this.currentAnalysisComponent.onActive()
    },

    // 微件关闭时
    onClose() {
      this.currentAnalysisComponent.onDeActive()
    },

    // 微件失活时
    onDeActive() {
      if (this.tab === 'flooding') return
      this.currentAnalysisComponent.onDeActive()
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-terrain-analysis {
  .terrain-analysis-types {
    .analysis-type {
      .analysis-type-img {
        &.active-type,
        &:hover {
          box-shadow: 0 0 0 2px $primary-color;
        }
      }
      .analysis-type-text {
        color: $text-color;
      }
    }
  }
}
</style>

<style lang="scss">
.mp-widget-terrain-analysis {
  .terrain-analysis-types {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin: 4px 0;
    .analysis-type {
      .analysis-type-img {
        height: 48px;
        width: 48px;
        border-radius: 4px;
        padding: 6px;
        cursor: pointer;
      }
      .analysis-type-text {
        width: 100%;
        margin-top: 4px;
        font-size: 12px;
        line-height: 18px;
        text-align: center;
      }
    }
  }
}
</style>
