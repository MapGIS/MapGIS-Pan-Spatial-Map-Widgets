<template>
  <!-- 等级符号专题图 -->
  <mapgis-ui-custom-panel ref="staticLabelForm" :options="options" />
</template>
<script lang="ts">
import SubjectStylesMixin from '../../../../mixins/subject-styles-mixin'

export default {
  name: 'StatisticLabel',
  mixins: [SubjectStylesMixin],
  computed: {
    options() {
      return [
        {
          id: this.id,
          type: 'MapgisUiThemeListSymbol',
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
    this.customFormRef = this.$refs.staticLabelForm
  },
}
</script>
