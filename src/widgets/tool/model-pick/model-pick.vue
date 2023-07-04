<template>
  <div class="mp-model-pick">
    <mapgis-ui-switch-row-left
      title="开启拾取"
      v-model="isOpenPick"
      @change="isModelOpenPick"
    />
  </div>
</template>
<script lang="ts">
import { WidgetMixin, events, eventBus } from '@mapgis/web-app-framework'

export default {
  name: 'MpModelPick',
  mixins: [WidgetMixin],
  data() {
    return {
      // 是否开启拾取
      isOpenPick: false,
    }
  },
  created() {
    eventBus.$on(events.MODEL_PICK_ADD, this.openPick)
  },

  methods: {
    isModelOpenPick(val) {
      eventBus.$emit(events.MODEL_PICK, val)
    },
    openPick() {
      if (this.isOpenPick) {
        // setTimeout(() => {
        //   this.isModelOpenPick(false)
        // }, 5000)
        setTimeout(() => {
          this.isModelOpenPick(this.isOpenPick)
        }, 5000)
      }
    },
  },
}
</script>
