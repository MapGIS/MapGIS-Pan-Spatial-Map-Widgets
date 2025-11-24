<template>
  <div class="change-m3d-props-container">
    <mapgis-ui-form
      labelAlign="left"
      :label-col="{ span: 10 }"
      :wrapper-col="{ span: 14 }"
    >
      <mapgis-ui-form-item label="填充颜色">
        <mapgis-ui-sketch-color-picker
          :color="labelClass.symbol.color"
          style="width: 100%"
          @input="(value) => changeColor(value, 'color')"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="描边颜色">
        <mapgis-ui-sketch-color-picker
          :color="labelClass.symbol.haloColor"
          @input="(value) => changeColor(value, 'haloColor')"
          style="width: 100%"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="文字大小">
        <mapgis-ui-input-number
          v-model="labelClass.symbol.font.size"
          :min="1"
          :step="1"
          style="width: 100%"
          @change="changeSize($event, 'fontSize')"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="描边宽度">
        <mapgis-ui-input-number
          v-model="labelClass.symbol.haloSize"
          :min="0"
          :step="0.1"
          style="width: 100%"
          @change="changeSize($event, 'haloSize')"
        />
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="渲染方式">
        <mapgis-ui-select
          v-model="labelClass.renderMode"
          style="width: 100%"
          @change="chooseRenderMode"
        >
          <mapgis-ui-select-option
            v-for="renderMode in renderModes"
            :key="renderMode.key"
            :value="renderMode.key"
          >
            {{ renderMode.value }}
          </mapgis-ui-select-option>
        </mapgis-ui-select>
      </mapgis-ui-form-item>
      <mapgis-ui-form-item label="开启避让">
        <mapgis-ui-switch
          v-model="enabelDeconflictionStrategy"
          @change="changeDeconflictionStrategy"
        />
      </mapgis-ui-form-item>
    </mapgis-ui-form>
    <mp-change-extensions
      :extensions.sync="extensions"
      :type="
        this.layerInfo.layer ? this.layerInfo.layer.type : this.layerInfo.type
      "
    ></mp-change-extensions>
  </div>
</template>

<script lang="ts">
import MpChangeExtensions from '../ChangeExtensions/ChangeExtensions.vue'
import { LabelClass, Color } from '@mapgis/webclient-common'

