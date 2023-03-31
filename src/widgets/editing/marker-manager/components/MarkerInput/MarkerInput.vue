<template>
  <mapgis-ui-modal
    class="marker-input-wrapper"
    :visible="visible"
    title="输入坐标"
    :width="360"
    :mask="false"
    @cancel="onInputCancel"
    @ok="onInputOk"
  >
    <div class="marker-input-body">
      <mapgis-ui-space direction="vertical" style="flex: 1">
        <mapgis-ui-row>
          <label>坐标系</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-select v-model="inputOptions.crsName" style="width: 100%">
            <mapgis-ui-select-option v-for="item in crsNames" :key="item">
              {{ item }}
            </mapgis-ui-select-option>
          </mapgis-ui-select>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <label>单位</label>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <mapgis-ui-select v-model="inputOptions.unit" style="width: 100%">
            <mapgis-ui-select-option v-for="item in unitTypes" :key="item">
              {{ item }}
            </mapgis-ui-select-option>
          </mapgis-ui-select>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <label>X坐标</label>
        </mapgis-ui-row>
        <mapgis-ui-row v-show="inputOptions.unit === '十进制'">
          <mapgis-ui-input-number v-model.number="inputOptions.coordX" />
        </mapgis-ui-row>
        <mapgis-ui-row
          v-show="inputOptions.unit === '度分秒'"
          type="flex"
          :gutter="[10, 0]"
          align="middle"
        >
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number v-model="inputOptions.degreeX" />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">度</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number v-model="inputOptions.minuteX" />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">分</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number v-model="inputOptions.secondX" />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">秒</mapgis-ui-col>
        </mapgis-ui-row>
        <mapgis-ui-row>
          <label>Y坐标</label>
        </mapgis-ui-row>
        <mapgis-ui-row v-show="inputOptions.unit === '十进制'">
          <mapgis-ui-input-number v-model.number="inputOptions.coordY" />
        </mapgis-ui-row>
        <mapgis-ui-row
          v-show="inputOptions.unit === '度分秒'"
          type="flex"
          :gutter="[10, 0]"
          align="middle"
        >
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number v-model="inputOptions.degreeY" />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">度</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number v-model="inputOptions.minuteY" />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">分</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number v-model="inputOptions.secondY" />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">秒</mapgis-ui-col>
        </mapgis-ui-row>
      </mapgis-ui-space>
    </div>
  </mapgis-ui-modal>
</template>

<script lang="ts">
import {
  UUID,
  Objects,
  markerIconInstance,
  baseConfigInstance,
} from '@mapgis/web-app-framework'
import moment from 'moment'
import MarkerMixin from '../../mixins/marker-add'

export default {
  name: 'MpMarkerInput',
  mixins: [MarkerMixin],

  props: {
    visible: { type: Boolean, default: false },
  },

  // @Emit('added')
  // emitAdded(marker) {}

  // @Emit('finished')
  // emitFinished() {}

  data() {
    return {
      // 底图坐标系
      defaultCrs: baseConfigInstance.config.projectionName,
      // 输入选项
      inputOptions: {
        unit: '十进制',
        coordX: 0,
        coordY: 0,
        degreeX: 0,
        minuteX: 0,
        secondX: 0,
        degreeY: 0,
        minuteY: 0,
        secondY: 0,
        crsName: this.defaultCrs,
      },
      // 坐标单位下拉配置
      unitTypes: ['十进制', '度分秒'],
      // 坐标系下拉配置
      crsNames: baseConfigInstance.config.commonProjection.split(','),
    }
  },
  methods: {
    emitAdded(marker) {
      this.$emit('added', marker)
    },
    emitFinished() {
      this.$emit('finished')
    },
    // 确认按钮回调函数
    async onInputOk() {
      if (this.inputOptions.unit === '度分秒') {
        this.inputOptions.coordX = Objects.AngleConvert.dmsToD(
          Number(this.inputOptions.degreeX),
          Number(this.inputOptions.minuteX),
          Number(this.inputOptions.secondX)
        )
        this.inputOptions.coordY = Objects.AngleConvert.dmsToD(
          Number(this.inputOptions.degreeY),
          Number(this.inputOptions.minuteY),
          Number(this.inputOptions.secondY)
        )
      }
      let pointCoords: number[][] = [
        [Number(this.inputOptions.coordX), Number(this.inputOptions.coordY)],
      ]

      pointCoords = await this.transPoints(
        [[Number(this.inputOptions.coordX), Number(this.inputOptions.coordY)]],
        this.inputOptions.crsName,
        this.defaultCrs
      )

      // 构造marker
      const unSelectIcon = await markerIconInstance.unSelectIcon()

      const feature = {
        geometry: {
          coordinates: [...pointCoords[0]],
          type: 'Point',
        },
        properties: {},
        type: 'Feature',
      }

      const marker = {
        markerId: UUID.uuid(),
        title: `标注 ${moment().format('YYYY-MM-DD HH:mm:ss')}`,
        description: '',
        coordinates: [...pointCoords[0]],
        img: unSelectIcon,
        properties: feature.properties,
        feature,
        picture: '',
      }

      this.emitAdded(marker)
      this.emitFinished()
    },

    onInputCancel() {
      this.emitFinished()
    },
  },
}
</script>

<style lang="less" scoped>
.marker-input-wrapper {
  .marker-input-body {
    display: flex;
    .mapgis-ui-input-number {
      width: 100%;
    }
  }
}
</style>
