<template>
  <div class="model-edit-container">
    <mapgis-ui-form
      labelAlign="left"
      :label-col="{ span: 14 }"
      :wrapper-col="{ span: 10 }"
    >
      <mapgis-ui-form-item label="平移至" />
      <mapgis-ui-form-item label="经度">
        <mapgis-ui-input-number
          v-model="coordinate.longitude"
          :min="0"
          :step="0.0001"
          :precision="4"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="纬度">
        <mapgis-ui-input-number
          v-model="coordinate.latitude"
          :min="0"
          :step="0.0001"
          :precision="4"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="高度">
        <mapgis-ui-input-number
          v-model="coordinate.height"
          :min="0"
          :step="0.0001"
          :precision="4"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <div style="textalign: right">
        <mapgis-ui-button
          type="primary"
          @click="() => $emit('model-edit', 'moveTo', coordinate)"
        >
          开始移动
        </mapgis-ui-button>
      </div>
      <mapgis-ui-form-item label="旋转模型" />
      <mapgis-ui-form-item label="角度">
        <mapgis-ui-input-number
          v-model="rotate.degree"
          :min="0"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="方向">
        <mapgis-ui-select v-model="rotate.axis" style="width: 100%">
          <mapgis-ui-select-option value="Z"> 绕Z轴 </mapgis-ui-select-option>
          <mapgis-ui-select-option value="X"> 绕X轴 </mapgis-ui-select-option>
          <mapgis-ui-select-option value="Y"> 绕Y轴 </mapgis-ui-select-option>
        </mapgis-ui-select>
      </mapgis-ui-form-item>
      <div style="textalign: right">
        <mapgis-ui-button
          type="primary"
          @click="() => $emit('model-edit', 'rotateTo', rotate)"
        >
          开始旋转
        </mapgis-ui-button>
      </div>
      <mapgis-ui-form-item label="缩放至" />
      <mapgis-ui-form-item label="X轴">
        <mapgis-ui-input-number
          v-model="scale.xScale"
          :min="0"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="Y轴">
        <mapgis-ui-input-number
          v-model="scale.yScale"
          :min="0"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="Z轴">
        <mapgis-ui-input-number
          v-model="scale.zScale"
          :min="0"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <div style="textalign: right">
        <mapgis-ui-button
          type="primary"
          @click="() => $emit('model-edit', 'zoomTo', scale)"
        >
          开始缩放
        </mapgis-ui-button>
      </div>
      <mapgis-ui-form-item label="图形化编辑工具" />
      <div class="edit-tools">
        <mapgis-ui-button
          class="edit-tool-button"
          type="primary"
          @click="() => $emit('model-edit', 'move')"
        >
          移动
        </mapgis-ui-button>
        <mapgis-ui-button
          class="edit-tool-button"
          type="primary"
          @click="() => $emit('model-edit', 'rotate')"
        >
          旋转
        </mapgis-ui-button>
        <mapgis-ui-button
          class="edit-tool-button"
          type="primary"
          @click="() => $emit('model-edit', 'zoomSingle')"
        >
          缩放(单轴)
        </mapgis-ui-button>
        <mapgis-ui-button
          class="edit-tool-button"
          type="primary"
          @click="() => $emit('model-edit', 'zoom')"
        >
          缩放(三轴)
        </mapgis-ui-button>
        <mapgis-ui-button
          class="edit-tool-button"
          type="primary"
          @click="() => $emit('model-edit', 'deactivate')"
        >
          取消图形化编辑
        </mapgis-ui-button>
        <mapgis-ui-button
          class="edit-tool-button"
          type="primary"
          @click="() => $emit('model-edit', 'reset')"
        >
          还原模型
        </mapgis-ui-button>
        <!-- <mapgis-ui-button
          class="edit-tool-button"
          type="primary"
          @click="() => (isSave = true)"
        >
          保存模型
        </mapgis-ui-button> -->
      </div>
    </mapgis-ui-form>
  </div>
</template>
<script lang="ts">
export default {
  name: 'MpModelEdit',
  props: ['layer'],
  data() {
    return {
      isSave: false,
      // 平移相关参数
      coordinate: {
        longitude: undefined,
        latitude: undefined,
        height: undefined,
      },

      // 旋转相关参数
      rotate: {
        degree: undefined,
        axis: 'Z',
      },

      // 缩放相关参数
      scale: {
        xScale: undefined,
        yScale: undefined,
        zScale: undefined,
      },
    }
  },

  // 组件销毁前还原模型
  beforeDestroy() {
    this.$emit('model-edit', 'destroy', this.isSave)
  },
}
</script>
<style lang="less" scoped>
.model-edit-container {
  .mapgis-ui-form-item {
    margin-bottom: 6px;
  }
  .edit-tools {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    .edit-tool-button {
      margin-bottom: 6px;
    }
  }
}
</style>
