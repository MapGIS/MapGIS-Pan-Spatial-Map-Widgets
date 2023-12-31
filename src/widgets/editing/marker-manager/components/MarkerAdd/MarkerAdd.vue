<template>
  <div class="marker-add-wrapper">
    <mp-draw-pro ref="draw" @start="onDrawStart" @finished="onDrawFinished" />
    <mp-3d-draw-pro
      ref="draw3d"
      :featureConfig="featureConfig"
      @start="onDrawStart"
      @finished="onDrawFinished"
    >
    </mp-3d-draw-pro>
    <marker-edit-window
      :visible="editWindowVisible"
      v-if="marker"
      :marker="marker"
      @ok="onEditOk"
      @cancel="onEditCancel"
    />
  </div>
</template>

<script lang="ts">
import {
  AppMixin,
  UUID,
  markerIconInstance,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import moment from 'moment'
import MarkerEditWindow from '../MarkerWindow/MarkerEditWindow'

export default {
  name: 'MapboxMarkerAdd',
  mixins: [AppMixin],
  components: { MarkerEditWindow },
  props: {
    isActive: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      marker: null,
      // 编辑对话框的显隐
      editWindowVisible: false,
    }
  },
  // @Emit('added')
  // emitAdded(marker) {}

  // @Emit('finished')
  // emitFinished() {}

  computed: {
    drawComponent() {
      return this.is2DMapMode ? this.$refs.draw : this.$refs.draw3d
    },
    featureConfig() {
      return baseConfigInstance.config.colorConfig.feature
    },
  },
  methods: {
    emitAdded(marker) {
      this.$emit('added', marker)
    },
    emitFinished() {
      this.$emit('finished')
    },
    // 打开标注
    openMark(mode) {
      this.drawComponent && this.drawComponent.openDraw(mode)
    },

    // 关闭标注
    closeMark() {
      this.drawComponent && this.drawComponent.closeDraw()
    },

    // 'start'响应事件(开始绘制)
    onDrawStart() {},

    // 'finished'响应事件(结束绘制)
    async onDrawFinished({ mode, feature, center }) {
      if (!this.isActive) return // 解决标注微件加载后，再使用要素查询、测量等微件进行绘制并且绘制完毕后会触发添加标注弹框的bug
      // 构造marker
      const unSelectIcon = await markerIconInstance.unSelectIcon()

      this.marker = {
        markerId: UUID.uuid(),
        title: `标注 ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
        description: '',
        coordinates: center,
        img: unSelectIcon,
        properties: feature.properties,
        feature,
        picture: '',
      }

      // 同时弹出编辑框
      this.editWindowVisible = true
    },

    // 编辑完成
    onEditOk(marker) {
      this.editWindowVisible = false
      this.emitAdded(marker)
      this.emitFinished()
    },

    // 编辑取消
    onEditCancel() {
      this.editWindowVisible = false
      this.emitFinished()
    },
  },
}
</script>
