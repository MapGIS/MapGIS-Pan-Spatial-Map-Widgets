<template>
  <div class="mp-attribute-table-list">
    <mapgis-ui-tabs
      v-if="options.length > 0 && options.length <= 9"
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
    <div v-else>
      <div class="mp-attribute-table-tag">
        <mapgis-ui-checkable-tag
          v-for="tag in options"
          :key="tag.id"
          :checked="activeOptionId === tag.id"
        >
          <span @click="changeCheckTag(tag)">{{ tag.name }}</span>
        </mapgis-ui-checkable-tag>
      </div>
      <component
        :is="attributeTableComponent"
        ref="activeTag"
        :option="currentOption"
      />
    </div>
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
    currentOption() {
      return this.options.find((item) => item.id === this.activeOptionId)
    },
  },
  watch: {
    activeOptionId: {
      handler(newVal, oldVal) {
        if (this.options.length > 9) {
          this.$refs.activeTag.deActivateExhibition()
          this.$refs.activeTag.activateExhibition()
          this.$refs.activeTag.resizeExhibition()
        } else {
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
        }
      },
    },
  },
  methods: {
    onResize() {
      if (this.$refs[this.activeOptionId]) {
        this.$refs[this.activeOptionId][0] &&
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
    changeCheckTag(tag) {
      if (tag.id === this.activeOptionId) return
      this.exhibition.activeOptionId = tag.id
    },
  },
}
</script>

<style lang="less" scoped>
.mp-attribute-table-list {
  padding-top: 2px;
  .mp-attribute-table-tag {
    display: flex;
    flex-wrap: wrap;
    max-height: 44px;
    overflow: auto;
  }
}
</style>
