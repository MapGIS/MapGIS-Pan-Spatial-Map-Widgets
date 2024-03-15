<template>
  <mapgis-ui-row>
    <div v-for="(val, key) in value" :key="key">
      <mapgis-ui-col :span="4">{{ key }}:</mapgis-ui-col>
      <mapgis-ui-col
        v-if="typeof val === 'string' || typeof val === 'number'"
        :span="20"
      >
        {{ val }}</mapgis-ui-col
      >
      <mapgis-ui-col v-else :span="20">
        <metadata-info-component :value="val"></metadata-info-component>
      </mapgis-ui-col>
    </div>
  </mapgis-ui-row>
</template>

<script>
export default {
  name: 'MetadataInfoComponent',
  props: ['value'],
}
</script>
