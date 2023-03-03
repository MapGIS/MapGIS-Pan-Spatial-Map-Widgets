<template>
  <mapgis-ui-form :label-col="{ span: 2 }" :wrapper-col="{ span: 16 }">
    <div v-for="(item, index) in metadata" :key="index">
      <mapgis-ui-divider v-if="item.length > 1">分组</mapgis-ui-divider>
      <mapgis-ui-form-item
        v-for="({ value, nickName, type }, key) in item"
        :key="key"
        :label="nickName"
      >
        <mapgis-ui-switch
          v-if="`${type}` === '2'"
          :checked="setBool(value)"
          disabled
        />
        <div v-else-if="`${type}` === '5'">
          <mapgis-ui-date-picker
            disabled
            :value="moment(value, 'YYYY-MM-DD')"
            style="width: 50%"
          />
          <mapgis-ui-time-picker
            disabled
            :value="moment(value, 'HH:mm:ss')"
            style="width: 50%"
          />
        </div>
        <mapgis-ui-input v-else :value="value" disabled />
      </mapgis-ui-form-item>
    </div>
  </mapgis-ui-form>
</template>

<script lang="ts">
import {
  LayerType,
  IGSMapImageLayer,
  IGSVectorLayer,
  IGSTileLayer,
  Layer,
} from '@mapgis/web-app-framework'
import momentFromat from 'moment'

export default {
  name: 'MpMetadataInfoCloud',
  props: ['metadata'],
  data() {
    return {
      moment: momentFromat,
    }
  },
  methods: {
    setBool(value) {
      if (value === 'true') {
        return true
      }
      return false
    },
  },
}
</script>

<style lang="less">
.metadata-info-container {
  .layers {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    .layers-title {
      padding-bottom: 8px;
    }
  }
}
</style>
