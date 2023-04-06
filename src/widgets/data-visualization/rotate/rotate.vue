<template>
  <div class="mp-rotate">
    <mapgis-3d-rotate @loaded="loaded" />
  </div>
</template>

<script lang="ts">
import { WidgetMixin } from '@mapgis/web-app-framework'

export default {
  name: 'MpRotate',
  mixins: [WidgetMixin],
  data() {
    return {
      rotate: undefined,
    }
  },

  methods: {
    loaded(e) {
      this.rotate = e
    },
  },
}
</script>

<style scoped>
.mp-rotate {
  /* width: 300px;
  max-width: 100%;
  margin: 0px 5px 5px 5px; */
}
</style>
