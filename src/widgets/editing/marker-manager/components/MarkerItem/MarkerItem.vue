<template>
  <div :class="['marker-item', { active }]">
    <div class="content" @click="$emit('goto-marker', marker)">
      <mapgis-ui-toolbar-command-group
        remove-first-command-left-margin
        remove-last-command-right-margin
      >
        <mapgis-ui-toolbar-command
          :icon="icons[marker.feature.geometry.type]"
          title=""
          :hoverBordered="false"
        ></mapgis-ui-toolbar-command>
      </mapgis-ui-toolbar-command-group>
      <div class="name" :title="marker.title">
        {{ marker.title }}
      </div>
    </div>
    <div :class="['actions', actionMenuVisible ? 'actions-visible' : '']">
      <mapgis-ui-iconfont
        type="mapgis-info-circle"
        :title="marker.description"
      />
      <mapgis-ui-popover
        placement="bottomLeft"
        arrow-point-at-center
        v-model="actionMenuVisible"
        trigger="click"
        overlayClassName="marker-manager-popover"
      >
        <mapgis-ui-list slot="content" :gutter="10">
          <mapgis-ui-list-item @click="onDeleteMarker">
            删除
          </mapgis-ui-list-item>
        </mapgis-ui-list>
        <mapgis-ui-iconfont type="mapgis-more" />
      </mapgis-ui-popover>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ name: 'MpMarkerItem' })
export default class MpMarkerItem extends Vue {
  @Prop({ type: Object }) marker

  @Prop({ type: Object }) icons

  @Prop({ type: Boolean }) active

  private actionMenuVisible = false

  onDeleteMarker() {
    this.actionMenuVisible = false
    this.$emit('delete-marker', this.marker)
  }
}
</script>

<style lang="scss" scoped>
.marker-item {
  width: 100%;
  height: 32px;
  cursor: pointer;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  align-items: center;
  .content {
    flex: 1;
    display: flex;
    align-items: center;
    height: 100%;
    border-bottom: 1px solid $item-active-bg;
    .name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .actions {
    display: none;
    .anticon {
      padding-left: 8px;
      cursor: pointer;
      &:hover {
        color: $primary-color;
      }
    }
  }
  &.active {
    background-color: fade($primary-color, 50%);
  }
  &:hover {
    background-color: fade($primary-color, 20%);
    .actions {
      display: block;
    }
  }
  .actions-visible {
    display: block;
  }
}
.marker-manager-popover {
  .mapgis-ui-popover-inner {
    .mapgis-ui-popover-inner-content {
      .mapgis-ui-list-item {
        &:hover {
          background-color: $table-row-hover-bg;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.marker-manager-popover {
  .mapgis-ui-popover-inner {
    overflow: hidden;
    .mapgis-ui-popover-inner-content {
      padding: 0;
      .mapgis-ui-list-item {
        padding: 5px 15px 5px 12px;
        font-size: 12px;
        line-height: 22px;
        &:hover {
          cursor: pointer;
        }
      }
    }
  }
}
</style>
