<template>
  <div class="json-viewer-container">
    <mapgis-ui-tabs>
      <mapgis-ui-tab-pane
        v-for="(item, key) in metadata"
        :key="key"
        :tab="item.label"
      >
        <div v-for="(item, key) in item.items" :key="key">
          <mapgis-ui-row type="flex">
            <mapgis-ui-col :span="4"> {{ item.key }}: </mapgis-ui-col>
            <mapgis-ui-col :span="20">
              {{ FormatBoolen(item.value) }}
            </mapgis-ui-col>
          </mapgis-ui-row>
        </div>
      </mapgis-ui-tab-pane>
    </mapgis-ui-tabs>
  </div>
</template>

<script>
export default {
  name: 'MpMetadataInfoJson',
  props: {
    metadata: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    // 布尔值用‘是’，‘否’返回，其他类型返回原值
    FormatBoolen(value) {
      if (typeof value !== 'boolean') {
        return value
      }
      if (value === true) {
        return '是'
      } else {
        return '否'
      }
    },
  },
}
</script>

<style scoped lang="less">
/deep/.mapgis-ui-tabs-tabpane {
  padding-left: 20px;
}
/deep/ .mapgis-ui-row-flex {
  padding-bottom: 10px;
}
</style>
