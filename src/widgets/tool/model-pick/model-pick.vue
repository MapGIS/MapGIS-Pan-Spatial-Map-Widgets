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
  methods: {
    isModelOpenPick(val) {
      eventBus.$emit(events.MODEL_PICK, val)
    },
  },
}
</script>
