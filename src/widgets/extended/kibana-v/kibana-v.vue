<template>
  <div class="mp-widget-kibana-v">
    <mapgis-ui-list
      v-if="config.length"
      :grid="{ gutter: 24, xl: 4, lg: 3, md: 3, sm: 2, xs: 1 }"
      style="margin: 0 -8px"
    >
      <mapgis-ui-list-item
        v-for="(item, index) in config"
        :key="index"
        style="padding: 0 8px"
      >
        <mapgis-ui-card class="kibana-v-card" hoverable @click="onView(item)" :bordered="false">
          <div slot="cover" class="img-box">
            <img :src="item.image" :alt="item.title" />
          </div>
          <mapgis-ui-card-meta>
            <div slot="title" :title="item.title">
              {{ item.title }}
            </div>
          </mapgis-ui-card-meta>
        </mapgis-ui-card>
      </mapgis-ui-list-item>
    </mapgis-ui-list>
    <div class="empty-box" v-else><mapgis-ui-empty /></div>
  </div>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpKibanaV',
  mixins: [WidgetMixin],

  computed: {
    config() {
      return this.widgetInfo.config.map((item) => {
        return {
          title: item.title,
          link: item.link,
          image: `${this.baseUrl}${item.image}`,
        }
      })
    },
  },

  methods: {
    // 点击触发预览
    onView(item) {
      window.open(item.link)
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-kibana-v {
  width: 100%;
  height: 100%;
  padding: 4px;
  .kibana-v-card {
    width: 100%;
    ::v-deep .mapgis-ui-card-body {
      padding: 12px;
    }
    .img-box {
      position: relative;
      height: 0;
      padding-bottom: 50%;
      img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }
    &:hover {
      ::v-deep .mapgis-ui-card-cover {
        transform: scale(1.01);
      }
      ::v-deep .mapgis-ui-card-meta-title {
        color: $primary-color;
      }
    }
  }
  .empty-box {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
