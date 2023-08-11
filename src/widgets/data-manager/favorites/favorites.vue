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
  BaseMapController,
  eventBus,
  events,
  api,
  dataCatalogManagerInstance,
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
      baseMapController: BaseMapController,
      currentId: '', // 再次点击相同的收藏时需要重置一次场景设置信息再设置触发computed
      isAgain: false,
      dataCatalogManager: dataCatalogManagerInstance,
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
    baseMapConfig() {
      return this.baseMapController.currentBaseMapInfo
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
    dataCatalogLayerArr() {
      return this.dataCatalogManager.getAllLayerConfigItems()
    },
    dataCatalogAllArr() {
      return this.dataCatalogManager.getAllConfigItems()
    },
  },
  mounted() {
    eventBus.$on(events.DATA_CATALOG_ADD_COLLECT, this.addData)
    if (!this.widgetInfo.config.data) {
      this.$set(this.widgetInfo.config, 'data', [])
    }
    if (!this.widgetInfo.config.showType) {
      this.$set(this.widgetInfo.config, 'showType', 'image')
    }
    this.dataList = JSON.parse(JSON.stringify(this.widgetInfo.config.data))
    this.baseMapController.saveType = 'url'
  },
  methods: {
    addData() {
      this.$refs.favorites.openAddModel()
    },
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
      this.transferCheckData(data)
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
      data.options.baseMapConfig = this.getBaseMapConfig(this.baseMapConfig)
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
      this.baseMapController.isResize = false
      if (this.is2DMapMode !== item.is2DMapMode) {
        this.switchMapMode()
      }

      const options = JSON.parse(JSON.stringify(item.options))
      this.dataCatalogCheckController.setCurrentCheckLayerConfig(
        this.transferLayer(options.layerConfig)
      )
      // 需要重置一次
      if (this.isAgain) {
        this.dataCatalogCheckController.setCurrentCheckSceneSettingConfig({})
        this.baseMapController.setBaseMapInfo = null
        this.$nextTick(() => {
          this.dataCatalogCheckController.setCurrentCheckSceneSettingConfig(
            options.sceneConfig
          )
          this.baseMapController.setBaseMapInfo = this.transferBaseMap(
            options.baseMapConfig
          )
        })
      } else {
        this.dataCatalogCheckController.setCurrentCheckSceneSettingConfig(
          options.sceneConfig
        )
        this.baseMapController.setBaseMapInfo = this.transferBaseMap(
          options.baseMapConfig
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
            this.transferCheckKeyArr(item.checkKeys),
            this.transferCheckKeysRelation(item.checkKeysRelation)
          )
        }, 1000)
      } else {
        const { roll, pitch, heading, position } = item.options.mapBound
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
            this.transferCheckKeyArr(item.checkKeys),
            this.transferCheckKeysRelation(item.checkKeysRelation)
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
    transferLayer(layerConfig) {
      const { layerInfo, relation } = layerConfig
      const transferLayerInfo = {}
      const transferRelation = {}
      Object.keys(layerInfo).forEach((item) => {
        // 兼容guid的情况
        if (item.indexOf('://') > -1) {
          const find = this.dataCatalogLayerArr.find(
            (config) => config.serverURL === item
          )
          if (find) {
            transferLayerInfo[find.guid] = layerInfo[item]
          }
        } else {
          transferLayerInfo[item] = layerInfo[item]
        }
      })
      Object.keys(relation).forEach((item) => {
        if (item.indexOf('://') > -1) {
          const find = this.dataCatalogLayerArr.find(
            (config) => config.serverURL === item
          )
          if (find) {
            transferRelation[find.guid] = relation[item]
          }
        } else {
          transferRelation[item] = relation[item]
        }
      })
      layerConfig.layerInfo = transferLayerInfo
      layerConfig.relation = transferRelation
      return layerConfig
    },
    transferBaseMap(baseMapConfig) {
      const { saveType, baseMapList } = this.baseMapController
      if (saveType === 'guid') {
        // 原逻辑不做处理
      } else if (saveType === 'url') {
        const { onSelect, unSelect, zoomArr, indexBaseMapGUID } = baseMapConfig
        const transferOnSelect = this.getBaseMapGuid(onSelect, baseMapList)
        const transferUnSelect = this.getBaseMapGuid(unSelect, baseMapList)
        const transferZoomArr = this.getBaseMapGuid(zoomArr, baseMapList)
        const transferIndexBaseMapGUID = this.getBaseMapGuid(
          indexBaseMapGUID,
          baseMapList
        )
        baseMapConfig.onSelect = transferOnSelect
        baseMapConfig.unSelect = transferUnSelect
        baseMapConfig.zoomArr = transferZoomArr
        baseMapConfig.indexBaseMapGUID = transferIndexBaseMapGUID[0]
      }
      return baseMapConfig
    },
    getBaseMapConfig(baseMapConfig) {
      const { saveType, baseMapList } = this.baseMapController
      const config = { ...baseMapConfig }
      if (saveType === 'guid') {
        // 原逻辑不做处理
      } else if (saveType === 'url') {
        const baseMapList = this.baseMapController.baseMapList
        const { onSelect, unSelect, zoomArr, indexBaseMapGUID } = baseMapConfig
        const transferOnSelect = this.getUrlArr(onSelect, baseMapList)
        const transferUnSelect = this.getUrlArr(unSelect, baseMapList)
        const transferZoomArr = this.getUrlArr(zoomArr, baseMapList)
        const transferIndexBaseMapGUID = this.getUrlArr(
          [indexBaseMapGUID],
          baseMapList
        )
        config.onSelect = transferOnSelect
        config.unSelect = transferUnSelect
        config.zoomArr = transferZoomArr
        config.indexBaseMapGUID = transferIndexBaseMapGUID
      }
      return config
    },
    getUrlArr(ids, baseMapList) {
      const result = []
      ids.forEach((item) => {
        const subArr = []
        const find = baseMapList.find((layer) => layer.guid === item)
        const { children } = find
        children.forEach((sublayer) => {
          subArr.push(sublayer.serverURL)
        })
        result.push(subArr)
      })
      return result
    },
    getBaseMapGuid(urls, baseMapList) {
      const transferGuid = []
      urls.forEach((url) => {
        const find = baseMapList.find((item) => {
          // urls为底图的子图层数量
          let flag
          if (item.children.length === url.length) {
            flag = true
            const { children } = item
            children.forEach((item) => {
              if (!url.includes(item.serverURL)) {
                flag = false
              }
            })
          }
          return flag
        })
        find && transferGuid.push(find.guid)
      })
      return transferGuid
    },
    transferCheckData(data) {
      const { checkKeys, checkKeysRelation } = data
      const transferCheckKeys = []
      const transferCheckKeysRelation = {}
      if (checkKeys && checkKeys.length > 0) {
        checkKeys.forEach((item) => {
          const find = this.dataCatalogLayerArr.find(
            (layer) => layer.guid === item
          )
          find && transferCheckKeys.push(find.serverURL)
        })
        data.checkKeys = transferCheckKeys
      }

      if (checkKeysRelation && Object.keys(checkKeysRelation).length > 0) {
        Object.keys(checkKeysRelation).forEach((item) => {
          const typeArr = checkKeysRelation[item]
          transferCheckKeysRelation[item] = []
          typeArr.forEach((id) => {
            const find = this.dataCatalogLayerArr.find(
              (layer) => layer.guid === id
            )
            find && transferCheckKeysRelation[item].push(find.serverURL)
          })
        })
        data.checkKeysRelation = transferCheckKeysRelation
      }
    },
    transferCheckKeyArr(checkKeys) {
      const transferCheckKeys = []
      checkKeys.forEach((item) => {
        if (item.indexOf('://') > -1) {
          const find = this.dataCatalogLayerArr.find(
            (config) => config.serverURL === item
          )
          if (find) {
            transferCheckKeys.push(find.guid)
          }
        } else {
          transferCheckKeys.push(item)
        }
      })
      return transferCheckKeys
    },
    transferCheckKeysRelation(checkKeysRelation) {
      // 获取父级节点只需要使用对应关系数组中的一个url地址就行
      const transferCheckKeysRelation = {}
      if (checkKeysRelation && Object.keys(checkKeysRelation).length > 0) {
        Object.keys(checkKeysRelation).forEach((item) => {
          const subArr = checkKeysRelation[item]
          if (subArr && subArr.length > 0) {
            const frist = subArr[0]
            let fristData
            if (frist.indexOf('://') > -1) {
              fristData = this.dataCatalogAllArr.find(
                (layer) => layer.serverURL === frist
              )
            } else {
              fristData = this.dataCatalogAllArr.find(
                (layer) => layer.guid === frist
              )
            }
            let parentData = fristData ? this.getParent(fristData) : null

            const transferSubArr = []
            subArr.forEach((item) => {
              if (item.indexOf('://') > -1) {
                const find = this.dataCatalogLayerArr.find(
                  (config) => config.serverURL === item
                )
                transferSubArr.push(find.guid)
              } else {
                transferSubArr.push(item)
              }
            })
            if (parentData) {
              transferCheckKeysRelation[parentData.guid] = transferSubArr
            }
          }
        })
      }
      return transferCheckKeysRelation
    },
    getParent(subData) {
      const find = this.dataCatalogAllArr.find(
        (item) => item.guid === subData.parentId
      )
      if (find && find.parentId) {
        return this.getParent(find)
      } else {
        return find
      }
    },
  },
}
</script>

<style></style>
