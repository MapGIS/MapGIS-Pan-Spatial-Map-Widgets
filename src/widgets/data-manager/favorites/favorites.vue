<template>
  <mapgis-ui-favorites
    ref="favorites"
    :dataList="dataList"
    :checkKeys="checkKeys"
    :checkData="checkData"
    :showType="showType"
    :baseUrl="baseUrl"
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
  api,
} from '@mapgis/web-app-framework'
import axios from 'axios'

export default {
  name: 'MpFavorites',
  mixins: [AppMixin, MapMixin, WidgetMixin],
  data() {
    return {
      dataList: [], // 初始化从接口获取的数据
      replaceFields: {}, // 列表模式下tree组件中节点信息展示的替换字段{title: "name",key: "guid"}，具体使用参考ant-design-vue中的tree组件对应api
      dataCatalogCheckController: DataCatalogCheckController,
      currentId: '', // 再次点击相同的收藏时需要重置一次场景设置信息再设置触发computed
      isAgain: false,
    }
  },
  computed: {
    checkKeys() {
      return this.dataCatalogCheckController.getCheckKeys()
    },
    checkData() {
      return this.dataCatalogCheckController.getCheckData()
    },
    layerConfig() {
      return this.dataCatalogCheckController.getCheckLayerConfig()
    },
    sceneConfig() {
      return this.dataCatalogCheckController.getCheckSceneConfig()
    },
    showType() {
      return this.widgetInfo.config.showType
    },
    baseUrl() {
      return window._CONFIG.domainURL
    },
    imagesUploadApi() {
      // return `${this.baseUrl}/psmap/rest/manager/file/upload`
      return `${this.baseUrl}/psmap/rest/services/system/ResourceServer/files/pictures`
    },
  },
  mounted() {
    if (!this.widgetInfo.config.data) {
      this.$set(this.widgetInfo.config, 'data', [])
    }
    if (!this.widgetInfo.config.showType) {
      this.$set(this.widgetInfo.config, 'showType', 'image')
    }
    this.dataList = JSON.parse(JSON.stringify(this.widgetInfo.config.data))
  },
  methods: {
    async onAddData(data) {
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
      // 获取图层列表此时的配置信息
      eventBus.$emit(events.GET_LAYER_LIST_INFO)
      eventBus.$emit(events.SCENE_CONFIG_INFO)
      const id = UUID.uuid()
      const imageObj = this.base64ToFile(this.getImage(), id)
      const fileInfo = await this.uploadImage(imageObj)
      data.id = id
      data.is2DMapMode = this.is2DMapMode
      data.image = fileInfo.data.url
      data.options.layerConfig = this.layerConfig
      data.options.sceneConfig = this.sceneConfig
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
      this.saveData()
    },
    onEditData(name, index) {
      this.dataList[index].name = name
      // 调用接口存数据
      this.saveData()
    },
    onDeleteData(id) {
      this.dataList = this.dataList.filter((item) => item.id !== id)
      // 调用接口存数据
      this.saveData()
    },
    onShowData(item) {
      const { Cesium, map, vueCesium, viewer } = this
      this.isAgain = this.currentId === item.id
      this.currentId = item.id
      if (this.is2DMapMode !== item.is2DMapMode) {
        this.switchMapMode()
      }

      this.dataCatalogCheckController.setCurrentCheckLayerConfig(
        item.options.layerConfig
      )
      // 需要重置一次
      if (this.isAgain) {
        this.dataCatalogCheckController.setCurrentCheckSceneSettingConfig({})
        this.$nextTick(() => {
          this.dataCatalogCheckController.setCurrentCheckSceneSettingConfig(
            item.options.sceneConfig
          )
        })
      } else {
        this.dataCatalogCheckController.setCurrentCheckSceneSettingConfig(
          item.options.sceneConfig
        )
      }

      this.dataCatalogCheckController.setCurrentLayerChangeConfig([])
      this.dataCatalogCheckController.setCurrentLayerNoChildList([])
      if (item.is2DMapMode) {
        const mapParams = { Cesium, map, vueCesium, viewer }
        setTimeout(() => {
          FitBound.fitBound2D(item.options.mapBound, mapParams)
          // 发送勾选数据目录节点消息
          eventBus.$emit(
            events.DATA_CATALOG_CHECK_NODES,
            JSON.parse(JSON.stringify(item.checkKeys)),
            JSON.parse(JSON.stringify(item.checkKeysRelation))
          )
        }, 1000)
      } else {
        const { roll, pitch, heading, position } = item.options.mapBound
        console.log(item.options.mapBound)
        setTimeout(() => {
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
          // 发送勾选数据目录节点消息
          eventBus.$emit(
            events.DATA_CATALOG_CHECK_NODES,
            JSON.parse(JSON.stringify(item.checkKeys)),
            JSON.parse(JSON.stringify(item.checkKeysRelation))
          )
        }, 1000)
      }
      eventBus.$emit(events.ECHO_LAYER_LIST_INFO, item.options.layerConfig)
    },
    getImage() {
      const { Cesium, viewer, map } = this
      const reImg = new Cesium.ReImg()
      const dataUrl = this.getDataUrl()
      const img = reImg.outputProcessor(dataUrl).toImg()
      return img
    },
    getDataUrl() {
      const { viewer, map } = this
      if (this.is2DMapMode) {
        return map.getCanvas().toDataURL('image/jpeg', 0.2)
      } else {
        return viewer.canvas.toDataURL('image/jpeg', 0.2)
      }
    },
    // 图片转文件对象
    base64ToFile(urlData, id) {
      const arr = urlData.src.split(',')
      const mime = arr[0].match(/:(.*?);/)[1]
      const bytes = window.atob(arr[1])
      let n = bytes.length
      const ia = new Uint8Array(n)
      while (n--) {
        ia[n] = bytes.charCodeAt(n)
      }
      return new File([ia], `${id}.jpeg`, { type: mime })
    },
    async saveData() {
      const originConfig = await api.getWidgetConfig('favorites')
      originConfig.data = this.dataList
      if (!originConfig.showType) {
        originConfig.showType = this.showType
      }
      api
        .saveWidgetConfig({
          name: 'favorites',
          config: JSON.stringify(originConfig),
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
    uploadImage(image) {
      const file = new FormData()
      file.append('file', image)
      return new Promise((resolve, reject) => {
        axios
          .post(this.imagesUploadApi, file, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': JSON.parse(localStorage.getItem('access_token')),
            },
          })
          .then((res) => {
            resolve(res)
          })
          .catch((Error) => {
            reject(Error)
          })
      })
    },
  },
}
</script>

<style></style>
