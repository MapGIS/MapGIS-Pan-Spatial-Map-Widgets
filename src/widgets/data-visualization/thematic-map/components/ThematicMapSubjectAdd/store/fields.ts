import {
  LayerServiceType,
  FeatureFormatType,
  featureQueryFn,
} from '../../../store'

interface QueryParams {
  ip: string
  port: string
  gdbp: string
  docName: string
  layerName: string
  layerIndex: string
  fields?: string
  layerServiceType?: string
  src?: string
}

interface FieldInfosItem {
  type: string
  alias: string
  value: string
}

const mockData = {
  type: 'FeatureCollection',
  dataCount: 2,
  features: [
    {
      type: 'Feature',
      properties: {
        fid: 1,
        AREA: 0,
      },
    },
    {
      type: 'Feature',
      properties: {
        fid: 2,
        AREA: 1,
      },
    },
  ],
}

class Fields {
  private isFetched = false

  private src = ''

  private fields: FieldInfosItem[] = []

  /**
   * 获取指定属性的GeoJSON数据
   * @param {object} params 查询参数
   * @returns GeoJSON | undefined
   */
  async getFieldGeoJson({
    ip,
    port,
    gdbp,
    docName,
    layerName,
    layerIndex,
    layerServiceType,
    src,
    fields,
  }: QueryParams) {
    if (!fields) return
    if (layerServiceType === LayerServiceType.igsScene) {
      // TODO 由于m3d暂未对接简单要素类，这里暂时返回一个默认的json，以便展示分段，方便进行分段设置
      return mockData
    } else {
      const geojson = await featureQueryFn({
        ip,
        port,
        gdbp,
        docName,
        layerName,
        layerIndex,
        layerServiceType,
        src,
        fields,
      })
      return geojson
    }
  }

  /**
   * 获取属性列表数据
   * @param {object} param0 查询参数
   * @returns
   */
  async getFields(subjectConfig) {
    const src = subjectConfig.src || subjectConfig.serverUrl
    if (!this.isFetched || this.src !== src) {
      this.fields = await this.fetchFields({
        src,
        ...subjectConfig,
      })
      this.isFetched = true
      this.src = src || ''
    }
    return this.fields
  }

  /**
   * 请求属性列表数据
   * @param {object} param0 查询参数
   * @returns
   */
  async fetchFields({
    ip,
    port,
    gdbp,
    docName,
    layerName,
    layerIndex,
    src,
    layerServiceType,
  }: QueryParams) {
    const json = await featureQueryFn(
      {
        ip,
        port,
        gdbp,
        docName,
        layerName,
        layerIndex,
        layerServiceType,
        src,
        IncludeAttribute: false,
        IncludeGeometry: false,
        IncludeWebGraphic: false,
      },
      FeatureFormatType.json
    )
    if (json) {
      if (
        layerServiceType === LayerServiceType.igsImage ||
        layerServiceType === LayerServiceType.igsVector
      ) {
        const { FldName, FldType, FldAlias } = json.AttStruct
        return FldName.map((v: string, i: number) => ({
          type: FldType[i],
          alias: FldAlias[i] || v,
          value: v,
        }))
      } else if (layerServiceType === LayerServiceType.geojson) {
        const { properties } = json.features[0]
        return Object.keys(properties).map((v: string, i: number) => ({
          alias: v,
          value: v,
        }))
      }
    }
    return []
  }

  /**
   * 清除缓存
   */
  clearFields() {
    this.isFetched = false
    this.fields = []
  }
}

export default new Fields()
