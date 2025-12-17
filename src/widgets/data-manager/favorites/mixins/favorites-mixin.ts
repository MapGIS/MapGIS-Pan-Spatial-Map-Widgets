import {
  UUID,
  AppMixin,
  MapMixin,
  FitBound,
  DataCatalogCheckController,
  BaseMapController,
  eventBus,
  events,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import axios from 'axios'
export default {
  mixins: [AppMixin, MapMixin],
  data() {
    return {
      baseMapController: BaseMapController,
      dataCatalogCheckController: DataCatalogCheckController,
      dataCatalogManager: dataCatalogManagerInstance,
      currentId: '',
      isAgain: false,
    }
  },
  computed: {
    // 获取数据目录微件中勾选的节点
    checkKeys() {
      return this.dataCatalogCheckController.getCheckKeys()
    },
    // 获取数据目录微件中的目录树
    checkData() {
      return this.dataCatalogCheckController.getCheckData()
    },
    // 获取图层管理微件的图层配置信息
    layerConfig() {
      return this.dataCatalogCheckController.getCheckLayerConfig()
    },
    // 获取场景管理微件的场景配置信息
    sceneConfig() {
      return this.dataCatalogCheckController.getCheckSceneConfig()
    },
    // 获取底图管理微件的底图配置信息
    baseMapConfig() {
      return this.baseMapController.currentBaseMapInfo
    },
    // 获取数据目录微件中所有服务节点信息
    dataCatalogLayerArr() {
      return this.dataCatalogManager.getAllLayerConfigItems()
    },
    // 获取数据目录微件中所有节点信息
    dataCatalogAllArr() {
      return this.dataCatalogManager.getAllConfigItems()
    },
    imagesUploadApi() {
      return `${this.baseUrl}/${this.appProductName}/rest/services/system/ResourceServer/files/pictures`
    },
  },
  methods: {
    /**
     * 获取收藏内容
     * @param favoriteName 收藏名称
     * @returns 收藏内容对象
     */
    async getFavoriteContent(favoriteName) {
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
      const { map, viewer } = this

      const data = {
        // 唯一id
        id: undefined,
        // 场景定格名称
        name: favoriteName,
        image: '',
        // 地图模式，若当前二维地图数据是三维地图下保存的数据则自动跳转三维地图
        is2DMapMode: undefined,
        // 数据目录勾选的key
        checkKeys: [...this.checkKeys],
        // 数据目录勾选的key与对应的tab映射关系
        checkKeysRelation: {},
        // 存储当前场景展示的tree数据
        data: [],
        // 配置参数，如保存数据时的地图范围等数据，用于还原
        options: {
          layerConfig: undefined,
          sceneConfig: undefined,
          baseMapConfig: undefined,
          mapBound: undefined,
        },
      }
      if (this.checkKeys.length) {
        // 获取里列表展示时的tree结构数据
        const { checkRelation, treeNeedData } = this.getTreeStructure()
        data.data = treeNeedData
        data.checkKeysRelation = checkRelation
      }

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
        const mapBoundArray = map.getBounds().toArray()
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
      return data
    },

    /**
     * 复现收藏内容
     * @param favoriteContent 收藏内容
     * @param searchPathType 搜索路径类型 relative | absolute
     */
    showFavoriteContent(favoriteContent, searchPathType) {
      const { Cesium, map, vueCesium, viewer } = this
      this.isAgain = this.currentId === favoriteContent.id
      this.currentId = favoriteContent.id
      this.baseMapController.isResize = false
      if (this.is2DMapMode !== favoriteContent.is2DMapMode) {
        this.switchMapMode()
      }

      const options = JSON.parse(JSON.stringify(favoriteContent.options))
      this.dataCatalogCheckController.setCurrentCheckLayerConfig(
        this.transferLayer(options.layerConfig, searchPathType)
      )
      // 需要重置一次
      if (this.isAgain) {
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
      if (favoriteContent.is2DMapMode) {
        const mapParams = { Cesium, map, vueCesium, viewer }
        setTimeout(() => {
          FitBound.fitBound2D(favoriteContent.options.mapBound, mapParams)
          // 发送勾选数据目录节点消息
          eventBus.$emit(
            events.DATA_CATALOG_CHECK_NODES,
            this.transferCheckKeyArr(favoriteContent.checkKeys, searchPathType),
            this.transferCheckKeysRelation(
              favoriteContent.checkKeysRelation,
              searchPathType
            )
          )
        }, 1000)
      } else {
        const { roll, pitch, heading, position } =
          favoriteContent.options.mapBound
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
            this.transferCheckKeyArr(favoriteContent.checkKeys, searchPathType),
            this.transferCheckKeysRelation(
              favoriteContent.checkKeysRelation,
              searchPathType
            )
          )
        }, 1000)
      }
      eventBus.$emit(
        events.ECHO_LAYER_LIST_INFO,
        favoriteContent.options.layerConfig
      )
    },

    /**
     * 获取树结构信息
     * @returns 树结构信息、树结构关联关系信息
     */
    getTreeStructure() {
      const checkData = JSON.parse(JSON.stringify(this.checkData))
      // 获取选择的节点组成的目录树数据
      const treeData = this.getTreeData(checkData)
      // 保存关联关系
      const checkRelation = this.getCheckRelation(treeData)
      // 将array转成tree结构
      const treeNeedData = []
      treeData.forEach((item) => {
        const child = this.arrayToTree(item)
        treeNeedData.push(child[0])
      })
      return { checkRelation, treeNeedData }
    },

    /**
     * 获取选择的节点组成的目录树数据
     * @param data 完整的目录树数据
     * @returns 被选择的节点组成的目录树数据
     */
    getTreeData(data) {
      const treeConvertList = []
      // 将tree转成array
      this.treeToArray(data, treeConvertList, undefined)
      // 通过勾选节点寻找父节点
      const treeData = []
      // 处理key
      const checkedChildKeys = this.getChlidKeys(treeConvertList)
      checkedChildKeys.forEach((item) => {
        const child = []
        // 递归从treeConvertList获取关联数据
        this.findParent(treeConvertList, child, item)
        // 合并treeData
        this.mergeTreeData(treeData, child)
      })

      return treeData
    },

    /**
     * 将tree转成array
     * @param data tree对象
     * @param arr array对象
     * @param parentId 父节点id
     */
    treeToArray(data, arr, parentId) {
      data.forEach((item) => {
        item.parentId = parentId
        arr.push(item)
        if (item.children && item.children.length > 0) {
          this.treeToArray(item.children, arr, item.guid)
        }
      })
    },

    /**
     * 获取checkKeys中的子节点
     * @param list 目标数组对象
     * @returns 子节点的id
     */
    getChlidKeys(list) {
      const keys = []
      this.checkKeys.forEach((item) => {
        const data = list.find((node) => node.guid === item)
        if (data && !data.children) {
          keys.push(item)
        }
      })
      return keys
    },

    /**
     * 递归从data中获取关联数据
     * @param data 目标数组对象
     * @param child 子节点数组
     * @param childId 子节点id
     */
    findParent(data, child, childId) {
      const current = data.find((item) => item.guid === childId)
      child.push(current)
      if (!current.parentId) return
      const parent = data.find((item) => item.guid === current.parentId)
      this.findParent(data, child, parent.guid)
    },

    /**
     * 合并树结构数据
     * @param treeData 合并后树结构数据
     * @param child 被合并的树结构数据
     */
    mergeTreeData(treeData, child) {
      if (treeData.length === 0) {
        treeData.push(child)
      } else {
        const childRoot = child.find((item) => !item.parentId)
        let flag
        treeData.forEach((item, index) => {
          const target = item.find((node) => node.guid === childRoot.guid)
          if (target) flag = index
        })

        if (typeof flag === 'number') {
          const newData = this.mergeData(treeData[flag], child)
          treeData[flag] = newData
        } else {
          treeData.push(child)
        }
      }
    },

    /**
     * 合并相同父节点的树结构数据
     * @param treeData 合并前的树结构数据
     * @param child 被合并的树结构数据
     * @returns 合并后的树结构数据
     */
    mergeData(treeData, child) {
      const add = []
      treeData.forEach((item) => {
        const data = child.find((node) => node.guid === item.guid)
        !data && add.push(item)
      })
      return [...add, ...child]
    },

    /**
     * 获取树结构数据中的结构关系
     * @param treeData 树结构展开后的数组对象
     * @returns 树结构数据中的结构关系
     */
    getCheckRelation(treeData) {
      const checkKeysRelation = {}
      treeData.forEach((item) => {
        const parent = item.find((node) => node.level === 0)
        const childs = item.filter((node) => !node.children)
        checkKeysRelation[parent.guid] = []
        childs.forEach((node) => {
          checkKeysRelation[parent.guid].push(node.guid)
        })
      })
      return checkKeysRelation
    },

    /**
     * 将树结构展开后的数组对象转换成树结构对象
     * @param list 树结构展开后的数组对象
     * @returns 树结构对象
     */
    arrayToTree(list) {
      const treeList = []
      const map = {}
      list.forEach((item) => {
        item.children = []
        map[item.guid] = item
      })

      list.forEach((item) => {
        // 对于每一个元素来说，先找它的上级
        // 如果能找到，说明它有上级，则要把它添加到上级的children中去
        // 如果找不到，说明它没有上级，直接添加到 treeList
        const parent = map[item.parentId]
        // 如果存在则表示item不是最顶层的数据
        if (parent) {
          parent.children.push(item)
        } else {
          // 如果不存在 则是顶层数据
          treeList.push(item)
        }
      })
      return treeList
    },

    /**
     * 将收藏对象中checkKeys和checkKeysRelation记录的图层id转换为图层的url地址
     * @param data 收藏内容对象
     */
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
    /**
     * 获取底图配置信息
     * @param baseMapConfig
     * @returns 底图配置信息
     */
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
        const transferIndexBaseMapGUID = indexBaseMapGUID
          ? this.getUrlArr([indexBaseMapGUID], baseMapList)
          : indexBaseMapGUID
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

    getImage() {
      const { Cesium, viewer, map } = this
      // @ts-ignore
      const reImg = new zondy.cesium.ReImg()
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

    uploadImage(image) {
      const file = new FormData()
      file.append('file', image)
      return new Promise((resolve, reject) => {
        axios
          .post(this.imagesUploadApi, file, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': JSON.parse(
                localStorage.getItem(`access_token_${this.appProductName}`)
              ),
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

    /**
     * 转换图层树配置信息
     * @param layerConfig 图层管理图层树配置信息
     * @param searchPathType 搜索路径类型 relative | absolute
     * @returns 图层树配置信息
     */
    transferLayer(layerConfig, searchPathType) {
      const { layerInfo, relation } = layerConfig
      const transferLayerInfo = {}
      const transferRelation = {}
      Object.keys(layerInfo).forEach((item) => {
        // 兼容guid的情况
        if (item.includes('://')) {
          const find = this.findDataCatalognNode(item, searchPathType)

          if (find) {
            transferLayerInfo[find.guid] = layerInfo[item]
          }
        } else {
          transferLayerInfo[item] = layerInfo[item]
        }
      })
      Object.keys(relation).forEach((item) => {
        if (item.includes('://')) {
          const find = this.findDataCatalognNode(item, searchPathType)

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

    /**
     * 将底图配置转换为可直接使用的底图配置
     * @param baseMapConfig
     * @returns 转换后的底图配置信息
     */
    transferBaseMap(baseMapConfig) {
      const { saveType, baseMapList } = this.baseMapController
      if (saveType === 'guid') {
        // 原逻辑不做处理
      } else if (saveType === 'url') {
        const { onSelect, unSelect, zoomArr, indexBaseMapGUID } = baseMapConfig
        const transferOnSelect = this.getBaseMapGuid(onSelect, baseMapList)
        const transferUnSelect = this.getBaseMapGuid(unSelect, baseMapList)
        const transferZoomArr = this.getBaseMapGuid(zoomArr, baseMapList)
        const transferIndexBaseMapGUID = indexBaseMapGUID
          ? this.getBaseMapGuid(indexBaseMapGUID, baseMapList)
          : ['']
        baseMapConfig.onSelect = transferOnSelect
        baseMapConfig.unSelect = transferUnSelect
        baseMapConfig.zoomArr = transferZoomArr
        baseMapConfig.indexBaseMapGUID = transferIndexBaseMapGUID[0]
      }
      return baseMapConfig
    },

    /**
     * 通过底图的服务地址列表获取底图的唯一id列表
     * @param urls 服务地址
     * @param baseMapList 底图列表
     * @returns 底图的唯一id列表
     */
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
              if (this.searchPathType === 'relative') {
                if (flag) {
                  const relativeUrl = this.getRelativeUrl(item.serverURL)

                  if (relativeUrl) {
                    flag = url.find(
                      (child) => child && child.includes(relativeUrl)
                    )
                  } else {
                    if (!url.includes(item.serverURL)) {
                      flag = false
                    }
                  }
                }
              } else {
                if (!url.includes(item.serverURL)) {
                  flag = false
                }
              }
            })
          }
          return flag
        })
        find && transferGuid.push(find.guid)
      })
      return transferGuid
    },

    /**
     * 将记录的服务地址列表转换为服务id列表
     * @param checkKeys 数据目录服务地址列表
     * @param searchPathType 搜索路径类型 relative | absolute
     * @returns 服务id列表
     */
    transferCheckKeyArr(checkKeys, searchPathType) {
      const transferCheckKeys = []
      checkKeys.forEach((item) => {
        if (item.indexOf('://') > -1) {
          const find = this.findDataCatalognNode(item, searchPathType)

          if (find) {
            transferCheckKeys.push(find.guid)
          }
        } else {
          transferCheckKeys.push(item)
        }
      })
      return transferCheckKeys
    },

    /**
     * 将数据目录服务url关联关系转换成节点的id对应关系
     * @param checkKeysRelation 数据目录服务关联关系对象
     * @param searchPathType 搜索路径类型 relative | absolute
     * @returns 节点的id对应关系对象
     */
    transferCheckKeysRelation(checkKeysRelation, searchPathType) {
      // 获取父级节点只需要使用对应关系数组中的一个url地址就行
      const transferCheckKeysRelation = {}
      if (checkKeysRelation && Object.keys(checkKeysRelation).length > 0) {
        Object.keys(checkKeysRelation).forEach((item) => {
          const subArr = checkKeysRelation[item]
          if (subArr && subArr.length > 0) {
            const frist = subArr[0]
            let fristData
            if (frist.indexOf('://') > -1) {
              fristData = this.findDataCatalognNode(frist, searchPathType)
            } else {
              fristData = this.dataCatalogAllArr.find(
                (layer) => layer.guid === frist
              )
            }
            const parentData = fristData ? this.getParent(fristData) : null

            const transferSubArr = []
            subArr.forEach((item) => {
              if (item.indexOf('://') > -1) {
                const find = this.findDataCatalognNode(item, searchPathType)
                if (find) {
                  transferSubArr.push(find.guid)
                }
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

    /**
     * 通过url地址查找对应的节点
     * @param url url地址
     * @param searchPathType 搜索路径类型 relative | absolute
     * @returns 目标节点
     */
    findDataCatalognNode(url, searchPathType) {
      // 以绝对路径还是相对路径进行匹配
      let find
      if (searchPathType === 'relative') {
        const relativeUrl = this.getRelativeUrl(url)
        if (relativeUrl) {
          // 查找相对路径的地址
          find = this.dataCatalogLayerArr.find(
            (node) => node.serverURL && node.serverURL.includes(relativeUrl)
          )
        } else {
          // url解析失败走绝对路径的方式匹配
          find = this.dataCatalogLayerArr.find((node) => node.serverURL === url)
        }
      } else {
        find = this.dataCatalogLayerArr.find((node) => node.serverURL === url)
      }
      return find
    },

    /**
     * 通过子节点获取父节点
     * @param subData 子节点
     * @returns 父节点
     */
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

    /**
     *获取url相对地址
     * @param url url地址
     * @returns url相对地址
     */
    getRelativeUrl(url) {
      let relativeUrl
      try {
        const { origin } = new URL(url)
        relativeUrl = url.replace(origin, '')
      } catch (error) {}
      return relativeUrl
    },
  },
}
