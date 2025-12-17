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
  WidgetMixin,
  FitBound,
  DataCatalogCheckController,
  BaseMapController,
  eventBus,
  events,
  api,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import { defaultSceneSetting } from './index'
import FavoritesMixin from './mixins/favorites-mixin'

export default {
  name: 'MpFavorites',
  mixins: [WidgetMixin, FavoritesMixin],
  data() {
    return {
      dataList: [], // 初始化从接口获取的数据
      replaceFields: {}, // 列表模式下tree组件中节点信息展示的替换字段{title: "name",key: "guid"}，具体使用参考ant-design-vue中的tree组件对应api
      baseMapController: BaseMapController,
    }
  },
  computed: {
    showType() {
      return this.widgetInfo.config.showType
    },
    // 搜索路径类型 relative | absolute
    searchPathType() {
      return this.widgetInfo.config.searchPathType
    },
    imagesUploadApi() {
      // return `${this.baseUrl}/psmap/rest/manager/file/upload`
      return `${this.baseUrl}/${this.appProductName}/rest/services/system/ResourceServer/files/pictures`
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
    if (!this.widgetInfo.config.searchPathType) {
      this.$set(this.widgetInfo.config, 'searchPathType', 'absolute')
    }
    this.dataList = this.initData(
      JSON.parse(JSON.stringify(this.widgetInfo.config.data))
    )
    this.baseMapController.saveType = 'url'
  },
  methods: {
    addData() {
      this.$refs.favorites.openAddModel()
    },
    async onAddData(favoriteName) {
      const data = await this.getFavoriteContent(favoriteName)
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
      this.showFavoriteContent(item, this.searchPathType)
    },
    /**
     * 保存数据
     */
    async saveData() {
      if (this.designTime) {
        const originConfig = {
          data: this.dataList,
          showType: this.showType,
          searchPathType: this.searchPathType,
        }
        this.setWidgetData(JSON.parse(JSON.stringify(originConfig)))
      } else if (this.previewTime) {
      } else {
        const originConfig = await api.getWidgetConfig('favorites')
        originConfig.data = this.dataList
        if (!originConfig.showType) {
          originConfig.showType = this.showType
        }
        if (!originConfig.searchPathType) {
          originConfig.searchPathType = this.searchPathType
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
      }
    },
    initData(data) {
      if (data.length > 0) {
        data.forEach((item) => {
          const sceneConfig = this.mergeObjects(
            JSON.parse(JSON.stringify(defaultSceneSetting)),
            item.options.sceneConfig || {}
          )
          item.options.sceneConfig = sceneConfig
        })
      }
      return data
    },
    mergeObjects(target, source) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (
            target.hasOwnProperty(key) &&
            typeof target[key] === 'object' &&
            typeof source[key] === 'object'
          ) {
            this.mergeObjects(target[key], source[key])
          } else {
            target[key] = source[key]
          }
        }
      }
      return target
    },
    // 微件配置变化事件
    onWidgetConfigChange(newValue, oldValue) {
      this.dataList = this.initData(
        JSON.parse(JSON.stringify(newValue.data || []))
      )
    },
  },
  beforeDestroy() {
    eventBus.$off(events.DATA_CATALOG_ADD_COLLECT)
  },
}
</script>

<style lang="scss" scoped></style>
