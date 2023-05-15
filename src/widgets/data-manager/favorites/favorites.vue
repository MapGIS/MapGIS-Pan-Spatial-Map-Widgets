<template>
  <mapgis-ui-favorites
    ref="favorites"
    :dataList="dataList"
    :checkKeys="checkKeys"
    :checkData="checkData"
    :showType="showType"
    @addData="onAddData"
    @editData="onEditData"
    @deleteData="onDeleteData"
    @showData="onShowData"
  ></mapgis-ui-favorites>
</template>

<script>
import {
  UUID,
  AppMixin,
  MapMixin,
  WidgetMixin,
  FitBound,
  DataCatalogCheckController,
  eventBus,
  events,
} from '@mapgis/web-app-framework'

export default {
  name: 'MpFavorites',
  mixins: [AppMixin, MapMixin, WidgetMixin],
  data() {
    return {
      dataList: [], // 初始化从接口获取的数据
      replaceFields: {}, // 列表模式下tree组件中节点信息展示的替换字段{title: "name",key: "guid"}，具体使用参考ant-design-vue中的tree组件对应api
      dataCatalogCheckController: DataCatalogCheckController,
    }
  },
  computed: {
    checkKeys() {
      return this.dataCatalogCheckController.getCheckKeys()
    },
    checkData() {
      return this.dataCatalogCheckController.getCheckData()
    },
    showType() {
      return this.widgetInfo.config.showType
    },
  },
  mounted() {
    this.dataList = JSON.parse(JSON.stringify(this.widgetInfo.config.data))
  },
  methods: {
    onAddData(data) {
      /**
        const data = {
        // 唯一id
        id: UUID.uuid(),
        // 场景定格名称
        name: this.bookMarkName,
        // 图片信息
        image: '',
        // 地图模式，若当前二维地图数据是三维地图下保存的数据则自动跳转三维地图
        is2DMapMode: this.is2DMapMode,
        // 数据目录勾选的key
        checkKeys: this.checkKeys,
        // 数据目录勾选的key与对应的tab映射关系
        checkKeysRelation: {},
        // 存储当前场景展示的tree数据
        data: [],
        // 配置参数，如保存数据时的地图范围等数据，用于还原
        options: {},
      }
       */

      data.id = UUID.uuid()
      data.is2DMapMode = this.is2DMapMode
      data.image = this.getPng()
      if (this.is2DMapMode) {
        const mapBoundArray = this.map.getBounds().toArray()
        const mapBound = {
          xmin: mapBoundArray[0][0],
          ymin: mapBoundArray[0][1],
          xmax: mapBoundArray[1][0],
          ymax: mapBoundArray[1][1],
        }
        data.options.mapBound = mapBound
      } else {
        const { roll, pitch, heading, position } = viewer.camera
        // position获取到的是笛卡尔坐标对象要转为普通对象
        const camera = {
          roll,
          pitch,
          heading,
          position: JSON.parse(JSON.stringify(position)),
        }
        data.options.mapBound = camera
      }
      this.dataList.push(data)
      // 调用接口存数据
    },
    onEditData(name, index) {
      this.dataList[index].name = name
      // 调用接口存数据
    },
    onDeleteData(id) {
      this.dataList = this.dataList.filter((item) => item.id !== id)
      // 调用接口存数据
    },
    onShowData(item) {
      const { Cesium, map, vueCesium, viewer } = this
      if (this.is2DMapMode !== item.is2DMapMode) {
        this.switchMapMode()
      }
      // 发送勾选数据目录节点消息
      eventBus.$emit(
        events.DATA_CARALOG_CHECK_NODES,
        JSON.parse(JSON.stringify(item.checkKeys)),
        JSON.parse(JSON.stringify(item.checkKeysRelation))
      )
      if (item.is2DMapMode) {
        const mapParams = { Cesium, map, vueCesium, viewer }
        setTimeout(() => {
          FitBound.fitBound2D(item.options.mapBound, mapParams)
        }, 300)
      } else {
        const { roll, pitch, heading, position } = item.options.mapBound
        viewer.camera.flyTo({
          destination: new Cesium.Cartesian3(
            position.x,
            position.y,
            position.z
          ),
          orientation: {
            heading,
            pitch,
            roll,
          },
        })
      }
    },
    getPng() {
      const { Cesium, viewer, map } = this
      const reImg = new Cesium.ReImg()
      const dataUrl = this.getDataUrl()
      const img = reImg.outputProcessor(dataUrl).toImg()
      return img.src
    },
    getDataUrl() {
      const { viewer, map } = this
      if (this.is2DMapMode) {
        return map.getCanvas().toDataURL('image/jpeg', 0.2)
      } else {
        return viewer.canvas.toDataURL('image/jpeg', 0.2)
      }
    },
    saveData() {
      api
        .saveWidgetConfig({
          name: 'favorites',
          config: JSON.stringify(this.dataList),
        })
        .catch(() => {
          this.$message.config({
            top: '100px',
            duration: 1,
            maxCount: 3,
          })
          this.$message.error('保存信息失败')
        })
    },
  },
}
</script>

<style></style>
