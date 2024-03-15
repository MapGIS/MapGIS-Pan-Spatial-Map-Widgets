<template>
  <div class="json-viewer-container">
    <mapgis-ui-tabs>
      <mapgis-ui-tab-pane
        v-for="(item, key) in metadataCopy"
        :key="key"
        :tab="item.label"
      >
        <div v-for="(item, key) in item.items" :key="key">
          <mapgis-ui-row type="flex">
            <mapgis-ui-col :span="4"> {{ item.key }}: </mapgis-ui-col>
            <mapgis-ui-col :span="20" v-if="typeof item.value === 'string'">
              {{ FormatBoolen(item.value) }}
            </mapgis-ui-col>
            <mapgis-ui-col :span="20" v-else>
              <metadata-info-component
                :value="item.value"
              ></metadata-info-component>
            </mapgis-ui-col>
          </mapgis-ui-row>
        </div>
      </mapgis-ui-tab-pane>
    </mapgis-ui-tabs>
  </div>
</template>

<script>
import MetadataInfoComponent from './MetadataInfoComponent.vue'

export default {
  name: 'MpMetadataInfoJson',
  components: { MetadataInfoComponent },
  props: {
    metadata: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    metadataCopy() {
      return this.metadata.filter((data) => data.items.length > 0)
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
