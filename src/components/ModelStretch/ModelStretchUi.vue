<template>
  <div>
    <mapgis-ui-switch-panel
      size="default"
      label="模型拉伸"
      v-model="syncedEnableModelStretch"
    >
      <mapgis-ui-input-number-panel
        v-model="syncedScaleZ"
        size="large"
        :step="0.5"
        :slider="true"
        :range="[1, 20]"
        label="拉伸级别"
      />
      <mapgis-ui-form-item label="偏移量">
        <mapgis-ui-input-number-addon
          v-model.number="syncedOffset"
          :step="0.5"
          addon-after="米"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form
        labelAlign="left"
        :label-col="{ span: 14 }"
        :wrapper-col="{ span: 10 }"
      >
        <mapgis-ui-form-item label="纹理缩放">
          <mapgis-ui-switch v-model="syncedTextureScale" size="small" />
        </mapgis-ui-form-item>
      </mapgis-ui-form>
    </mapgis-ui-switch-panel>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MpModelStretchUi',
  props: {
    enableModelStretch: {
      type: Boolean,
      default: false,
    },
    scaleZ: {
      type: Number,
      default: 1,
    },
    offset: {
      type: Number,
      default: -2,
    },
    // 1、现有接口只针对平铺纹理；2、顶部和底部纹理可能会变形。
    textureScale: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {}
  },
  computed: {
    // 同步属性enableModelStretch
    syncedEnableModelStretch: {
      get() {
        return this.enableModelStretch
      },
      set(value) {
        this.$emit('update:enableModelStretch', value)
      },
    },
    // 同步属性scaleZ
    syncedScaleZ: {
      get() {
        return this.scaleZ
      },
      set(value) {
        this.$emit('update:scaleZ', value)
      },
    },
    // 同步属性offset
    syncedOffset: {
      get() {
        return this.offset
      },
      set(value) {
        this.$emit('update:offset', value)
      },
    },
    // 同步属性textureScale
    syncedTextureScale: {
      get() {
        return this.textureScale
      },
      set(value) {
        this.$emit('update:textureScale', value)
      },
    },
  },
  mounted() {},
  methods: {},
}
</script>
