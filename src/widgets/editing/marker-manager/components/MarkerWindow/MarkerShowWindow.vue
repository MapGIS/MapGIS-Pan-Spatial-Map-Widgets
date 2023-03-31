<template>
  <div class="marker-show-wrapper">
    <div class="title" :title="marker.title">{{ marker.title }}</div>
    <div class="body">
      <div class="description">{{ marker.description }}</div>
      <div
        v-if="marker.picture"
        class="picture"
        :style="`background: url('${baseUrl}${marker.picture}') center center / cover no-repeat`"
        @click="onPreviewPicture"
      />
    </div>
    <mapgis-ui-modal
      :visible="previewVisible"
      :footer="null"
      @cancel="onPreviewCancel"
    >
      <img style="width: 100%" :src="`${baseUrl}${marker.picture}`" />
    </mapgis-ui-modal>

    <mapgis-ui-toolbar class="marker-toolbar">
      <mapgis-ui-toolbar-command-group>
        <mapgis-ui-toolbar-command
          class="marker-manager-toolbar-edit-button"
          title="编辑"
          icon="edit"
          @click="onMarkerEdit"
        />
      </mapgis-ui-toolbar-command-group>
    </mapgis-ui-toolbar>

    <marker-edit-window
      :visible="editWindowVisible"
      :marker="marker"
      @ok="onEditOk"
      @cancel="onEditCancel"
    />
  </div>
</template>

<script lang="ts">
import { AppMixin, eventBus } from '@mapgis/web-app-framework'
import MarkerEditWindow from '../MarkerWindow/MarkerEditWindow'

export default {
  name: 'MarkerShowWindow',
  mixins: [AppMixin],
  components: { MarkerEditWindow },

  props: {
    marker: { type: Object, required: true },
  },

  data() {
    return {
      editWindowVisible: false,
      previewVisible: false,
    }
  },

  created() {
    eventBus.$on('marker-manager-toolbar-edit-button-click', (markerId) => {
      if (this.marker.markerId === markerId) {
        this.editWindowVisible = true
      }
    })
  },

  methods: {
    onPreviewPicture() {
      this.previewVisible = true
    },

    onPreviewCancel() {
      this.previewVisible = false
    },

    onMarkerEdit() {
      this.editWindowVisible = true
    },

    // 编辑完成
    onEditOk(marker) {
      this.$set(this.marker, 'title', marker.title)
      this.$set(this.marker, 'description', marker.description)
      this.$set(this.marker, 'picture', marker.picture)
      this.editWindowVisible = false
    },

    // 编辑取消
    onEditCancel() {
      this.editWindowVisible = false
    },
  },
}
</script>

<style lang="scss" scoped>
.marker-show-wrapper {
  max-width: 240px;
  min-width: 200px;
  max-height: 200px;
  display: flex;
  flex-direction: column;
  .title {
    line-height: 33px;
    font-size: 14px;
    color: $title-color;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .body {
    flex: 1;
    overflow: auto;
    .description {
      padding: 5px 0;
      min-height: 20px;
      line-height: 20px;
      font-size: 12px;
      color: $text-color;
      word-break: break-all;
    }
    .picture {
      width: 100%;
      height: 100px;
      cursor: pointer;
    }
  }

  .marker-toolbar {
    flex-direction: row-reverse;
  }
}
</style>
