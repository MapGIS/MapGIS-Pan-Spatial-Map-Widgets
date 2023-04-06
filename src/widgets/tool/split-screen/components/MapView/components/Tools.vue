<template>
  <mapgis-ui-toolbar class="mp-split-screen-toolbar">
    <mapgis-ui-toolbar-title>
      {{ title }}
    </mapgis-ui-toolbar-title>
    <mapgis-ui-toolbar-command-group>
      <mapgis-ui-toolbar-command
        v-for="item in resTools"
        :key="item.label"
        :title="item.label"
        :icon="item.icon"
        @click="onIconClick(item)"
      >
      </mapgis-ui-toolbar-command>
    </mapgis-ui-toolbar-command-group>
  </mapgis-ui-toolbar>
</template>

<script lang="ts">
import { OperationType } from '../store/map-view-state'

interface ITool {
  label: string
  icon: string
  type: keyof OperationType
}

export default {
  name: 'Tools',
  props: {
    title: String,
    excludes: {
      type: [Object, Array],
    },
    tools: Array,
  },
  data() {
    return {
      defaultTools: [
        {
          label: '查询',
          icon: 'search',
          type: OperationType.QUERY,
        },
        {
          label: '放大',
          icon: 'zoom-in',
          type: OperationType.ZOOMIN,
        },
        {
          label: '缩小',
          icon: 'zoom-out',
          type: OperationType.ZOOMOUT,
        },

        {
          label: '复位',
          icon: 'redo',
          type: OperationType.RESTORE,
        },
        {
          label: '清除',
          icon: 'delete',
          type: OperationType.CLEAR,
        },
      ],
    }
  },
  computed: {
    resTools() {
      const _tools =
        this.tools && this.tools.length ? this.tools : this.defaultTools
      return _tools.filter(
        ({ type }) => !this.excludes || !this.excludes.includes(type)
      )
    },
  },
  methods: {
    onIconClick({ type }: ITool) {
      this.$emit('on-click', type)
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-split-screen-toolbar {
  // 有穿透
  .mapgis-ui-toolbar-title {
    color: $primary-color;
  }
}
</style>
