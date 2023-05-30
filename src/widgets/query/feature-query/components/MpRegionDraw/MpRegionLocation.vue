<template>
  <div v-show="visible">
    <div class="gm-region-location__main">
      <!-- 标题 -->
      <div class="header">
        <span class="title">行政区列表</span>
        <mapgis-ui-ant-icon
          type="delete"
          class="icon-btn"
          title="清空"
          @click="close"
        ></mapgis-ui-ant-icon>
      </div>
      <!-- 主要内容 -->
      <div class="region-location-main">
        <div class="search-div">
          <div class="current-city">
            当前区域：{{ city }}
            <span class="remove-geom" @click="clear">清除</span>
          </div>
          <mapgis-ui-row>
            <mapgis-ui-col :span="12">
              <mapgis-ui-input
                class="gdSerachInput"
                placeholder="请输入城市名"
                size="small"
                style="margin: 1px"
                v-model="inputTxt"
              >
                <mapgis-ui-ant-icon
                  type="search"
                  slot="suffix"
                  class="mapgis-ui-input__icon mapgis-ui-icon-search"
                ></mapgis-ui-ant-icon>
              </mapgis-ui-input>
            </mapgis-ui-col>
            <mapgis-ui-col :span="12" style="text-align: right">
              <mapgis-ui-ant-icon
                type="interaction"
                @click="orderChange"
              ></mapgis-ui-ant-icon>
            </mapgis-ui-col>
          </mapgis-ui-row>
        </div>
        <!-- 城市列表 -->
        <div class="citys-content">
          <!-- 按照城市排序 -->
          <div class="citys namess" v-if="regionSearch">
            <mapgis-ui-row
              :key="key"
              v-for="(region, key) in regionsList"
              type="flex"
            >
              <mapgis-ui-col :span="5">
                <mapgis-ui-button
                  @click="
                    city = region.properties.name
                    changeArea(
                      region.properties.center,
                      region.geometry.coordinates
                    )
                  "
                  style="text-align: center; padding: 0 5px; width: 70px"
                  class="city_all_first"
                  type="text"
                >
                  {{ region.properties.name }}
                </mapgis-ui-button>
              </mapgis-ui-col>
              <mapgis-ui-col :span="19">
                <div
                  style="float: left; margin: 0 2px 2px 0"
                  v-for="item in region.child.features"
                  :key="item.properties.adcode"
                >
                  <mapgis-ui-button
                    @click="
                      city = region.properties.name + ' ' + item.properties.name
                      changeArea(
                        item.properties.center,
                        item.geometry.coordinates
                      )
                    "
                    type="text"
                    :class="
                      city ==
                      region.properties.name + ' ' + item.properties.name
                        ? 'city_active'
                        : 'area_all'
                    "
                  >
                    {{ item.properties.name }}
                  </mapgis-ui-button>
                </div>
              </mapgis-ui-col>
            </mapgis-ui-row>
          </div>
          <!-- 按照字母排序 -->
          <div class="citys letters" v-else>
            <mapgis-ui-row
              :key="key"
              v-for="(area, key) in letterList"
              type="flex"
              style="margin-bottom: 2px"
            >
              <mapgis-ui-col :span="4">
                <mapgis-ui-button type="text" style="width: 40px">
                  {{ key }}
                </mapgis-ui-button>
              </mapgis-ui-col>
              <mapgis-ui-col :span="18">
                <mapgis-ui-button
                  style="float: left; margin: 0 2px 2px 0"
                  :key="item.properties.adcode"
                  @click="
                    city = item.properties.name
                    changeArea(
                      item.properties.center,
                      item.geometry.coordinates
                    )
                  "
                  type="text"
                  v-for="item in area"
                  :class="
                    city == item.properties.name ? 'city_active' : 'area_all'
                  "
                >
                  {{ item.properties.name }}
                </mapgis-ui-button>
              </mapgis-ui-col>
            </mapgis-ui-row>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  props: {
    // 窗体显示
    visible: {
      type: Boolean,
      default: true,
    },
    baseUrl: {
      type: String,
    },
    regionsUrl: {
      type: String,
      default: '/file/default/countrynation.json',
    },
  },
  data() {
    return {
      // 当前选中的城市
      city: '',
      // 按行政区排序查询
      regionSearch: true,
      // 搜索关键字
      inputTxt: '',
      // 背景图对象
      // tabBackImg: tabBackImg,
      // 行政区列表
      backupRegionsList: [], // 备份
      regionsList: [],
      // 字母列表
      backupLetterList: [],
      letterList: [],
      timer: null,
    }
  },
  methods: {
    // 排序列表切换
    orderChange() {
      this.inputTxt = ''
      this.regionSearch = !this.regionSearch
      if (this.regionSearch) {
        this.regionsList = this.backupRegionsList
      } else {
        this.letterList = this.backupLetterList
      }
    },
    // 搜索
    inputSearch() {
      if (this.inputTxt === '') {
        if (this.regionSearch) {
          // 行政区
          this.regionsList = this.backupRegionsList
        } else {
          // 字母
          this.letterList = this.backupLetterList
        }
      } else {
        // 对象必须要深度复制
        const backupLetterList = JSON.parse(
          JSON.stringify(this.backupLetterList)
        )
        console.log('this.backupLetterList111', this.backupLetterList)
        // 行政区
        if (this.regionSearch) {
          const list = []
          // eslint-disable-next-line
          for (let j in backupLetterList) {
            const regions = backupLetterList[j]
            // eslint-disable-next-line
            for (let i in regions) {
              const region = regions[i]
              // 二级
              const newFeatures = region.child.features.filter((f) => {
                return f.properties.name.indexOf(this.inputTxt) >= 0
              })
              region.child.features = newFeatures
              // 一级
              if (
                region.properties.name.indexOf(this.inputTxt) >= 0 ||
                newFeatures.length > 0
              ) {
                list.push(region)
              }
            }
          }
          this.regionsList = list
          // console.log(GmSceneContainer.getContainer(this.containerId));
        } else {
          // 字母
          const list = {}
          // eslint-disable-next-line
          for (let j in backupLetterList) {
            const regions = backupLetterList[j]
            // eslint-disable-next-line
            for (let i in regions) {
              const region = { ...regions[i] }
              // 一级
              if (region.properties.name.indexOf(this.inputTxt) >= 0) {
                if (!list[j]) {
                  list[j] = []
                }
                list[j].push(region)
              }
            }
          }
          this.letterList = list
        }
      }
    },
    close() {
      // 事件
      this.$emit('update:visible', false)
      this.$emit('close')
    },
    changeArea(center, borders) {
      this.$emit('select', { center, borders, city: this.city })
    },
    clear() {
      this.city = ''
    },
    // 初始化字母列表
    initLetterList() {
      /* eslint-disable*/
      const allRegions = this.regionsList
      const areas = []
      // eslint-disable-next-line
      for (let region in allRegions) {
        areas.push(allRegions[region])
        // eslint-disable-next-line
        if (allRegions[region]['child'].length > 0)
          if (allRegions[region]['child'].features.length > 1)
            for (let area in allRegions[region]['child'].features) // eslint-disable-line
              areas.push(allRegions[region]['child'].features[area]) // eslint-disable-line
      }
      // 调整顺序
      areas.sort((x, y) => {
        return x.properties.pinyin > y.properties.pinyin ? 1 : -1
      })
      let list = {}

      areas.map((item) => {
        // 拼音首字母
        let pinyin = item.properties.pinyin[0]
        // 如果没有先赋值
        if (!list[pinyin]) {
          list[pinyin] = []
        }
        list[item.properties.pinyin[0]].push(item)
      })
      // 字母排序
      this.letterList = JSON.parse(JSON.stringify(list))
      this.backupLetterList = JSON.parse(JSON.stringify(list))
    },
    async initAll() {
      const res = await axios.get(this.baseUrl + this.regionsUrl)
      this.regionsList = res.data.children
      this.backupRegionsList = JSON.parse(JSON.stringify(res.data.children))
      this.initLetterList()
    },
  },
  destroyed() {
    this.close()
  },
  watch: {
    inputTxt(val) {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.inputSearch()
      }, 300)
    },
  },
  mounted() {
    this.initAll()
  },
}
</script>
<style lang="scss" scoped>
.gm-region-location__main {
  display: inline-block;
  width: 421px;
  font-size: 14px;
  .header {
    height: 40px;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      letter-spacing: 1px;
      font-family: MicrosoftYaHeiUI-Bold;
      color: $text-color;
    }
    i {
      cursor: pointer;
      font-size: 18px;
    }
  }
  .region-location-main {
    width: 421px;
    height: 260px;
    .mapgis-ui-row {
      word-wrap: break-word;
      word-break: normal;
    }
    .mapgis-ui-button {
      font-size: 14px;
      margin: 0 18px 16px 0;
      padding: 5px 0;
    }
    .search-div {
      height: 80px;
      padding: 10px 20px 0 16px;
      .current-city {
        text-align: left;
        margin-bottom: 12px;
        position: relative;
        .remove-geom {
          cursor: pointer;
          float: right;
          letter-spacing: 2px;
        }
      }
      .current-mode {
        cursor: pointer;
        font-size: 16px;
      }
      .tab-back {
        padding: 5px;
        .area-btn {
          margin: 0 20px;
        }
      }
    }
    .citys {
      padding-left: 16px;
      height: 170px;
      overflow-y: scroll;
      scrollbar-arrow-color: white; /**/ /*三角箭头的颜色*/
      scrollbar-face-color: #37a2ff; /**/ /*立体滚动条的颜色*/
      scrollbar-3dlight-color: white; /**/ /*立体滚动条亮边的颜色*/
      scrollbar-highlight-color: white; /**/ /*滚动条空白部分的颜色*/
      scrollbar-shadow-color: white; /**/ /*立体滚动条阴影的颜色*/
      scrollbar-darkshadow-color: white; /**/ /*立体滚动条强阴影的颜色*/
      scrollbar-track-color: white; /**/ /*立体滚动条背景颜色*/
      scrollbar-base-color: #37a2ff; /**/ /*滚动条的基本颜色*/
      .mapgis-ui-button {
        font-size: 14px;
      }
    }
  }
}
</style>
<style lang="scss">
.gm-region-location__main {
  .gdSerachInput .mapgis-ui-input__inner {
    border-color: $text-color;
  }
  .mapgis-ui-icon-search {
    color: $text-color;
  }
}
.city_all_first {
  span {
    display: inline-block;
    width: 50px;
    vertical-align: middle;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}
</style>
