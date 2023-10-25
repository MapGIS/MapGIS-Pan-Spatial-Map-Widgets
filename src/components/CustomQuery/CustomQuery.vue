<template>
  <mp-field-calculator :queryParams="queryParams" @finish="onFinish" />
</template>

<script lang="ts">
import {
  ExhibitionControllerMixin,
  Exhibition,
} from '@mapgis/web-app-framework'

const { IAttributeTableExhibition, AttributeTableExhibition } = Exhibition

export default {
  name: 'MpCustomQuery',
  props: ['queryParams'],
  mixins: [ExhibitionControllerMixin],
  methods: {
    // 确定
    onFinish(search) {
      const exhibition: IAttributeTableExhibition = { ...this.queryParams }

      exhibition.option.where = search.length > 0 ? `(${search})` : ''

      this.addExhibition(new AttributeTableExhibition(exhibition))
      this.openExhibitionPanel()

      // 关闭窗口
      this.$emit('close')
    },
  },
}
</script>

<style lang="less" scoped></style>
