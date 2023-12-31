<template>
  <mapgis-ui-export-file-modal
    :visible="visible"
    title="导出标注"
    :exportFileTypes="exportFileTypes"
    :exportFileName="exportOptions.exportFileName"
    :exportFileType="exportOptions.exportFileType"
    @cancel="onExportCancel"
    @ok="onExportOk"
  ></mapgis-ui-export-file-modal>
</template>

<script lang="ts">
import { baseConfigInstance, Feature } from '@mapgis/web-app-framework'
import axios from 'axios'
import * as Zondy from '@mapgis/webclient-es6-service'
import XLSX from 'xlsx'

export default {
  name: 'MarkerExport',
  props: {
    visible: { type: Boolean, default: false },
    markers: { type: Array, required: true },
    exportConfig: { type: Object },
  },
  // @Prop({ type: Boolean, default: false }) visible
  // @Prop({ type: Array, required: true }) readonly markers!: Array< Record<string, any> >
  // @Prop({ type: Object }) exportConfig: Record<string, any>

  data() {
    return {
      // 表单数据
      exportOptions: {
        exportFileName: '',
        exportFileType: 'shp格式',
      },
      // 导出格式下拉项配置
      exportFileTypes: ['shp格式', '6x格式', 'excel格式'],
      // private shpOr6xOption: any
      shpOr6xOption: {},
    }
  },

  // @Emit('finished')
  // emitFinished() {}

  methods: {
    emitFinished() {
      this.$emit('finished')
    },
    // 确认按钮回调函数
    onExportOk(val) {
      this.exportOptions.exportFileName = val.fileName
      this.exportOptions.exportFileType = val.fileType
      if (this.markers.length) {
        if (this.exportOptions.exportFileName !== '') {
          const exportedMarkers = this.markers.map((marker) => {
            const {
              markerId,
              title,
              description,
              coordinates,
              feature,
              picture,
            } = marker

            return {
              id: markerId,
              title,
              description,
              center: coordinates,
              features: [feature],
            }
          })

          switch (this.exportOptions.exportFileType) {
            case 'shp格式':
              this.ouputToShpOr6x(
                this.exportOptions.exportFileName,
                exportedMarkers,
                'shp'
              )
              break
            case '6x格式':
              this.ouputToShpOr6x(
                this.exportOptions.exportFileName,
                exportedMarkers,
                '6x'
              )
              break
            case 'excel格式':
              this.ouputToExcel(
                this.exportOptions.exportFileName,
                exportedMarkers
              )
              break
            default:
              break
          }
        }
      }

      this.emitFinished()
    },

    onExportCancel() {
      this.emitFinished()
    },

    // 发送请求创建简单要素类 --> 发送请求将简单要素类保存
    creatFeature(fileName: string, featureSet: any, featureType: string) {
      const { projectionName } = baseConfigInstance.config // 获取目标参考系
      const { username, password } = this.exportConfig
      const protocol = window.location.protocol
      const domain = `${protocol}//${this.exportConfig.ip}:${this.exportConfig.port}`
      const getFeatureUrl = `${domain}/onemap/featureSet/export?path=${fileName}&srsName=${projectionName}&type=${featureType}&f=json&user=${username}&password=${password}`

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this
      const { shpOr6xOption } = this
      axios.post(getFeatureUrl, JSON.stringify(featureSet)).then(
        (res) => {
          const { data } = res
          let result = data
          if (data.indexOf('"') > -1) {
            result = data.replaceAll('"', '')
          }
          const url = `${protocol}//${this.exportConfig.ip}:9999/open/download?path=${result}&user=${username}&password=${password}`

          // eslint-disable-next-line no-restricted-globals
          location.href = url // 下载文件至本地

          setTimeout(() => {
            if (
              shpOr6xOption.featureType === '点' &&
              shpOr6xOption.setOption.featureSet2.SFEleArray.length > 0
            ) {
              // 有线要素
              const fileNameItem =
                shpOr6xOption.fileType === 'shp'
                  ? `${shpOr6xOption.fileName}_线.shp`
                  : `${shpOr6xOption.fileName}_线.wl`
              shpOr6xOption.featureType = '线'
              self.creatFeature(
                fileNameItem,
                shpOr6xOption.setOption.featureSet2,
                'Lin'
              )
            }
            if (
              shpOr6xOption.featureType === '线' &&
              shpOr6xOption.setOption.featureSet3.SFEleArray.length > 0
            ) {
              // 有区要素
              const fileNameItem =
                shpOr6xOption.fileType === 'shp'
                  ? `${shpOr6xOption.fileName}_区.shp`
                  : `${shpOr6xOption.fileName}_区.wp`
              shpOr6xOption.featureType = '区'
              setTimeout(() => {
                self.creatFeature(
                  fileNameItem,
                  shpOr6xOption.setOption.featureSet3,
                  'Reg'
                )
              }, 500)
            }
          }, 500)
        },
        (error) => {
          console.log(error)
        }
      )
    },

    // 导出形式为shp文件或6x
    ouputToShpOr6x(fileName: string, exportedMarkers, fileType: string) {
      if (!this.exportConfig) {
        this.$message.success('请先设置配置数据')
        return
      }
      const setOption = this.markers2Features(exportedMarkers) // 获取结果集对象
      let fileNameItem: string
      let exportFormat: string
      const { projectionName } = baseConfigInstance.config // 获取目标参考系
      if (setOption.featureSet1.SFEleArray.length > 0) {
        // 有点要素
        this.shpOr6xOption = {
          setOption,
          featureType: '点',
          fileName,
          fileType,
        }
        fileNameItem =
          fileType === 'shp' ? `${fileName}_点.zip` : `${fileName}_点.wt`
        exportFormat = fileType === 'shp' ? 'shp' : 'wp'
        // this.creatFeature(fileNameItem, setOption.featureSet1, 'Pnt')
        Feature.ExportFeature.downloadFile(
          fileNameItem,
          setOption.featureSet1,
          'Pnt',
          exportFormat,
          projectionName,
          this.exportConfig.ip,
          this.exportConfig.port
        )
      }
      if (setOption.featureSet2.SFEleArray.length > 0) {
        this.shpOr6xOption = {
          setOption,
          featureType: '线',
          fileName,
          fileType,
        }
        fileNameItem =
          fileType === 'shp' ? `${fileName}_线.zip` : `${fileName}_线.wl`
        exportFormat = fileType === 'shp' ? 'shp' : 'wl'
        // this.creatFeature(fileNameItem, setOption.featureSet2, 'Lin')
        Feature.ExportFeature.downloadFile(
          fileNameItem,
          setOption.featureSet2,
          'Lin',
          exportFormat,
          projectionName,
          this.exportConfig.ip,
          this.exportConfig.port
        )
      }
      if (setOption.featureSet3.SFEleArray.length > 0) {
        this.shpOr6xOption = {
          setOption,
          featureType: '区',
          fileName,
          fileType,
        }
        fileNameItem =
          fileType === 'shp' ? `${fileName}_区.zip` : `${fileName}_区.wp`
        exportFormat = fileType === 'shp' ? 'shp' : 'wp'
        // this.creatFeature(fileNameItem, setOption.featureSet3, 'Reg')
        Feature.ExportFeature.downloadFile(
          fileNameItem,
          setOption.featureSet3,
          'Reg',
          exportFormat,
          projectionName,
          this.exportConfig.ip,
          this.exportConfig.port
        )
      }
    },

    // 导出格式为Excel
    ouputToExcel(fileName: string, exportedMarkers) {
      exportedMarkers = exportedMarkers.map((item) => {
        return {
          ...item,
          center: `${item.center[0]}, ${item.center[1]}`,
          features: `type: ${item.features[0].geometry.type}`,
        }
      })
      const sheet = XLSX.utils.json_to_sheet(exportedMarkers)
      let blob = this.sheet2blob(sheet)

      if (typeof blob === 'object' && blob instanceof Blob) {
        blob = URL.createObjectURL(blob) // 创建blob地址
      }

      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = blob
      a.download = `${fileName}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },

    // 将一个sheet转成最终的excel文件的blob对象，然后利用URL.createObjectURL下载
    sheet2blob(sheet, sheetName) {
      sheetName = sheetName || 'sheet1'
      const workbook = {
        SheetNames: [sheetName],
        Sheets: {},
      }
      workbook.Sheets[sheetName] = sheet
      // 生成excel的配置项
      const wopts = {
        bookType: 'xlsx', // 要生成的文件类型
        bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
        type: 'binary',
      }
      const wbout = XLSX.write(workbook, wopts)
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' })
      // 字符串转ArrayBuffer
      function s2ab(s) {
        const buf = new ArrayBuffer(s.length)
        const view = new Uint8Array(buf)
        for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xff
        return buf
      }
      return blob
    },

    markers2Features(markers: Record<string, any>[]) {
      // 创建点、线、区要素数据集
      const featureSet1 = new Zondy.Common.FeatureSet()
      const featureSet2 = new Zondy.Common.FeatureSet()
      const featureSet3 = new Zondy.Common.FeatureSet()
      // 设置属性结构
      const cAttStruct = new Zondy.Common.CAttStruct({
        FldName: ['名称', '描述', '中心点坐标', '坐标串'],
        FldNumber: 4,
        FldType: ['string', 'string', 'string', 'string'],
      })
      featureSet1.AttStruct = cAttStruct
      featureSet2.AttStruct = cAttStruct
      featureSet3.AttStruct = cAttStruct
      const setOption = {
        featureSet1,
        featureSet2,
        featureSet3,
      }
      for (let i = 0; i < markers.length; i += 1) {
        const marker = markers[i]
        const { features, title, description, coordinates, center } = marker
        for (let fl = 0; fl < features.length; fl += 1) {
          const igsFeature = this.geojsonFeatureToIgsFeature(
            features[fl],
            title,
            description,
            center
          )
          const fType = igsFeature.ftype
          if (fType === 1) {
            setOption.featureSet1.addFeature(igsFeature)
          } else if (fType === 2) {
            setOption.featureSet2.addFeature(igsFeature)
          } else if (fType === 3) {
            setOption.featureSet3.addFeature(igsFeature)
          }
        }
      }
      return setOption
    },

    // 点、线、区要素集合
    geojsonFeatureToIgsFeature(
      geojsonFeature: any,
      title: string,
      description: string,
      center: number[]
    ) {
      let coordStr = ''
      const { geometry } = geojsonFeature
      const { type, coordinates } = geometry
      // 随机输出1~8之间的整数,作为新添加的要素的颜色号
      const pntColor = Math.floor(Math.random() * 8 + 1)
      let fGeom: any
      let GraphicInfo: any
      let fType = 0
      // 要素之间用'#'分隔，坐标之间用' '分隔，xy之间用','分隔
      if (type === 'Point') {
        coordStr += coordinates.join(',')
        // 设置当前点要素的几何信息
        fGeom = new Zondy.Common.FeatureGeometry({
          PntGeom: [new Zondy.Common.GPoint(coordinates[0], coordinates[1])],
        })
        // 描述点要素的符号参数信息
        const pointInfo = new Zondy.Common.CPointInfo({
          Angle: 0,
          Color: pntColor,
          Space: 0,
          SymHeight: 12,
          SymID: 98,
          SymWidth: 12,
        })
        // 设置当前点要素的图形参数信息
        GraphicInfo = new Zondy.Common.WebGraphicsInfo({
          InfoType: 1,
          PntInfo: pointInfo,
        })
        fType = 1
      } else if (type === 'LineString') {
        const coords: any[] = []
        for (let l = 0; l < coordinates.length; l += 1) {
          if (l > 0) {
            coordStr += ' '
          }
          coordStr += coordinates[l].join(',')
          coords.push(
            new Zondy.Common.Point2D(coordinates[l][0], coordinates[l][1])
          )
        }
        // 构成折线的弧段
        const gArc = new Zondy.Common.Arc(coords)
        const gAnyLine = new Zondy.Common.AnyLine([gArc])
        // 设置线要素的几何信息
        const gline = new Zondy.Common.GLine(gAnyLine)
        // 设置要素的几何信息
        fGeom = new Zondy.Common.FeatureGeometry({ LinGeom: [gline] })
        // 设置添加线要素的图形参数信息
        const clineInfo = new Zondy.Common.CLineInfo({
          Color: pntColor,
          LinStyleID: 0,
          LinStyleID2: 1,
          LinWidth: 2,
          Xscale: 10,
          Yscale: 10,
        })
        // 设置要素的图形参数信息
        GraphicInfo = new Zondy.Common.WebGraphicsInfo({
          InfoType: 2,
          LinInfo: clineInfo,
        })

        fType = 2
      } else if (type === 'Polygon') {
        const gArcs: any[] = []
        for (let p = 0; p < coordinates.length; p += 1) {
          if (p > 0) {
            coordStr += '#'
          }
          const arcPoints = coordinates[p]
          const coords: any[] = []
          for (let a = 0; a < arcPoints.length; a += 1) {
            if (a > 0) {
              coordStr += ' '
            }
            coordStr += arcPoints[a].join(',')
            coords.push(
              new Zondy.Common.Point2D(arcPoints[a][0], arcPoints[a][1])
            )
          }
          const gArc = new Zondy.Common.Arc(coords)
          gArcs.push(gArc)
        }
        // 构成区要素折线
        const gAnyLine = new Zondy.Common.AnyLine(gArcs)
        // 构成区要素
        const gRegion = new Zondy.Common.GRegion([gAnyLine])
        // 构成区要素的几何信息
        fGeom = new Zondy.Common.FeatureGeometry({ RegGeom: [gRegion] })
        // 设置区要素的图形参数信息
        const cRegionInfo = new Zondy.Common.CRegionInfo({
          EndColor: 1,
          FillColor: pntColor,
          FillMode: 0,
          OutPenWidth: 1,
          OverMethod: 0,
          PatAngle: 1,
          PatColor: 1,
          PatHeight: 1,
          PatID: 27,
          PatWidth: 1,
        })
        // 要素图形参数信息
        GraphicInfo = new Zondy.Common.WebGraphicsInfo({
          InfoType: 3,
          RegInfo: cRegionInfo,
        })
        fType = 3
      }
      // 设置添加点要素的属性信息
      const attValue = [title, description, center.join(','), coordStr]
      // 创建一个要素
      const feature = new Zondy.Common.Feature({
        fGeom,
        GraphicInfo,
        AttValue: attValue,
      })
      // 设置要素类型
      feature.setFType(fType)
      return feature
    },
  },
}
</script>

<style lang="less" scoped>
.marker-export-wrapper {
  .marker-export-body {
    display: flex;
  }
}
</style>
