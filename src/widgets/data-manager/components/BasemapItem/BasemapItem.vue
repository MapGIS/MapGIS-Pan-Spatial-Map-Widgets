<template>
  <div :class="['basemap-item', { active }]" @click="onClick">
    <div class="item-image">
      <img :src="image" />
    </div>
    <div class="item-name">
      <mapgis-ui-icon :icon="icon" v-if="icon" />
      {{ name }}
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'MpBasemapItem',
  props: {
    name: String,
    image: String,
    active: Boolean,
    icon: String,
    guid: String,
  },
  methods: {
    onClick() {
      if (!this.active) {
        this.$emit('select', this.guid)
      } else {
        this.$emit('un-select', this.guid)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.basemap-item {
  display: inline-block;
  vertical-align: top;
  margin: 8px;
  width: 120px;
  text-align: center;
  cursor: pointer;
  .item-image {
    position: relative;
    width: 100%;
    height: 0;
    padding-top: 66.5%; /*相对于这个盒子的宽度设置的，为保证图片比例，其值=width * 80%*/
    box-sizing: border-box;
    img {
      border: solid 1px $border-color;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 5px;
    }
  }
  .item-name {
    line-height: 24px;
    font-size: 14px;
    text-align: center;
    word-wrap: break-word;
    white-space: pre-wrap;
  }
  &:hover {
    .item-image {
      img {
        box-shadow: 0 0 8px $shadow-color, 0 0 8px $shadow-color;
      }
    }
    .item-name {
      text-decoration: underline;
    }
  }
  &.active {
    .item-image {
      img {
        border: double 4px $primary-color;
      }
    }
    .item-name {
      color: $primary-color;
    }
  }
}
</style>
