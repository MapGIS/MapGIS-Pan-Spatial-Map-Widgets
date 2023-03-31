<template>
  <mapgis-ui-select
    notFoundContent="请添加分类"
    placeholder="请选择分类"
    :value="value"
    :size="size"
    @select="onSelect"
  >
    <mapgis-ui-select-option
      v-for="item in categories"
      :key="item.name"
      :title="item.description"
    >
      {{ item.name }}
    </mapgis-ui-select-option>
  </mapgis-ui-select>
</template>

<script lang="ts">
export default {
  name: 'AddDataCategorySelect',
  props: {
    categories: { type: Array },
    size: { type: String, default: 'default' },
    value: { type: String },
  },

  methods: {
    onSelect(val) {
      this.$emit('select', val)
    },
  },
}
</script>

<style></style>
