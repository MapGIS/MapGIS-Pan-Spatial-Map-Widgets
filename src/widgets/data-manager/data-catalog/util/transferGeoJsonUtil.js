import {
  baseConfigInstance,
  Feature,
  LayerType,
} from '@mapgis/web-app-framework'
import { Style } from '@mapgis/webclient-es6-service'

const { GFeature, FeatureQuery, ArcGISFeatureQuery, FeatureConvert } = Feature
const { LineStyle, PointStyle, FillStyle } = Style

async function getGeoJson(layer) {
  const isDataStoreQuery = false
  const DNSName = undefined
  const ipPortObj = getIpPort({ isDataStoreQuery })
  const option = {
    id: layer.id,
    name: layer.name,
    isDataStoreQuery,
    DNSName,
    domain: layer.domain,
    ...ipPortObj,
    serverType: layer.serverType,
    layerIndex: layer.id,
    gdbp: layer.url,
    serverName: layer.docName,
    serverUrl: layer.parentUrl,
    f: '',
    layerIndex: layer.layerIndex,
  }
  const {
    ip,
    port,
    serverName,
    serverType,
    serverUrl,
    layerIndex,
    gdbp,
    f,
    domain,
  } = option

  const queryWhere = undefined
  const queryGeometry = undefined
  const { AttStruct, TotalCount } = await queryCount(
    queryGeometry,
    queryWhere,
    option
  )

  let geojson
  geojson = await FeatureQuery.query({
    ip,
    port: port.toString(),
    domain,
    f: f || 'geojson',
    where: queryWhere,
    isDataStoreQuery,
    page: 0,
    pageCount: TotalCount,
    gdbp,
    DNSName,
    docName: serverName,
    layerIdxs: layerIndex,
    coordPrecision: 8,
    requestType: 'POST',
  })

  return geojson
}

function getIpPort({ isDataStoreQuery }) {
  const ipPortObj = isDataStoreQuery
    ? {
        ip: baseConfigInstance.config.DataStoreIp,
        port: Number(baseConfigInstance.config.DataStorePort),
      }
    : {
        ip: baseConfigInstance.config.ip,
        port: Number(baseConfigInstance.config.port),
      }

  return ipPortObj
}

async function queryCount(geometry, where, option) {
  const { ip, port, isDataStoreQuery, serverName, serverUrl } = option
  const { domain } = option
  const { layerIndex, gdbp } = option
  const featureSet = await FeatureQuery.query({
    ip,
    port: port.toString(),
    domain,
    f: 'json',
    IncludeAttribute: false,
    IncludeGeometry: false,
    IncludeWebGraphic: false,
    isDataStoreQuery,
    geometry,
    where,
    gdbp,
    docName: serverName,
    layerIdxs: layerIndex,
    requestType: 'POST',
  })
  return featureSet
}

function getFeatureStyle(type, config) {
  let featureStyle
  switch (type) {
    case 'Reg':
      const polygon = new FillStyle()
      polygon.color = config.reg.color
      polygon.outlineColor = config.line.color
      polygon.lineWidth = +config.line.size
      featureStyle = polygon
      break
    case 'Lin':
      const line = new LineStyle()
      line.color = config.line.color
      line.width = +config.line.size
      featureStyle = line
      break
    case 'Pnt':
      const point = new PointStyle()
      point.color = config.pnt.color
      point.radius = +config.pnt.size
      point.outlineColor = config.line.color
      point.lineWidth = +config.line.size
      featureStyle = point
      break
    default:
      break
  }
  return featureStyle
}

function transferLayerConfigNode(node, parent) {
  const { domain, docName } = parent._parseUrl(parent.url)
  return {
    dataId: `${parent.id}-${node.id}`,
    id: node.id,
    layerIndex: node.id,
    guid: `${parent.id}-${node.id}`,
    serverType: LayerType.GeoJson,
    geomType: node.geomType,
    description: node.title + '-临时图层',
    parentUrl: parent.url,
    name: node.title + '-临时图层',
    extend: parent.extend,
    opacity: parent.opacity,
    url: node.url,
    domain,
    docName,
    featureStyle: getFeatureStyle(
      node.geomType,
      parent.extend?.featureStyle ||
        baseConfigInstance.config.colorConfig.feature
    ),
  }
}

export default { getGeoJson, getFeatureStyle, transferLayerConfigNode }
