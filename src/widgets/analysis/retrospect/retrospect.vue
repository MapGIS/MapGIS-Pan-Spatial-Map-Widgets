<template>
  <div class="mp-widget-retrospect">
    <mapgis-ui-spin :spinning="loading">
      <mapgis-ui-setting-form
        layout="vertical"
        v-show="timeLineList.length"
        :no-last-margin-bottom="true"
      >
        <mapgis-ui-form-item>
          <mapgis-ui-group-tab
            slot="label"
            title="专题选择"
            :has-top-margin="false"
            :has-bottom-margin="false"
          ></mapgis-ui-group-tab>
          <mapgis-ui-tree-select
            class="retrospect-tree-select"
            :value="subject"
            @change="onSubjectChange"
            :dropdown-style="dropdownStyle"
            :replaceFields="replaceFields"
            :tree-data="treeData"
          />
          <mapgis-ui-row v-show="timeLineList.length">
            <div class="retrospect-time-line">
              <time-line
                id="retrospect-time-line"
                ref="timeLine"
                v-model="timeIndex"
                :timeLineList="timeLineYearList"
                :playInterval="interval"
                :autoPlay="isPlay"
              />
            </div>
          </mapgis-ui-row>
          <mapgis-ui-row
            type="flex"
            align="middle"
            justify="space-between"
            class="retrospect-row"
            v-show="timeLineList.length"
          >
            <mapgis-ui-col
              :span="24 / btns.length"
              v-for="btn in btns"
              :key="btn.name"
            >
              <mapgis-ui-tooltip placement="bottom" :title="btn.tooltip">
                <!-- 该位置显示图标 -->
                <mapgis-ui-iconfont
                  class="retrospect-btn"
                  :type="'mapgis-' + btn.name"
                  @click="btn.func"
                />
              </mapgis-ui-tooltip>
            </mapgis-ui-col>
          </mapgis-ui-row>
        </mapgis-ui-form-item>
        <mapgis-ui-form-item v-show="showInterval">
          <mapgis-ui-group-tab
            slot="label"
            title="时间间隔"
            :has-top-margin="false"
            :has-bottom-margin="false"
          ></mapgis-ui-group-tab>
          <mapgis-ui-row
            type="flex"
            align="middle"
            justify="start"
            class="retrospect-row"
          >
            <mapgis-ui-col :span="22">
              <mapgis-ui-input-number
                class="retrospect-input-number"
                v-model="interval"
                :min="1"
              />
            </mapgis-ui-col>
            <mapgis-ui-col :span="2" class="retrospect-input-number-unit">
              秒
            </mapgis-ui-col>
          </mapgis-ui-row>
        </mapgis-ui-form-item>
      </mapgis-ui-setting-form>
      <!-- 空数据友好提示 -->
      <mapgis-ui-empty v-show="!timeLineList.length" :image="simpleImage" />
    </mapgis-ui-spin>
  </div>
</template>

<script lang="ts">
import { MapgisUiEmpty } from '@mapgis/webclient-vue-ui'
import {
  WidgetMixin,
  WidgetState,
  dataCatalogManagerInstance,
} from '@mapgis/web-app-framework'
import _cloneDeep from 'lodash/cloneDeep'
import TimeLine from './components/TimeLine.vue'

interface IControl {
  name: string
  tooltip: string
  func: () => void
}

interface IDataCatalog {
  name: string // 节点名称
  description: string // 节点描述
  guid: string
  serverURL?: string
  children?: IDataCatalog[] // 子节点数组
  displayName?: string
}

