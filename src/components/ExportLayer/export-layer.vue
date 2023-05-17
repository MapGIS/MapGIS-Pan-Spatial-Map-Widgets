<template>
  <mapgis-ui-export-file-modal
    :visible="visible"
    title="导出图层"
    :exportFileTypes="exportFileTypes"
    :exportFileName="exportOptions.exportFileName"
    :exportFileType="exportOptions.exportFileType"
    @cancel="onExportCancel"
    @ok="onExportOk"
  ></mapgis-ui-export-file-modal>
</template>

<script lang="ts">
import {
  LayerType,
  WidgetMixin,
  Feature,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpMetadataInfo',
  props: {
    ip: {
      type: String,
      default: '',
    },
    port: { type: String, default: '' },
    visible: { type: Boolean, default: false },
    gdbp: { type: String, default: '' },
    exportConfig: {
      type: Object,
      default: () => {
        return {
          ip: baseConfigInstance.config.ip,
          port: baseConfigInstance.config.port,
          username: 'admin',
          password: 'sa.mapgis',
        }
      },
    },
  },
  data() {
    return {
      exportOptions: {
        exportFileName: '',
        exportFileType: 'shp格式',
      },
      exportFileTypes: ['shp格式'],
    }
  },
  watch: {
    gdbp: {
      deep: true,
      immediate: true,
      async handler() {
        if (this.gdbp && this.gdbp.length > 0) {
          const srcs = this.gdbp.split('/')
          this.exportOptions.exportFileName = srcs[srcs.length - 1]
        }
      },
    },
  },
  methods: {
    onExportOk(val) {
      this.exportFileName = val.fileName
      this.exportFileType = val.fileType
      const ip =
        this.ip && this.ip !== '' ? this.ip : baseConfigInstance.config.ip
      const port =
        this.port && this.port !== ''
          ? this.port
          : baseConfigInstance.config.port
      const exportIp = this.exportConfig.ip || baseConfigInstance.config.ip
      const exportPort =
        this.exportConfig.port || baseConfigInstance.config.port
      const projectionName =
        baseConfigInstance.config.projectionName || 'EPSG:4326'
      Feature.ExportFeature.ouputToShpOr6x(
        this.exportFileName,
        this.gdbp,
        this.exportFileType,
        ip,
        port,
        exportIp,
        exportPort,
        projectionName
      )
      this.emitFinished()
    },
    onExportCancel() {
      this.emitFinished()
    },
    emitFinished() {
      this.$emit('finished')
    },
  },
}
</script>
<style scoped></style>
