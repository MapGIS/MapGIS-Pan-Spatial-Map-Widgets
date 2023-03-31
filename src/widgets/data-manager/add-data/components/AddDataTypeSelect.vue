<template>
  <mapgis-ui-select
    notFoundContent="请添加类型"
    placeholder="请选择类型"
    :size="size"
    :value="value && value.text"
    @select="onSelect"
  >
    <mapgis-ui-select-option v-for="item in types" :key="item.text">
      {{ item.text }}
    </mapgis-ui-select-option>
  </mapgis-ui-select>
</template>

<script lang="ts">
export default {
  name: 'AddDataTypeSelect',
  props: {
    types: { type: Array },
    size: { type: String, default: 'default' },
    value: { type: Object },
  },

  methods: {
    onSelect(val) {
      this.$emit(
        'select',
        this.types.find((type) => {
          return type.text == val
        })
      )
    },
  },
}
</script>

<style></style>
