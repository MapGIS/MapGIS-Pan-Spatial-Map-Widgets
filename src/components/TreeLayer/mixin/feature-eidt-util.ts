import axios from 'axios'
import { Statistics } from '@mapgis/web-app-framework'

export default {
  inject: ['getApplication'],
  data() {
    return {}
  },
  methods: {
    // 获取要素中的属性字段
    getFeatureField(sublayer) {
      return new Promise((resolve) => {
        // 通过url判断是gdbp还是geojson数据地址
        const gdbpUrl = this.isGdbpType(sublayer.url)
        if (gdbpUrl) {
          const { layer } = sublayer
          const origin = this.getOrigin(layer)
          const requestUrl = `${origin}/igs/rest/mrfs/layer/query?gdbp=${sublayer.url}`
          axios.get(requestUrl).then((res) => {
            const {
              data: { AttStruct },
            } = res
            resolve(this.transformAttStruct(AttStruct))
          })
        } else {
          // geojson数据直接从layer.source中获取
          //   axios.get(sublayer.url).then((res) => {
          //     const {
          //       data: { features },
          //     } = res
          //     this.featureSet = features
          //     resolve(this.transformFeaturesField(features))
          //   })
          const {
            source: { features },
          } = sublayer
          resolve(this.transformFeaturesField(features))
        }
      })
    },
    transformAttStruct(attStruct) {
      const { FldName = [], FldType = [], FldAlias = [] } = attStruct
      const data = []
      FldName.forEach((item, index) => {
        const info = {
          name: FldAlias[index] ? FldAlias[index] : item,
          type: FldType[index],
        }
        data.push(info)
      })
      return data
    },
    transformFeaturesField(features) {
      // 默认取第一个feature获取properties属性
      const { properties } = features[0]
      const data = []
      Object.keys(properties).forEach((item) => {
        const info = {
          name: item,
          type: typeof properties[item],
        }
        data.push(info)
      })
      return data
    },
    // 获取统计信息
    async getStatisticsResult(
      sublayer,
      groupType = 'single',
      statisticsField,
      groupField,
      statisticsType,
      rangeNum = 5
    ) {
      const { layer } = sublayer
      const origin = this.getOrigin(layer)
      const queryParams = {
        domain: origin,
        gdbp: sublayer.url,
        serverType: layer.type,
      }
      const result = await Statistics.getStatisticsResult(
        queryParams,
        groupType,
        statisticsField,
        groupField,
        statisticsType,
        rangeNum
      )
      const { data } = result
      return data
    },
    getOrigin(layer) {
      let origin
      try {
        const urlInfo = new URL(layer.url)
        origin = urlInfo.origin
      } catch (error) {
        const ip = this.getApplication()?.baseConfig?.ip
        const port = this.getApplication()?.baseConfig?.port
        origin = `${window.location.protocol}//${ip}:${port}`
      }
      return origin
    },
    transformStatisticsData(type, data) {
      let result = []
      switch (type) {
        case 'uniqueValue':
          data.forEach((sub) => {
            result = [...Object.keys(sub)]
          })
          break
        case 'classBreakMin':
          const minData = []
          data.forEach((sub) => {
            Object.keys(sub).forEach((item) => {
              minData.push(Number(sub[item]))
            })
          })
          result.push(Math.min(...minData))
          break
        case 'classBreakMax':
          const maxData = []
          data.forEach((sub) => {
            Object.keys(sub).forEach((item) => {
              maxData.push(Number(sub[item]))
            })
          })
          result.push(Math.max(...maxData))
          break
        default:
          break
      }
      return result
    },
    isGdbpType(url) {
      let flag
      try {
        // eslint-disable-next-line no-new
        const urlInfo = new URL(url)
        if (urlInfo.protocol === 'gdbp:') {
          flag = false
        } else {
          flag = true
        }
      } catch (error) {
        flag = false
      }
      return !flag
    },
    filterFeatureSet(type, targetValue, featureSet) {
      let result
      switch (type) {
        case 'uniqueValue':
          result = this.filterFeatureSetByField(targetValue, featureSet)
          break
        case 'classBreak':
          result = this.filterFeatureSetByMinAndMax(targetValue, featureSet)
          break
        default:
          break
      }
      return result
    },
    filterFeatureSetByField(targetValue, featureSet) {
      if (!featureSet) {
        return []
      }
      const result = []
      featureSet.forEach((feature) => {
        const { properties } = feature
        if (!result.includes(properties[targetValue])) {
          result.push(properties[targetValue])
        }
      })
      return result
    },
    filterFeatureSetByMinAndMax(targetValue, featureSet) {
      if (!featureSet) {
        return []
      }
      const result = []
      featureSet.forEach((feature) => {
        const { properties } = feature
        result.push(properties[targetValue])
      })
      return [Math.min(...result), Math.max(...result)]
    },
  },
}
