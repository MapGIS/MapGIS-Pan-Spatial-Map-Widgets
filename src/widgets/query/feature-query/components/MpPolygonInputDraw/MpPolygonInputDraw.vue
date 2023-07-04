<template>
  <div class="gm-tool-content tool-inputPnt">
    <p class="header">
      多边形逐点输入
      <span class="icon-guanbi" title="关闭" @click="$emit('close')">
        <mapgis-ui-ant-icon type="close"></mapgis-ui-ant-icon>
      </span>
    </p>
    <div class="content">
      <mp-input-point
        style="height: calc(100% - 36px)"
        :width="width"
        ref="mpinputpoint"
      ></mp-input-point>
      <mapgis-ui-button size="small" @click="submitInput"
        >确定输入</mapgis-ui-button
      >
    </div>
  </div>
</template>

<script>
import { UUID } from '@mapgis/web-app-framework'
import MpInputPoint from './MpInputPoint.vue'

export default {
  name: 'MpPolygonInputDraw',
  components: { MpInputPoint },
  props: {
    is2DMapMode: Boolean,
    name: {
      type: String,
      default: 'inputPnt',
    },
    width: {
      type: String,
      default: '100%',
    },
    maxHeight: {
      type: Number,
      default: 200,
    },
    color: {
      type: String,
      default: '#3388ff', // 默认颜色
    },
  },
  data() {
    return {
      container: null,
    }
  },
  methods: {
    // 多边形逐点输入
    submitInput() {
      const data = this.$refs.mpinputpoint.getData()
      if (!data) {
        return
      }
      const shapeInfo = {
        type: this.name,
        geometry: data,
        id: UUID.uuid(),
      }
      if (this.is2DMapMode) {
        this.$emit('draw-shape', shapeInfo)
      } else {
        this.$emit('draw-shape-3d', shapeInfo)
      }
      this.$emit('close')
    },
    clear() {},
  },
  watch: {},
  mounted() {},
}
</script>

<style lang="scss" scoped>
.gm-tool-content {
  padding-top: 44px;
  .header {
    padding: 12px;
    font-size: 14px;
    height: 44px;
    margin-top: -44px;
    margin-bottom: 0;
    box-sizing: border-box;
    .icon-guanbi {
      float: right;
      &:hover {
        cursor: pointer;
      }
    }
  }
  .content {
    padding: 10px;
    font-size: 14px;
    height: 100%;
    box-sizing: border-box;
  }
}
</style>
