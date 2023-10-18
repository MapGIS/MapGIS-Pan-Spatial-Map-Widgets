<template>
  <div class="coordinate-container">
    <mapgis-ui-setting-form layout="vertical">
      <mapgis-ui-form-item label="坐标系">
        <mapgis-ui-select v-model="crs">
          <mapgis-ui-select-option
            v-for="item in crsOptions"
            :key="item"
            :value="item"
          >
            {{ item }}
          </mapgis-ui-select-option>
        </mapgis-ui-select>
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="单位">
        <mapgis-ui-select :options="typeOptions" v-model="type" />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item>
        <div slot="label">
          <mapgis-ui-row type="flex" align="middle">
            <mapgis-ui-col flex="auto"><label>X坐标</label></mapgis-ui-col>
            <mapgis-ui-col style="display: flex; align-items: center">
              <mapgis-ui-switch size="small" v-model="pickable" />
              <span style="padding-left: 8px">鼠标拾取</span>
            </mapgis-ui-col>
          </mapgis-ui-row>
        </div>
        <mapgis-ui-input-number
          v-if="type === 'd'"
          type="number"
          :max="180"
          :min="-180"
          style="width: 100%"
          v-model="coordDecimal[0]"
          @change="onDecimalCoordChanged"
        />
        <mapgis-ui-row v-else type="flex" align="middle">
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number
              type="number"
              :max="180"
              :min="-180"
              :precision="0"
              v-model="coordDMS[0][0]"
              @change="onDMSCoordChanged"
            />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">度</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number
              type="number"
              :max="60"
              :min="0"
              :precision="0"
              v-model="coordDMS[0][1]"
              @change="onDMSCoordChanged"
            />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">分</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number
              type="number"
              :max="60"
              :min="0"
              v-model="coordDMS[0][2]"
              @change="onDMSCoordChanged"
            />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">秒</mapgis-ui-col>
        </mapgis-ui-row>
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="Y坐标">
        <mapgis-ui-input-number
          v-if="type === 'd'"
          type="number"
          :max="90"
          :min="-90"
          style="width: 100%"
          v-model="coordDecimal[1]"
          @change="onDecimalCoordChanged"
        />
        <mapgis-ui-row v-else type="flex" align="middle">
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number
              type="number"
              :max="90"
              :min="-90"
              :precision="0"
              v-model="coordDMS[1][0]"
              @change="onDMSCoordChanged"
            />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">度</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number
              type="number"
              :max="60"
              :min="0"
              :precision="0"
              v-model="coordDMS[1][1]"
              @change="onDMSCoordChanged"
            />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">分</mapgis-ui-col>
          <mapgis-ui-col :span="6">
            <mapgis-ui-input-number
              type="number"
              :max="60"
              :min="0"
              v-model="coordDMS[1][2]"
              @change="onDMSCoordChanged"
            />
          </mapgis-ui-col>
          <mapgis-ui-col :span="2">秒</mapgis-ui-col>
        </mapgis-ui-row>
      </mapgis-ui-form-item>
      <mapgis-ui-form-item>
        <div slot="label">
          <mapgis-ui-row type="flex" :gutter="[10, 0]" align="middle">
            <mapgis-ui-col flex="auto"><label>比例尺</label></mapgis-ui-col>
            <mapgis-ui-col style="display: flex; align-items: center">
              <mapgis-ui-switch size="small" v-model="frameable" />
              <span style="padding-left: 8px">计算图幅</span>
            </mapgis-ui-col>
          </mapgis-ui-row>
        </div>
        <mapgis-ui-select :options="scaleArray" v-model="scale" />
      </mapgis-ui-form-item>
    </mapgis-ui-setting-form>
    <mapgis-ui-space direction="vertical" style="flex: 1">
      <mapgis-ui-row>
        <label v-show="frameNo" class="frame-text">图幅号：{{ frameNo }}</label>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <mapgis-ui-button
          type="primary"
          @click="onLocate"
          style="width: 100%; margin-top: 10px"
          :disabled="coordDecimal[0].length == 0 || coordDecimal[1].length == 0"
        >
          坐标定位
        </mapgis-ui-button>
      </mapgis-ui-row>
    </mapgis-ui-space>
    <template v-if="active">
      <coordinate-mapbox
        v-if="is2DMapMode"
        :frame-feature="frameFeature"
        :pickable="pickable"
        :coordinate="coordInDefaultCRS"
        :center="center"
        :highlight-style="highlightStyle"
        @picked-coordinate="onPickedCoordinate"
      ></coordinate-mapbox>
      <coordinate-cesium
        v-else
        :frame-feature="frameFeature"
        :pickable="pickable"
        :coordinate="coordInDefaultCRS"
        :center="center"
        :highlight-style="highlightStyle"
        @picked-coordinate="onPickedCoordinate"
      ></coordinate-cesium>
    </template>
  </div>
