<template>
  <div class="heat-map">
    <mapgis-ui-row-flex label="类型选择" :label-width="76">
      <mapgis-ui-radio-group v-model="themeStyle.type">
        <mapgis-ui-radio value="CESIUM">原生</mapgis-ui-radio>
        <mapgis-ui-radio value="MAPV">mapv</mapgis-ui-radio>
      </mapgis-ui-radio-group>
    </mapgis-ui-row-flex>
    <template v-if="isCesium">
      <mapgis-ui-row-flex label="是否聚合" :label-width="76">
        <mapgis-ui-radio-group v-model="themeStyle.useClustering">
          <mapgis-ui-radio :value="true">是</mapgis-ui-radio>
          <mapgis-ui-radio :value="false">否</mapgis-ui-radio>
        </mapgis-ui-radio-group>
      </mapgis-ui-row-flex>
      <mapgis-ui-row-flex label="半径大小" :label-width="76">
        <mapgis-ui-input-number v-model="themeStyle.radius" :min="13" />
      </mapgis-ui-row-flex>
      <mapgis-ui-row-flex label="模糊大小" :label-width="76">
        <mapgis-ui-input-number v-model="themeStyle.blur" :min="0.1" :max="1" />
      </mapgis-ui-row-flex>
    </template>
    <template v-else>
      <mapgis-ui-row-flex label="半径大小" :label-width="72">
        <mapgis-ui-input-number v-model="themeStyle.size" :min="13" />
      </mapgis-ui-row-flex>
      <mapgis-ui-row-flex label="最大权重" :label-width="72">
        <mapgis-ui-input-number v-model="themeStyle.max" :min="1" />
      </mapgis-ui-row-flex>
      <!-- 动画项设置(缺陷列表#108) -->
      <!-- <animation-items v-model="themeStyle.animation" /> -->
    </template>
    <mapgis-ui-row-flex label="渐变颜色" :label-width="76">
      <color-picker-setting v-model="themeStyle.gradient" />
    </mapgis-ui-row-flex>
  </div>
</template>
<script lang="ts">
import ColorPickerSetting from '../../../../common/ColorPickerSetting.vue'
// import AnimationItems from '../../../../common/AnimationItems.vue'

enum HeatMapType {
  MAPV = 'MAPV',
  CESIUM = 'CESIUM',
}

export default {
  name: 'HeatMap',
  components: {
    // AnimationItems,
    ColorPickerSetting,
  },
  props: {
    value: {
      type: Object,
    },
  },
  data() {
    return {}
  },
  watch: {
    'themeStyle.type'(t) {
      this.themeStyle = this.getThemeStyle(t)
    },
  },
  computed: {
    isCesium() {
      return this.themeStyle.type === HeatMapType.CESIUM
    },
    themeStyle: {
      get() {
        return this.value?.themeStyle || this.getThemeStyle()
      },
      set(nV) {
        this.emitChange(nV)
      },
    },
  },
  methods: {
    getThemeStyle(type: keyof HeatMapType = HeatMapType.CESIUM) {
      return {
        type,
        gradient: {
          '0.25': 'rgb(0,0,255)',
          '0.55': 'rgb(0,255,0)',
          '0.85': 'rgb(241,241,15)',
          '1.0': 'rgb(255,0,0)',
        },
        ...(type === HeatMapType.CESIUM
          ? {
              blur: 0.85,
              radius: 20,
              useClustering: true,
            }
          : {
              size: 20,
              max: 100,
            }),
      }
    },

    emitChange(themeStyle) {
      this.$emit('input', { themeStyle })
    },
  },

  created() {
    if (!this.value || !this.value.themeStyle) {
      this.emitChange(this.getThemeStyle())
    }
  },
}
</script>
<style lang="less" scoped>
.heat-map {
  padding: 8px;
  > .mapgis-ui-row-flex:not(:last-of-type) {
    margin-bottom: 8px;
  }
}
</style>
