<template>
  <mapgis-ui-spin :spinning="loading">
    <div class="feature-list-container">
      <mapgis-ui-list item-layout="horizontal" :data-source="list" size="small">
        <mapgis-ui-list-item
          slot="renderItem"
          slot-scope="item"
          style="padding-left: 15px"
        >
          <mapgis-ui-radio
            @click="selectFeature(item)"
            :checked="selectItem && selectItem.FID === item.FID"
          >
            {{ item.FID }}
          </mapgis-ui-radio>
        </mapgis-ui-list-item>
      </mapgis-ui-list>
      <div v-if="list.length > 0" class="feature-list-pagination-container">
        <mapgis-ui-pagination
          size="small"
          showLessItems
          :total="totalCount"
          :current="page"
          @change="changePage"
        />
      </div>
    </div>
  </mapgis-ui-spin>
</template>

<script lang="ts">
import { LayerType, WidgetMixin, Feature } from '@mapgis/web-app-framework'

export default {
  name: 'FeatureList',
  props: {
    params: {},
    active: { type: Boolean },
    type: { type: String },
  },
  data() {
    return {
      loading: false,
      list: [],
      selectItem: null,
      totalCount: 0,
      page: 1,
    }
  },

  watch: {
    active: {
      deep: true,
      immediate: true,
      handler: 'activeChange',
    },
    params: {
      deep: true,
      immediate: true,
      handler: 'paramsChange',
    },
  },

  methods: {
    activeChange() {
      if (!this.active) {
        this.selectFeature(null)
      }
    },

    paramsChange() {
      this.totalCount = 0
      this.page = 1
      this.query()
    },

    changePage(page) {
      this.page = page
      this.query()
    },

    async query() {
      this.list = []
      if (!this.params) {
        return
      }
      this.loading = true
      try {
        const {
          id,
          name,
          ip,
          port,
          serverType,
          layerIndex,
          serverName,
          serverUrl,
          geometry,
          gdbp,
        } = this.params
        let { domain } = this.params
        if (!domain && !!serverUrl && serverUrl.length > 0) {
          const url = new URL(serverUrl)
          domain = url.origin
        }
        if (serverType === LayerType.IGSMapImage) {
          const options = {
            f: 'json',
            ip,
            port,
            domain,
            geometry,
            page: this.page - 1,
            pageCount: 10,
            docName: serverName,
            layerIdxs: layerIndex,
            coordPrecision: 8,
          }
          const res = await Feature.FeatureQuery.query(options, false)
          console.log(res)
          this.dealWithResult(res)
        } else if (serverType === LayerType.IGSVector) {
          const options = {
            f: 'json',
            ip,
            port,
            domain,
            geometry,
            page: this.page - 1,
            pageCount: 10,
            gdbp,
            coordPrecision: 8,
          }
          const res = await Feature.FeatureQuery.query(options, false)
          this.dealWithResult(res)
        } else if (
          serverType === LayerType.IGSScene ||
          serverType === LayerType.ModelCache
        ) {
          const option = {
            f: 'json',
            ip,
            port,
            domain,
            url: gdbp,
            geometry,
            returnCountOnly: true,
          }
          const res1 =
            await Feature.FeatureQuery.igsQuery3DFeatureResourceServer(option)
          const options = {
            f: 'json',
            ip,
            port,
            domain,
            resultOffset: (this.page - 1) * 10,
            resultRecordCount: 10,
            url: gdbp,
            coordPrecision: 8,
            rtnLabel: false,
            geometry,
          }
          const res =
            await Feature.FeatureQuery.igsQuery3DFeatureResourceServer(options)
          const data = {}
          data.TotalCount = res1.count
          data.SFEleArray = res.features.map((feature) => {
            feature.FID = feature.attributes.FID
            feature.ftype = res.geometryType
            return feature
          })
          this.dealWithResult(data)
        }
      } catch (error) {
      } finally {
        this.loading = false
      }
    },

    dealWithResult(res) {
      if (res) {
        let results
        if (Array.isArray(res)) {
          results = res
        } else {
          results = [res]
        }
        const { SFEleArray, TotalCount } = results[0]

        this.list = SFEleArray || []
        this.totalCount = TotalCount || 0
      }
    },

    selectFeature(val) {
      this.selectItem = val
      if (val) {
        let FeatureCollection
        let dots
        const dotsArr = []
        switch (val.ftype) {
          case 1:
            dots = val.fGeom.PntGeom[0].Dot
            // eslint-disable-next-line no-case-declarations
            const lngLat = [dots.x, dots.y]
            // dotsArr.push([dots.x, dots.y])
            FeatureCollection = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {
                    center: lngLat,
                    fGeom: val.fGeom,
                    ftype: val.ftype,
                  },
                  geometry: {
                    type: 'Point',
                    coordinates: lngLat,
                  },
                },
              ],
            }
            break
          case 2:
            dots = val.fGeom.LinGeom[0].Line.Arcs[0].Dots
            for (let i = 0; i < dots.length; i++) {
              dotsArr.push([dots[i].x, dots[i].y])
            }
            FeatureCollection = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {
                    bound: [
                      [val.bound.xmin, val.bound.ymin],
                      [val.bound.xmax, val.bound.ymax],
                    ],
                    fGeom: val.fGeom,
                    ftype: val.ftype,
                  },
                  geometry: {
                    type: 'LineString',
                    coordinates: dotsArr,
                  },
                },
              ],
            }
            break
          case 3:
            dots = val.fGeom.RegGeom[0].Rings[0].Arcs[0].Dots
            for (let i = 0; i < dots.length; i++) {
              dotsArr.push([dots[i].x, dots[i].y])
            }
            FeatureCollection = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {
                    bound: [
                      [val.bound.xmin, val.bound.ymin],
                      [val.bound.xmax, val.bound.ymax],
                    ],
                    fGeom: val.fGeom,
                    ftype: val.ftype,
                  },
                  geometry: {
                    type: 'Polygon',
                    coordinates: [dotsArr],
                  },
                },
              ],
            }
            break
          case 'Entity':
            FeatureCollection = {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {
                    bound: [
                      [val.bound.xmin, val.bound.ymin],
                      [val.bound.xmax, val.bound.ymax],
                    ],
                    fGeom: val.fGeom,
                    ftype: val.ftype,
                    FID: val.FID,
                  },
                  geometry: {},
                },
              ],
            }
            break
          default:
            break
        }
        this.$emit('select-item', FeatureCollection)
      } else {
        this.$emit('select-item', null)
      }
    },
  },
}
</script>

<style lang="scss">
.feature-list-container {
  width: 230px;
  height: 180px;
  display: flex;
  flex-direction: column;
  .mapgis-ui-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  .feature-list-pagination-container {
    padding: 5px 10px;
    text-align: right;
    border-top: 1px solid $border-color;
    white-space: nowrap;
    overflow-x: auto;
  }
}
</style>
