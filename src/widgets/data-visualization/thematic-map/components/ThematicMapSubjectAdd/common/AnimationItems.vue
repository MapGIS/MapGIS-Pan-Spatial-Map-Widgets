<template>
  <mapgis-ui-dropdown
    class="animation-items"
    :visible="dropdownVisible"
    :trigger="['click']"
  >
    <mapgis-ui-button @click="showDropdown">点击设置</mapgis-ui-button>
    <mp-card
      slot="overlay"
      :box-shadow="true"
      title="动画设置"
      :tools="tools"
      class="animation-items-dropdown"
    >
      <mp-row-flex :span="[6, 18]" label="展示方式" label-align="right">
        {{ animation.type }}
      </mp-row-flex>
      <mp-row-flex :span="[6, 18]" label="拖尾大小" label-align="right">
        <mapgis-ui-input-number v-model="animation.trails" :min="1" />
      </mp-row-flex>
      <mp-row-flex :span="[6, 18]" label="单个时间" label-align="right">
        <mapgis-ui-input-number v-model="animation.duration" :min="1" />
      </mp-row-flex>
      <mp-row-flex :span="[6, 18]" label="起止时间" label-align="right">
        <div class="steps-range">
          <mapgis-ui-space>
            <mapgis-ui-input-number
              v-model="animation.stepsRange.start"
              :min="0"
            />
            <span>至</span>
            <mapgis-ui-input-number
              v-model="animation.stepsRange.end"
              :min="0"
            />
          </mapgis-ui-space>
        </div>
      </mp-row-flex>
    </mp-card>
  </mapgis-ui-dropdown>
</template>
<script lang="ts">
import _cloneDeep from 'lodash/cloneDeep'

export default {
  name: 'AnimationItems',
  props: {
    value: Object,
  },
  data() {
    return {
      dropdownVisible: false,

      animation: {
        type: 'time',
        trails: 10,
        duration: 4,
        stepsRange: {
          start: 0,
          end: 100,
        },
      },

      tools: [
        {
          title: '确认',
          icon: 'check',
          method: this.confirm,
        },
        {
          title: '取消',
          icon: 'close',
          method: this.cancel,
        },
      ],
    }
  },
  watch: {
    value: {
      deep: true,
      handler(nV) {
        if (nV) {
          this.animation = _cloneDeep(nV)
        }
      },
    },
  },
  methods: {
    /**
     * 触发更新
     */
    emitValue(value) {
      this.$emit('input', value)
    },

    /**
     * 展示配置
     */
    showDropdown() {
      this.dropdownVisible = true
    },

    /**
     * 隐藏配置
     */
    hideDropdown() {
      this.dropdownVisible = false
    },

    /**
     * 取消配置
     */
    cancel() {
      this.hideDropdown()
      this.emitValue(this.valu)
    },

    /**
     * 确认
     */
    confirm() {
      this.hideDropdown()
      this.emitValue(this.animation)
    },
  },
}
</script>
<style lang="less" scoped>
.animation-items {
  &-dropdown {
    ::v-deep .mapgis-ui-row-flex:not(:last-of-type) {
      margin-bottom: 10px;
    }
  }
}

.steps-range {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
</style>