export default {
  name: 'MpRetrospect',
  mixins: [WidgetMixin],
  components: {
    TimeLine,
  },
  data() {
    return {
      // 加载开关
      loading: false,
      // 目录树中选中的图层id
      dataCatalogTreeCheckedIds: [],
      // 目录树数据源
      dataCatalogTreeData: [],
      // 专题选择数据
      treeData: [],
      // 年度列表
      timeLineList: [],
      // 选中的专题
      subject: '',
      // 是否展示时间轴
      showTimeLine: false,
      // 是否展示播放时长
      showInterval: false,
      // 播放时长
      interval: 3,
      // 当前播放的年度索引
      timeIndex: 0,
      // 是否播放
      isPlay: false,
    }
  },

  computed: {
    /**
     * 树形选择控件下拉框样式
     */
    dropdownStyle() {
      return {
        maxWidth: '200px',
        maxHeight: '400px',
        overflow: 'auto',
      }
    },

    /**
     * 格式化树形选择控件数据源
     */
    replaceFields() {
      return {
        children: 'children',
        title: 'name',
        value: 'guid',
      }
    },

    /**
     * 时间轴展示的年度
     */
    timeLineYearList() {
      return this.timeLineList.map((v) => this.getYear(v.name))
    },

    /**
     * 时间轴操作按钮
     */
    btns() {
      let playName = 'play-circle'
      let playTooltip = '播放'
      if (this.isPlay) {
        playName = 'pause-circle'
        playTooltip = '暂停'
      }
      return [
        { name: 'redo', func: this.reset, tooltip: '重置' },
        { name: 'backward', func: this.prev, tooltip: '上一年' },
        { name: playName, func: this.btnPlay, tooltip: playTooltip },
        { name: 'forward', func: this.next, tooltip: '下一年' },
        { name: 'time-circle', func: this.setInterval, tooltip: '播放间隔' },
      ]
    },
  },

  /**
   * 监听: 时间轴变化
   */
  watch: {
    timeIndex(nV: number) {
      if (this.timeLineList.length) {
        this.updateCheckedIds(this.getCheckedIds(this.timeLineList[nV]))
      }
    },
  },

  beforeCreate() {
    this.simpleImage = MapgisUiEmpty.PRESENTED_IMAGE_SIMPLE
  },

  methods: {
    /**
     * 打开专题回溯面板
     */
    async onOpen() {
      this.loading = true
      this.showTimeLine = true
      this.dataCatalogTreeCheckedIds = [
        ...dataCatalogManagerInstance.checkedLayerConfigIDs,
      ]
      try {
        const dataCatalogTreeData =
          await dataCatalogManagerInstance.getDataCatalogTreeData()
        if (dataCatalogTreeData.length) {
          this.treeData = this.handleDataCatalog(
            _cloneDeep(dataCatalogTreeData)
          )
          this.dataCatalogTreeData = dataCatalogTreeData
          this.onSubjectChange(dataCatalogTreeData[0].guid)
          this.loading = false
        }
      } catch {
        this.loading = false
      }
    },

    /**
     * 关闭专题回溯面板
     */
    onClose() {
      this.interval = 3
      this.showInterval = false
      this.isPlay = false
      this.resetCheckedIds()
      const timer = setTimeout(() => {
        this.showTimeLine = false
        clearTimeout(timer)
      })
    },

    /**
     * 视图窗口变化
     */
    onWindowSize(mode: 'max' | 'normal') {
      this.$nextTick(() => {
        const ref: any = this.$refs.timeLine
        if (ref) {
          const width = mode === 'max' ? this.$el.clientWidth : 400
          ref.resize(width)
        }
      })
    },

    /**
     * 回溯专题变化
     * @param value<string>
     */
    onSubjectChange(value: string) {
      this.subject = value
      this.isPlay = false
      const checkedNode = this.getCheckedNode(
        this.dataCatalogTreeData,
        value,
        []
      )
      this.timeLineList = this.getDataCatalogTimeList(checkedNode)
      this.timeIndex = 0
      this.updateCheckedIds(this.getCheckedIds(this.timeLineList[0]))
    },

    /**
     * 获取年度
     * @param str<string>
     */
    getYear(str: string) {
      return Number(str.substring(0, 4))
    },

    /**
     * 是否是年度节点
     * @param str<string>
     */
    hasYearNode(str: string) {
      return !isNaN(this.getYear(str))
    },

    /**
     * 获取选中的节点
     * @param data<array>
     * @param value<string>
     * @param node<array>
     */
    getCheckedNode(data: IDataCatalog[], value: string, node: IDataCatalog[]) {
      for (let n = 0; n < data.length; n++) {
        const item = data[n]
        if (item.guid === value) {
          node = [item]
          break
        } else if (item.children && item.children.length) {
          node = this.getCheckedNode(item.children, value, node)
        }
      }
      return node
    },

    /**
     * 获取选中节点下的年度列表
     * @param data<array> 目录树
     */
    getDataCatalogTimeList(data: IDataCatalog[]) {
      return data.reduce<IDataCatalog[]>((results, item) => {
        if (this.hasYearNode(item.name)) {
          results.push(item)
        } else if (
          /(分类|专题)(:|：)/.test(item.description) &&
          item.children &&
          item.children.length
        ) {
          return this.getDataCatalogTimeList(item.children)
        }

        return results
      }, [])
    },

    /**
     * 处理目录树， 筛选出有年度的专题展示
     * @param tree<array>
     */
    handleDataCatalog(
      tree: IDataCatalog[],
      parentNode?: IDataCatalog,
      guids: string[] = []
    ) {
      if (!tree.length) return []
      for (let n = 0; n < tree.length; n++) {
        const item = tree[n]
        if (item.children && item.children.length) {
          this.handleDataCatalog(item.children, item, guids)
        }
        if (item.children && !item.children.length) {
          item.children = undefined
        }
        const _hasYearNode = this.hasYearNode(item.name)
        if (_hasYearNode) {
          guids.push(parentNode.guid)
        }
        if (_hasYearNode || (!item.children && !guids.includes(item.guid))) {
          tree.splice(n, 1)
          n--
        }
      }

      return tree
    },

    /**
     * 获取回溯年度的图层服务ID集合
     * @param <object>
     */
    getCheckedIds({ guid, children, serverURL }: IDataCatalog) {
      let ids: string[] = []
      if (children && children.length && children.some((v) => v.serverURL)) {
        ids = children.map((v) => v.guid)
      } else if (serverURL) {
        ids = [guid]
      }
      return ids
    },

    /**
     * 重置目录树组件已选图层
     */
    resetCheckedIds() {
      dataCatalogManagerInstance.checkedLayerConfigIDs = [
        ...this.dataCatalogTreeCheckedIds,
      ]
    },

    /**
     * 更新目录树组件图层, 不保留目录树已勾选图层
     * @param ids<array>
     */
    updateCheckedIds(ids: string[]) {
      dataCatalogManagerInstance.checkedLayerConfigIDs = ids
    },

    /**
     * 播放或暂停
     */
    btnPlay() {
      this.isPlay = this.timeLineList.length > 1 ? !this.isPlay : false
    },

    /**
     * 下一时间
     */
    next() {
      if (this.timeIndex < this.timeLineList.length - 1) {
        this.timeIndex++
      }
    },

    /**
     * 上一时间
     */
    prev() {
      if (this.timeIndex > 0) {
        this.timeIndex--
      }
    },

    /**
     * 重置
     */
    reset() {
      this.timeIndex = 0
      this.isPlay = false
    },

    /**
     * 设置自动播放的时间
     */
    setInterval() {
      this.showInterval = !this.showInterval
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-retrospect {
  padding: 8px 16px;
  .retrospect-row {
    margin-bottom: 8px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .retrospect-input-number-unit {
    text-align: right;
  }
  .retrospect-tree-select,
  .retrospect-input-number {
    width: 100%;
  }
  .retrospect-time-line {
    position: relative;
    overflow: hidden;
    text-align: center;
  }
  .retrospect-btn {
    font-size: 16px;
    cursor: pointer;
    &:hover {
      color: $primary-color;
    }
  }
  ::v-deep .mapgis-ui-divider-horizontal,
  ::v-deep .mapgis-ui-empty-normal {
    margin: 8px 0;
  }
}
</style>