</template>

<script lang="ts">
import {
  AppMixin,
  Objects,
  Feature,
  api,
  baseConfigInstance,
  ProjectionTransformationUtil,
} from '@mapgis/web-app-framework'
import CoordinateMapbox from './CoordinateMapbox.vue'
import CoordinateCesium from './CoordinateCesium.vue'

export default {
  name: 'MpCoordinate',
  components: { CoordinateMapbox, CoordinateCesium },
  mixins: [AppMixin],
  props: {
    active: {
      type: Boolean,
    },
  },
  data() {
    return {
      // 底图坐标系
      defaultCrs: baseConfigInstance.config.projectionName,

      // 坐标系列表
      crsOptions: baseConfigInstance.config.commonProjection.split(','),

      // 坐标系
      crs: this.defaultCrs,

      // 坐标单位列表
      typeOptions: [
        { label: '十进制', value: 'd' },
        { label: '度分秒', value: 'dms' },
      ],

      // 坐标单位
      type: 'd',

      // 是否可拾取
      pickable: false,

      // 底图坐标
      coordInDefaultCRS: [],

      // 平移中心点
      center: [],

      // 用户坐标
      coordDecimal: ['', ''],

      // 用户坐标度分秒
      coordDMS: [
        ['', '', ''],
        ['', '', ''],
      ],

      // 比例尺列表
      scaleArray: [
        { label: '1:5千', value: 'Scale_5000' },
        { label: '1:1万', value: 'Scale_1w' },
        { label: '1:2万5', value: 'Scale_2w5' },
        { label: '1:5万', value: 'Scale_5w' },
        { label: '1:10万', value: 'Scale_10w' },
        { label: '1:20万', value: 'Scale_20w' },
        { label: '1:25万', value: 'Scale_25w' },
        { label: '1:50万', value: 'Scale_50w' },
        { label: '1:100万', value: 'Scale_100w' },
      ],

      // 比例尺
      scale: 'Scale_20w',

      // 是否计算图幅
      frameable: false,

      frameNo: '',

      frameFeature: {},

      frameConfig: {
        ip: '',
        port: '',
        name: '',
        gdbp: '',
      },
    }
  },
  methods: {
    change(val) {
      this.$emit('change', val)
    },
    async frameNochange(val: string) {
      if (val) {
        const {
          data: { XMin, YMin, XMax, YMax },
        } = await api.getFrameExtentByNo(
          this.frameConfig.ip,
          this.frameConfig.port,
          val,
          baseConfigInstance.config.projectionName,
          baseConfigInstance.config.projectionName
        )
        this.frameFeature = {
          type: 'Feature',
          properties: { name: this.frameNo },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [XMin, YMin],
                [XMax, YMin],
                [XMax, YMax],
                [XMin, YMax],
                [XMin, YMin],
              ],
            ],
          },
        }
        this.change(this.frameFeature)
      }
    },

    async onLocate() {
      let xTemp = this.coordDecimal[0]
      let yTemp = this.coordDecimal[1]

      if (this.crs && this.crs !== this.defaultCrs) {
        // 底图和用户选择的坐标系不一样
        const { data } = await ProjectionTransformationUtil.projectPoints(
          [[Number(xTemp), Number(yTemp)]],
          this.crs,
          this.defaultCrs
        )
        if (data.Code === 1) {
          xTemp = data.Data[0].x
          yTemp = data.Data[0].y
        }
      }

      this.coordInDefaultCRS = [Number(xTemp), Number(yTemp)]
      this.center = [Number(xTemp), Number(yTemp)]

      if (this.frameable) {
        this.getFrameNo()
      } else {
        this.frameFeature = {}

        this.change(this.frameFeature)
      }
    },

    onDecimalCoordChanged() {
      const x = this.coordDecimal[0]
      const y = this.coordDecimal[1]

      const xx = Objects.AngleConvert.dToDms(x)
      this.coordDMS[0][0] = xx.d?.toString()
      this.coordDMS[0][1] = xx.m?.toString()
      this.coordDMS[0][2] = xx.s?.toString()
      const yy = Objects.AngleConvert.dToDms(y)
      this.coordDMS[1][0] = yy.d.toString()
      this.coordDMS[1][1] = yy.m?.toString()
      this.coordDMS[1][2] = yy.s?.toString()
    },

    onDMSCoordChanged() {
      const xDFM = this.coordDMS[0]
      const x = Objects.AngleConvert.dmsToD(
        Number(xDFM[0]),
        Number(xDFM[1]),
        Number(xDFM[2])
      )
      const yDFM = this.coordDMS[1]
      const y = Objects.AngleConvert.dmsToD(
        Number(yDFM[0]),
        Number(yDFM[1]),
        Number(yDFM[2])
      )

      this.coordDecimal = [x.toString(), y.toString()]
    },

    // 地图点击回调方法
    async onPickedCoordinate(val: number[], is2D) {
      if (this.is2DMapMode !== is2D) {
        return
      }
      const [lng, lat] = val

      // 临时修改图上坐标，让标注可以跟随拾取位置移动，后面点击定位按钮后，会再次计算该值
      this.coordInDefaultCRS = [lng, lat]

      let x = lng.toString()
      let y = lat.toString()
      if (this.crs && this.crs !== this.defaultCrs) {
        // 底图和用户选择的坐标系不一样
        const { data } = await ProjectionTransformationUtil.projectPoints(
          [[lng, lat]],
          this.defaultCrs,
          this.crs
        )
        if (data.Code === 1) {
          x = (data.Data[0].x as number).toString()
          y = (data.Data[0].y as number).toString()
        }
      }
      this.coordDecimal = [Number(x), Number(y)]

      const xx = Objects.AngleConvert.dToDms(x)
      this.coordDMS[0][0] = xx.d.toString()
      this.coordDMS[0][1] = xx.m?.toString()
      this.coordDMS[0][2] = xx.s?.toString()
      const yy = Objects.AngleConvert.dToDms(y)
      this.coordDMS[1][0] = yy.d.toString()
      this.coordDMS[1][1] = yy.m?.toString()
      this.coordDMS[1][2] = yy.s?.toString()
    },

    // 计算图幅号
    async getFrameNo() {
      const {
        data: { frameNo },
      } = await api.getFrameNoByCoord(
        this.frameConfig.ip,
        this.frameConfig.port,
        this.coordInDefaultCRS[0],
        this.coordInDefaultCRS[1],
        this.scale,
        baseConfigInstance.config.projectionName,
        this.crs
      )
      this.frameNo = frameNo
      this.frameNochange(frameNo)
    },

    // 清除
    clear() {
      this.pickable = false
      this.frameNo = ''
      this.frameFeature = {}
      this.coordInDefaultCRS = []
      this.center = []
    },
  },
  computed: {
    highlightStyle() {
      return baseConfigInstance.config.colorConfig
    },
  },
  watch: {
    active: {
      immediate: true,
      handler(val) {
        if (!val) {
          this.clear()
        }
      },
    },
    pickable(val) {
      if (!val) {
        this.coordInDefaultCRS = []
        this.center = []
      }
    },
    frameable() {
      if (!this.frameable) {
        this.frameNo = ''
        this.frameFeature = {}
      }
    },
  },

  async mounted() {
    this.frameConfig = await api.getConfig('sheet')
  },
}
</script>

<style lang="scss" scoped>
.coordinate-container {
  .frame-text {
    color: $primary-color;
  }
}
</style>

<style lang="scss">
.coordinate-container {
  display: flex;
  padding: 10px 3px 0 3px;
  flex-direction: column;
}
</style>