export default {
  name: 'ChangeAnnotationProps',
  components: {
    'mp-change-extensions': MpChangeExtensions,
  },
  props: ['layerInfo', 'layerIndex'],
  data() {
    return {
      // 面板显示信息对象
      labelClass: {},
      // 注记显示模式
      renderModes: [
        { key: 'canvas', value: 'Canvas绘制' },
        { key: 'label', value: 'Label绘制' },
        { key: 'ground', value: '贴地绘制' },
      ],
      // 注记是否避让
      enabelDeconflictionStrategy: true,
    }
  },
  computed: {
    // 可以让用户自定义注记参数
    extensions: {
      get() {
        return JSON.stringify([this.labelClass])
      },
      set(val) {
        this.updataLabelingInfo(JSON.parse(val))
      },
    },
  },
  watch: {},
  created() {
    this.init()
  },
  methods: {
    /**
     * 初始化显示参数
     */
    init() {
      const subLayer =
        this.layerInfo.layer._innerLayer.activeScene.findSublayerById(
          this.layerIndex
        )
      if (subLayer) {
        // 针对同一个注记图层，可以有多个注记参数，当前面板仅支持编辑第一个注记参数的部分参数，其他参数在高级属性中更改
        // 后续有时间可以更新为编辑所有注记参数
        if (subLayer.labelingInfo.length > 0) {
          this.labelClass = LabelClass.fromJSON(subLayer.labelingInfo[0])
        }
        // 如果没有，则创建一个空的
        else {
          this.labelClass = new LabelClass().toJSON()
        }
        const { color, haloColor } = this.labelClass.symbol
        // 设置颜色拾取组件的颜色参数
        this.labelClass.symbol.color = this.getRGBAColorString(color)
        this.labelClass.symbol.haloColor = this.getRGBAColorString(haloColor)
        // 设置是否启用注记避让参数
        this.enabelDeconflictionStrategy =
          this.labelClass.deconflictionStrategy === 'static'
      }
    },
    /**
     * 根据类型，修改注记颜色
     * @param {Object} value 颜色拾取组件返回的值
     * @param {String} type 要修改的颜色类型，color：文字颜色，haloColor：描边颜色
     */
    changeColor(value, type) {
      const labelClassCopy = JSON.parse(JSON.stringify(this.labelClass))
      let key
      switch (type) {
        case 'color':
        default:
          key = 'color'
          break
        case 'haloColor':
          key = 'haloColor'
          break
      }
      this.labelClass.symbol[key] = this.getRGBAColorString(value.rgba)
      labelClassCopy.symbol[key] = this.getRGBAColorString(value.rgba)
      labelClassCopy.symbol.color = Color.fromRGBString(
        labelClassCopy.symbol.color
      )
      labelClassCopy.symbol.haloColor = Color.fromRGBString(
        labelClassCopy.symbol.haloColor
      )
      this.updataLabelClass(labelClassCopy)
    },
    /**
     * 根据类型，修改大小
     * @param {Number} value 数字输入框返回的值
     * @param {String} type 要修改的大小类型，fontSize：文字大小，haloSize：描边宽度
     */
    changeSize(value, type) {
      const labelClassCopy = JSON.parse(JSON.stringify(this.labelClass))
      switch (type) {
        case 'fontSize':
        default:
          labelClassCopy.symbol.font.size = Number(value)
          break
        case 'haloSize':
          labelClassCopy.symbol.haloSize = Number(value)
          break
      }
      this.updataLabelClass(labelClassCopy)
    },
    /**
     * 修改注记渲染类型
     * @param {String} value 注记渲染类型
     */
    chooseRenderMode(value) {
      const labelClassCopy = JSON.parse(JSON.stringify(this.labelClass))
      labelClassCopy.renderMode = value
      this.updataLabelClass(labelClassCopy)
    },
    /**
     * 修改注记避让规则
     * @param {String} value 注记避让规则
     */
    changeDeconflictionStrategy(value) {
      const labelClassCopy = JSON.parse(JSON.stringify(this.labelClass))
      if (value) {
        labelClassCopy.deconflictionStrategy = 'static'
      } else {
        labelClassCopy.deconflictionStrategy = 'none'
      }
      this.updataLabelClass(labelClassCopy)
    },
    /**
     * 更新注记样式数组中第0个注记样式，调用该方法前确保labelClass参数被深拷贝过
     * @param {Object} labelClass 注记样式
     */
    updataLabelClass(labelClass) {
      const subLayer =
        this.layerInfo.layer._innerLayer.activeScene.findSublayerById(
          this.layerIndex
        )
      let { labelingInfo } = subLayer
      if (labelingInfo.length > 0) {
        labelingInfo[0] = LabelClass.fromJSON(labelClass)
      } else {
        labelingInfo.push(LabelClass.fromJSON(labelClass))
      }
      this.$emit('update:layer', this.layerInfo)
    },
    /**
     * 更新整个注记样式数组，调用该方法前确保labelingInfo参数被深拷贝过
     * @param {Array<Object>} labelingInfo 整个注记样式数组
     */
    updataLabelingInfo(labelingInfo) {
      const subLayer =
        this.layerInfo.layer._innerLayer.activeScene.findSublayerById(
          this.layerIndex
        )
      this.labelClass = JSON.parse(JSON.stringify(labelingInfo[0]))
      // 将颜色拾取组件的颜色转为common的color颜色
      labelingInfo.forEach((item) => {
        if (typeof item.symbol.color === 'string') {
          item.symbol.color = Color.fromRGBString(item.symbol.color)
        }
        if (typeof item.symbol.haloColor === 'string') {
          item.symbol.haloColor = Color.fromRGBString(item.symbol.color)
        }
      })
      subLayer.labelingInfo = labelingInfo
      this.$emit('update:layer', this.layerInfo)
    },
    /**
     * 将color对象转为rgba字符串
     * @param {Object} color color对象
     * @return {String} rgba字符串
    */
    getRGBAColorString(color) {
      // 是Common库的Color对象
      if (color.hasOwnProperty('red')) {
        return `rgba(${color.red},${color.green},${color.blue},${color.alpha})`
      } 
      // 是颜色拾取组件返回的颜色对象
      else {
        return `rgba(${color.r},${color.g},${color.b},${color.a})`
      }
    },
  },
}
</script>

<style lang="less" scoped>
.select-tilematrixSet {
  margin: 0.5em;
}
.top-02em {
  margin-top: 0.2em;
}
</style>
