<template>
  <!-- 分段专题图配置 -->
  <mapgis-ui-custom-panel ref="rangeForm" :options="options" />
</template>
<script lang="ts">
import SubjectStylesMixin from '../../../../mixins/subject-styles-mixin'

export default {
  name: 'SubSectionMap',
  mixins: [SubjectStylesMixin],
  computed: {
    options() {
      return [
        {
          id: this.id,
          type: 'MapgisUiThemeList',
          props: {
            size: 'small',
            field: this.field,
            dataSource: this.dataSource,
          },
          customProps: {
            showBorder: false,
          },
        },
      ]
    },
  },

  mounted() {
    this.customFormRef = this.$refs.rangeForm
  },
}
</script>
