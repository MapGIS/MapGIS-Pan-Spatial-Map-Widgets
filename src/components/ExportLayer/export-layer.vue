<template>
  <div class="mp-widget-export-file">
    <mapgis-ui-export-file-modal
      :visible="visible"
      title="导出图层"
      :exportFileTypes="exportFileTypes"
      :exportFileName="exportOptions.exportFileName"
      :exportFileType="exportOptions.exportFileType"
      @cancel="onExportCancel"
      @ok="onExportOk"
    ></mapgis-ui-export-file-modal>
  </div>
</template>

<script lang="ts">
import { Mixins, Component, Watch, Prop, Emit } from 'vue-property-decorator'
import {
  LayerType,
  WidgetMixin,
  Feature,
  baseConfigInstance,
} from '@mapgis/web-app-framework'

@Component({
  name: 'MpExportLayer',
})
export default class MpExportLayer extends Mixins(WidgetMixin) {
  @Emit('finished')
  emitFinished() {}

  @Prop({ type: String, default: '' }) ip

  @Prop({ type: String, default: '' }) port

  @Prop({ type: Boolean, default: false }) visible

  @Prop({ type: String, default: '' }) gdbp

  @Prop({
    type: Object,
    default: () => {
      return {
        ip: baseConfigInstance.config.ip,
        port: baseConfigInstance.config.port,
        username: 'admin',
        password: 'sa.mapgis',
      }
    },
  })
  exportConfig

  @Watch('gdbp', { immediate: true })
  getExportFileName() {
    if (this.gdbp && this.gdbp.length > 0) {
      const srcs = this.gdbp.split('/')
      this.exportOptions.exportFileName = srcs[srcs.length - 1]
    }
  }

  // 表单数据
  private exportOptions = {
    exportFileName: '',
    exportFileType: 'shp格式',
  }

  // 导出格式下拉项配置
  private exportFileTypes = ['shp格式']

  onExportOk(val) {
    this.exportFileName = val.fileName
    this.exportFileType = val.fileType
    const ip =
      this.ip && this.ip !== '' ? this.ip : baseConfigInstance.config.ip
    const port =
      this.port && this.port !== '' ? this.port : baseConfigInstance.config.port
    const exportIp = this.exportConfig.ip || baseConfigInstance.config.ip
    const exportPort = this.exportConfig.port || baseConfigInstance.config.port
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
  }

  onExportCancel() {
    this.emitFinished()
  }
}
</script>
<style scoped></style>
