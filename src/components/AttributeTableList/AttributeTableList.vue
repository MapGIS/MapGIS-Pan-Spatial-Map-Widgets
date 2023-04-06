<template>
  <div class="mp-attribute-table-list">
    <mapgis-ui-tabs
      v-if="options.length > 0"
      v-model="activeOptionId"
      type="card"
      size="small"
      hide-add
    >
      <mapgis-ui-tab-pane
        v-for="option in options"
        :key="option.id"
        :tab="option.name"
      >
        <component
          :is="attributeTableComponent"
          :ref="option.id"
          :option="option"
        />
      </mapgis-ui-tab-pane>
    </mapgis-ui-tabs>
  </div>
</template>

<script lang="ts">
import { ExhibitionMixin, Exhibition } from '@mapgis/web-app-framework'

const { IAttributeTableListExhibition } = Exhibition

export default {
  name: 'MpAttributeTableList',
  mixins: [ExhibitionMixin],
  props: {
    // 属性表选项
    exhibition: {
      type: IAttributeTableListExhibition,
      required: true,
    },
  },
  computed: {
    activeOptionId: {
      get() {
        return this.exhibition.activeOptionId
      },
      set(id: string) {
        this.exhibition.activeOptionId = id
      },
    },
    attributeTableComponent() {
      return 'MpAttributeTable'
    },
    options() {
      return this.exhibition.options
    },
    tableExhibition() {
      return function (option) {
        return {
          id: option.id,
          name: option.name,
          option: option,
        }
      }
    },
  },
  watch: {
    activeOptionId: {
      handler(newVal, oldVal) {
        // 延迟10毫秒执行
        setTimeout(() => {
          if (this.$refs[oldVal] && this.$refs[oldVal][0]) {
            this.$refs[oldVal][0].deActivateExhibition()
          }
          if (this.$refs[newVal] && this.$refs[newVal][0]) {
            this.$refs[newVal][0].activateExhibition()
            this.$refs[newVal][0].resizeExhibition()
          }
        }, 10)
      },
    },
  },
  methods: {
    onResize() {
      if (this.$refs[this.activeOptionId]) {
        this.$refs[this.activeOptionId][0].resizeExhibition()
      }
    },

    onActive() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        this.$refs[this.activeOptionId][0].activateExhibition()
        this.$refs[this.activeOptionId][0].resizeExhibition()
      }
    },

    onDeActive() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        this.$refs[this.activeOptionId][0].deActivateExhibition()
      }
    },

    onClose() {
      if (
        this.$refs[this.activeOptionId] &&
        this.$refs[this.activeOptionId][0]
      ) {
        this.$refs[this.activeOptionId][0].closeExhibition()
      }
    },
  },
}
</script>

<style lang="less" scoped>
.mp-attribute-table-list {
  padding-top: 2px;
}
</style>
