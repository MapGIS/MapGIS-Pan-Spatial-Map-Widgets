<template>
  <div class="mp-widget-city-grow">
    <mapgis-ui-row>
      <!-- <label class='mp-widget-label'>数据源设置</label> -->
      <mapgis-ui-group-tab title="数据源设置" />
    </mapgis-ui-row>
    <div>
      <mapgis-ui-row class="mp-row-style">
        <mapgis-ui-select
          v-model="selectResult"
          :show-search="true"
          :not-found-content="null"
          :filter-option="true"
          :allowClear="true"
          placeholder="请选择或输入地址"
          @change="onUrlChange"
          @search="handleSearch"
          @blur="handleBlur"
          style="width: 100%"
        >
          <mapgis-ui-select-option
            v-for="item in urlOptions"
            :key="item.baseUrl"
          >
            {{ item.baseUrl }}
          </mapgis-ui-select-option>
        </mapgis-ui-select>
      </mapgis-ui-row>
      <mapgis-ui-row style="height: 40px">
        <mapgis-ui-textarea
          class="url-example"
          disabled
          :value="`示例 : ${this.urlExample}`"
          auto-size
        ></mapgis-ui-textarea>
      </mapgis-ui-row>
      <mapgis-ui-row>
        <!-- <label class='mp-widget-label'>参数设置</label> -->
        <mapgis-ui-group-tab title="参数设置" />
      </mapgis-ui-row>
      <mapgis-3d-city-grow-options
        v-if="radioVal === 1"
        :cityGrowOptions="cityGrowOptions"
        @commitOptions="getCityGrowOptions"
        @saveConfig="saveConfig"
        ref="cityGrowOptions"
      ></mapgis-3d-city-grow-options>
      <mp-window-wrapper :visible="startCityGrow">
        <mapgis-ui-placement
          :position="'bottom-left'"
          v-show="startCityGrow"
          :offset="[52, 60]"
          style="right: 0px"
        >
          <mapgis-3d-city-grow
            v-if="startCityGrow"
            :baseUrl="url"
            :featureStyle="featureStyle"
            ref="cityGrow"
            @loaded="load"
          ></mapgis-3d-city-grow>
        </mapgis-ui-placement>
      </mp-window-wrapper>
    </div>
  </div>
</template>

<script lang="ts">
import { WidgetMixin, UrlUtil, api } from '@mapgis/web-app-framework'

export default {
  name: 'MpCityGrow',
  mixins: [WidgetMixin],

  data() {
    return {
      radioVal: 1,
      selectResult: '',
      url: '',
      cityGrowOptions: {},
      urlExample:
        'http://<server>:<port>/igs/rest/mrfs/docs/{docName}/{mapIndex}/{layerIndex}',
      featureStyle: {},
      startCityGrow: false,
      playWidth: 711,
      // 城市生长对象
      cityGrow: null,
      handleSearchTag: false,
      urlOptionsArray: [
        {
          baseUrl:
            'http://192.168.21.191:6163/igs/rest/mrfs/docs/shengZhenBaiMo/0/0',
          startTimeField: 'startTime',
          endTimeField: 'endTime',
          heightField: 'height',
        },
      ],
      urlOptions: [],
    }
  },

  async mounted() {
    const config = await api.getWidgetConfig('city-grow')
    this.urlOptions = config || this.urlOptionsArray
  },

  methods: {
    load(e) {
      this.cityGrow = e
    },

    onUrlChange(val) {
      if (val && !this.handleSearchTag) {
        const mapOption = this.urlOptions.filter((x) => x.baseUrl === val)

        this.cityGrowOptions = mapOption[0]
        this.url = val
      } else if (val === undefined) {
        this.cityGrowOptions = {}
        this.selectResult = ''
      }
    },

    handleBlur(value) {
      if (value == undefined || value == '') {
        if (typeof this.cityGrowOptions === 'string') {
          this.selectResult = this.cityGrowOptions
        }
      }
    },

    handleSearch(value) {
      if (value !== '') {
        if (!UrlUtil.isUrlValid(value)) {
          this.$message.warn('请输入正确的数据地址')
          return
        }
        this.cityGrowOptions = value
        this.url = value
        this.handleSearchTag = true
      } else {
        this.handleSearchTag = false
      }
    },

    getCityGrowOptions(featureStyle) {
      this.featureStyle = {}
      this.$nextTick(function () {
        this.featureStyle = featureStyle
        this.saveConfig()
      })
      this.startCityGrow = true
    },

    saveConfig() {
      let findTag = false
      const config = JSON.parse(JSON.stringify(this.urlOptions))
      this.featureStyle.baseUrl = this.url

      for (let i = 0; i < this.urlOptions.length; i++) {
        if (this.urlOptions[i].baseUrl === this.url) {
          config[i] = this.featureStyle
          findTag = true
        }
      }
      if (!findTag) {
        config.push(this.featureStyle)
      }

      api
        .saveWidgetConfig({
          name: 'city-grow',
          config: JSON.stringify(config),
        })
        .then(() => {
          console.log('更新城市生长配置成功')
        })
        .catch(() => {
          console.log('更新城市生长配置失败')
        })
    },

    onClose() {
      this.hideCityGrow()
      if (this.cityGrow) {
        this.cityGrow.unmount()
      }

      this.cityGrowOptions = {}
      this.$refs.cityGrowOptions.unmount()
      this.selectResult = ''
    },

    hideCityGrow() {
      this.startCityGrow = false
    },
  },
}
</script>

<style lang="scss" scoped>
.mp-widget-city-grow {
  // margin: 0px 5px 5px 5px;
}

.mp-row-style {
  // width: 360px;
  margin-bottom: 8px;
}

.mp-widget-label {
  width: 41px;
  height: 12px;
  font-size: 14px;
  font-family: Microsoft YaHei;
  font-weight: bold;
  //color: #333333;
  line-height: 36px;
}

.url-example {
  padding: 3px 0;
  word-break: break-all;
  white-space: break-spaces;
  font-size: 12px;

  &.mapgis-ui-input {
    border: none;
    color: $text-color-secondary;
    // background-color: transparent;
    resize: none;
    min-height: 24px;
  }
}
</style>
