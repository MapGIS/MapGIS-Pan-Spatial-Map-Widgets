<template>
  <div class="mp-symbolization">
    <mapgis-ui-row>
      <mapgis-ui-col>属性变量</mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col
        ><mapgis-ui-space>
          <mapgis-ui-select
            v-if="variablesArr && variablesArr.length > 0"
            :options="variablesArr"
            :default-value="variablesArr[0].value"
            @select="onSelect"
            style="width: 200px"
          ></mapgis-ui-select>
          <span>
            <span>{{ minValue }}</span
            >~<span>{{ maxValue }}</span>
          </span>
        </mapgis-ui-space>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col>渲染方式</mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col
        ><mapgis-ui-select
          disabled
          :options="options"
          :default-value="1"
          :style="{ width: '100%' }"
        ></mapgis-ui-select
      ></mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col>
        <canvas
          id="symbolizationCanvas"
          :width="canvasWidth"
          :height="canvasHeight"
        ></canvas>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col> 颜色设置 </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col>
        <mapgis-ui-colors-setting
          :value="colorsTableData"
          :minValue="minValue"
          :maxValue="maxValue"
          :disableAlpha="true"
          @change="onColorsTableDataChange"
          rangeField="数值"
          rangeFieldMode="single"
          class="colorsSetting"
        ></mapgis-ui-colors-setting>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col>透明度设置</mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col>
        <mp-alpha-table
          :minValue="minValue"
          :maxValue="maxValue"
          :value="alphaTableData"
          @change="onAlphaTableDataChange"
        ></mp-alpha-table>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row>
      <mapgis-ui-col
        ><mapgis-ui-checkbox
          @change="onFilter"
          :disabled="!(numberData && numberData.length > 0)"
          >属性过滤</mapgis-ui-checkbox
        ></mapgis-ui-col
      >
    </mapgis-ui-row>
    <mapgis-ui-row v-show="showFilter">
      <mapgis-ui-col v-if="numberData && numberData.length > 0">
        <mapgis-ui-slider
          range
          v-model="numberData"
          :max="maxValue"
          :min="minValue"
        ></mapgis-ui-slider>
        <mapgis-ui-row type="flex" justify="space-between">
          <mapgis-ui-col
            ><mapgis-ui-input-number v-model="numberData[0]"
          /></mapgis-ui-col>
          <mapgis-ui-col
            ><mapgis-ui-input-number v-model="numberData[1]"
          /></mapgis-ui-col>
        </mapgis-ui-row>
      </mapgis-ui-col>
    </mapgis-ui-row>
    <mapgis-ui-row
      type="flex"
      justify="end"
      :style="{ paddingTop: '10px' }"
      v-show="false"
    >
      <mapgis-ui-col>
        <mapgis-ui-space>
          <mapgis-ui-button type="primary">应用</mapgis-ui-button>
          <mapgis-ui-button>取消</mapgis-ui-button>
        </mapgis-ui-space>
      </mapgis-ui-col>
    </mapgis-ui-row>
  </div>
</template>

<script>
import MpAlphaTable from './AlphaTable.vue'
import { Voxel } from '@mapgis/web-app-framework'

export default {
  name: 'MpSymbolization',
  components: { MpAlphaTable },
  props: {
    // 图层id
    id: {
      type: String,
    },
  },
  data() {
    return {
      defaultColors: [
        { percent: 0, color: 'rgba(255,0,0,1)' },
        { percent: 0.25, color: 'rgba(255,255,0,1)' },
        { percent: 0.5, color: 'rgba(0,255,0,1)' },
        { percent: 0.75, color: 'rgba(0,255,255,1)' },
        { percent: 1, color: 'rgba(65,0,255,1)' },
      ],
      // 属性值范围
      numberData: [0, 100],
      // 属性值最大值
      maxValue: 0,
      // 属性值最小值
      minValue: 0,
      ctx: undefined,
      options: [
        { label: '拉伸渲染', value: 1 },
        { label: '唯一值渲染', value: 2 },
      ],
      canvasWidth: 282,
      canvasHeight: 30,
      colorsTableData: [],
      alphaTableData: [],
      showFilter: false,
      variablesArr: [],
      // 当前选中属性的名称
      currentProperty: '',
    }
  },

  mounted() {
    this.initData()
    this.initCanvas()
  },
  watch: {
    numberData: {
      deep: true,
      handler() {
        this.voxel &&
          this.voxel.setFilterRange(this.numberData[0], this.numberData[1])
      },
    },
  },
  methods: {
    // 初始化属性变量、voxel对象
    initData() {
      const voxelMetaData = Voxel.getMetaData(this.id)
      this.voxel = Voxel.getPrimitives(this.id)
      const { variables } = voxelMetaData
      const excludeArr = ['lat', 'level', 'lon', 'time']
      for (const key in variables) {
        if (!excludeArr.includes(key)) {
          this.variablesArr.push({
            label: key,
            value: variables[key].variable_range
              ? variables[key].variable_range.join(',')
              : variables[key].actual_range.join(','),
          })
        }
      }
      const data = this.variablesArr[0].value.split(',')
      this.numberData = [
        Number(Number(data[0]).toFixed(2)),
        Number(Number(data[1]).toFixed(2)),
      ]
      this.minValue = Number(Number(data[0]).toFixed(2))
      this.maxValue = Number(Number(data[1]).toFixed(2))
      this.currentProperty = this.variablesArr[0].label
    },
    // 初始化绘板
    initCanvas() {
      this.canvas = document.querySelector('#symbolizationCanvas')
      this.ctx = this.canvas.getContext('2d')
      this.formatTableData()
      const colors = this.getAllColors()
      this.getCanvasColors(colors)
    },
    // 实际传入canvas的颜色需要由颜色表格和透明度表格当中的参数组合得到
    getAllColors() {
      const colorsTableDataCopy = JSON.parse(
        JSON.stringify(this.colorsTableData)
      )
      const numArr = colorsTableDataCopy.map(({ num }) => num) // 颜色表对应的属性值数组
      const maxOfColorsTable = Math.max(...numArr) // 颜色表对应的属性值数组当中的最大值
      const minOfColorsTable = Math.min(...numArr) // 颜色表对应的属性值数组当中的最小值
      for (let i = 0; i < this.alphaTableData.length; i++) {
        const number = this.alphaTableData[i].num
        if (numArr.includes(number)) {
          // 查找到透明度对应的属性值在颜色表当中存在，则替换该属性值对应颜色的透明度
          const item = colorsTableDataCopy.find(({ num }) => num === number)
          const rgbaArr = item.color.split(',')
          item.color = `${rgbaArr[0]},${rgbaArr[1]},${rgbaArr[2]},${this.alphaTableData[i].alpha})`
        } else {
          // 透明度对应的属性值在颜色表中不存在
          if (number >= maxOfColorsTable || number <= minOfColorsTable) {
            // 超出颜色表属性值的范围，则取颜色表边界的颜色值替换透明度
            const numData =
              number >= maxOfColorsTable ? maxOfColorsTable : minOfColorsTable
            const item = colorsTableDataCopy.find(({ num }) => num === numData)
            const rgbaArr = item.color.split(',')
            const node = {
              num: number,
              color: `${rgbaArr[0]},${rgbaArr[1]},${rgbaArr[2]},${this.alphaTableData[i].alpha})`,
            }
            colorsTableDataCopy.push(node)
          } else {
            // 不超出颜色表属性值的范围，从canvas取rgba值再替换透明度
            // 取属性的最大值用于计算比例从canvas取rgba值
            const range = this.maxValue - this.minValue
            const canvasWidth =
              ((number - this.minValue) / range) * this.canvasWidth
            // #000000表示此时还未绘制颜色到canvas，此时不取值
            if (this.ctx && this.ctx.fillStyle !== '#000000') {
              const { data } = this.ctx.getImageData(canvasWidth - 1, 10, 1, 1)
              const node = {
                num: number,
                color: `rgba(${data[0]},${data[1]},${data[2]},${this.alphaTableData[i].alpha})`,
              }
              colorsTableDataCopy.push(node)
            }
          }
        }
      }
      // 对新产生的颜色表按照属性值从小到大排序
      colorsTableDataCopy.sort(this.sortBy('num'), 1)

      return this.formatAlpha(colorsTableDataCopy)
    },

    // 透明度线性变化
    formatAlpha(colorsTable) {
      return colorsTable.map(({ num, color }) => {
        let node = {
          num,
          color,
        }
        // 颜色表对应的属性值不在透明度属性值范围内时，此属性值对应的透明度跟随最近的端点透明度-起
        const minPoint = this.alphaTableData[0].num
        const minPointAlpha = this.alphaTableData[0].alpha
        const maxPoint = this.alphaTableData[this.alphaTableData.length - 1].num
        const maxPointAlpha =
          this.alphaTableData[this.alphaTableData.length - 1].alpha
        if (num < minPoint) {
          const alpha = minPointAlpha
          const rgbaArr = color.split(',')
          node = {
            num,
            color: `${rgbaArr[0]},${rgbaArr[1]},${rgbaArr[2]},${alpha})`,
          }
        } else if (num > maxPoint) {
          const alpha = maxPointAlpha
          const rgbaArr = color.split(',')
          node = {
            num,
            color: `${rgbaArr[0]},${rgbaArr[1]},${rgbaArr[2]},${alpha})`,
          }
        }
        // 颜色表对应的属性值不在透明度属性值范围内时，此属性值对应的透明度跟随最近的端点透明度-止
        for (let i = 1; i < this.alphaTableData.length; i++) {
          // 线性计算属性值对应的透明度
          const min = this.alphaTableData[i - 1].num
          const minAlpha = this.alphaTableData[i - 1].alpha
          const max = this.alphaTableData[i].num
          const maxAlpha = this.alphaTableData[i].alpha
          if (num > min && num < max) {
            let alpha
            if (minAlpha !== maxAlpha) {
              alpha =
                minAlpha + ((num - min) * (maxAlpha - minAlpha)) / (max - min)
            } else {
              alpha = minAlpha
            }
            const rgbaArr = color.split(',')
            node = {
              num,
              color: `${rgbaArr[0]},${rgbaArr[1]},${rgbaArr[2]},${alpha})`,
            }
          }
        }
        return node
      })
    },
    // attr:根据该属性排序  rev：升序1，降序-1，不填默认为1
    sortBy(attr, rev) {
      if (rev === undefined) {
        rev = 1
      } else {
        rev ? 1 : -1
      }
      return (a, b) => {
        a = a[attr]
        b = b[attr]
        if (a < b) {
          return rev * -1
        }
        if (a > b) {
          return rev * 1
        }
        return 0
      }
    },
    // 绘制canvas渐变色
    getCanvasColors(colors) {
      if (!this.ctx) return
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      const linearGradient = this.ctx.createLinearGradient(
        0,
        0,
        this.canvasWidth,
        0
      )
      const range = this.maxValue - this.minValue
      colors.forEach(({ num, color }) => {
        linearGradient.addColorStop((num - this.minValue) / range, color)
      })
      this.ctx.fillStyle = linearGradient
      this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
      this.voxel.setColorScheme(this.canvas)
    },
    // 获取默认的颜色表格和透明度表格
    formatTableData() {
      const start = this.minValue
      const step =
        (this.maxValue - this.minValue) / (this.defaultColors.length - 1)
      this.colorsTableData = this.defaultColors.map(({ color }, index) => ({
        num: parseInt(start + step * index),
        color,
      }))
      this.alphaTableData = this.numberData.map((data) => ({
        num: data,
        alpha: 1,
      }))
    },
    onFilter(e) {
      this.showFilter = e.target.checked
    },
    // 修改颜色表格的参数时触发
    onColorsTableDataChange(val) {
      this.colorsTableData = val
      const colors = this.getAllColors()
      this.getCanvasColors(colors)
    },
    // 修改透明度表格参数时触发
    onAlphaTableDataChange(val) {
      this.alphaTableData = val
      const colors = this.getAllColors()
      this.getCanvasColors(colors)
    },
    onSelect(val, option) {
      const data = val.split(',')
      this.numberData = [
        Number(Number(data[0]).toFixed(2)),
        Number(Number(data[1]).toFixed(2)),
      ]
      this.minValue = Number(Number(data[0]).toFixed(2))
      this.maxValue = Number(Number(data[1]).toFixed(2))
      this.formatTableData()
      const colors = this.getAllColors()
      this.getCanvasColors(colors)
    },
  },
}
</script>

<style lang="scss" scoped>
.mapgis-ui-row {
  margin: 10px 0 5px 0;
}
</style>
