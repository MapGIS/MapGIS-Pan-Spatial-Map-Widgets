import { v4 as uuidv4 } from 'uuid'

const domain = window.location.origin
const isDefaultAppProductName = window._CONFIG.productName === 'psmap'
const filePathPrefix = isDefaultAppProductName
  ? domain
  : `${domain}/${window._CONFIG.productName}`
// const domain = 'http://localhost:8015'

export const defaultDataIconsConfig = {
  serviceIcons: [
    {
      id: `folder_${uuidv4()}`,
      label: 'MapGIS',
      type: 'folder',
      children: [
        {
          id: uuidv4(),
          label: '地图服务',
          serviceType: 'IGSMapImage',
          icon: `${filePathPrefix}/file/default/dataIcons/MapGIS矢量地图服务.png`,
        },
        {
          id: uuidv4(),
          label: '栅格瓦片服务',
          serviceType: 'IGSTile',
          icon: `${filePathPrefix}/file/default/dataIcons/MapGIS瓦片地图服务.png`,
        },
        {
          id: uuidv4(),
          label: '图层地图服务',
          serviceType: 'IGSVector',
          icon: `${filePathPrefix}/file/default/dataIcons/MapGIS图层地图服务.png`,
        },
        {
          id: uuidv4(),
          label: '矢量瓦片服务',
          serviceType: 'VectorTile',
          icon: `${filePathPrefix}/file/default/dataIcons/MapGIS矢量瓦片服务.png`,
        },
        {
          id: uuidv4(),
          label: 'IGSPanoramic 服务',
          serviceType: 'IGSPanoramic',
          icon: `${filePathPrefix}/file/default/dataIcons/IGSPanoramic服务.png`,
        },
        {
          id: uuidv4(),
          label: '数据流服务',
          serviceType: 'DataFlow',
          icon: `${filePathPrefix}/file/default/dataIcons/MapGIS数据流服务.png`,
        },
        {
          id: uuidv4(),
          label: '场景服务',
          serviceType: 'IGSScene',
          icon: `${filePathPrefix}/file/default/dataIcons/MapGIS场景服务.png`,
        },
        {
          id: uuidv4(),
          label: 'M3D服务',
          serviceType: 'ModelCache',
          icon: `${filePathPrefix}/file/default/dataIcons/M3D.png`,
        },
      ],
    },
    {
      id: `folder_${uuidv4()}`,
      label: 'ArcGIS',
      type: 'folder',
      children: [
        {
          id: uuidv4(),
          label: 'ArcGIS地图服务',
          serviceType: 'ArcGISMapImage',
          icon: `${filePathPrefix}/file/default/dataIcons/ArcGIS地图服务.png`,
        },
        {
          id: uuidv4(),
          label: 'ArcGIS瓦片服务',
          serviceType: 'ArcGISTile',
          icon: `${filePathPrefix}/file/default/dataIcons/ArcGIS瓦片服务.png`,
        },
      ],
    },
    {
      id: `folder_${uuidv4()}`,
      label: 'OGC',
      type: 'folder',
      children: [
        {
          id: uuidv4(),
          label: 'WMS服务',
          serviceType: 'OGCWMS',
          icon: `${filePathPrefix}/file/default/dataIcons/OGC WMS服务.png`,
        },
        {
          id: uuidv4(),
          label: 'WMTS服务',
          serviceType: 'OGCWMTS',
          icon: `${filePathPrefix}/file/default/dataIcons/OGC WMTS服务.png`,
        },
        {
          id: uuidv4(),
          label: 'WFS服务',
          serviceType: 'OGCWFS',
          icon: `${filePathPrefix}/file/default/dataIcons/OGC WFS服务.png`,
        },
      ],
    },
    {
      id: `folder_${uuidv4()}`,
      label: '未分组',
      type: 'other',
      children: [
        {
          id: uuidv4(),
          label: 'GEOJSON',
          serviceType: 'GeoJson',
          icon: `${filePathPrefix}/file/default/dataIcons/GEOJSON.png`,
        },
        {
          id: uuidv4(),
          label: '3DTiles',
          serviceType: 'TILE3D',
          icon: `${filePathPrefix}/file/default/dataIcons/3DTiles.png`,
        },
        {
          id: uuidv4(),
          label: 'STK地形',
          serviceType: 'STKTerrain',
          icon: `${filePathPrefix}/file/default/dataIcons/STK地形.png`,
        },
        {
          id: uuidv4(),
          label: '标绘图层',
          serviceType: 'Plot',
          icon: `${filePathPrefix}/file/default/dataIcons/标绘图层.png`,
        },
        {
          id: uuidv4(),
          label: 'KML',
          serviceType: 'KML',
          icon: `${filePathPrefix}/file/default/dataIcons/KML.png`,
        },
        {
          id: uuidv4(),
          label: 'KMZ',
          serviceType: 'KMZ',
          icon: `${filePathPrefix}/file/default/dataIcons/KMZ.png`,
        },
        {
          id: uuidv4(),
          label: 'CZML',
          serviceType: 'CZML',
          icon: `${filePathPrefix}/file/default/dataIcons/CZML.png`,
        },
        {
          id: uuidv4(),
          label: 'OSM',
          serviceType: 'OSM',
          icon: `${filePathPrefix}/file/default/dataIcons/OSM.png`,
        },
      ],
    },
  ],
  layerIcons: [
    {
      id: `folder_${uuidv4()}`,
      label: '未分组',
      type: 'folder',
      children: [
        {
          id: uuidv4(),
          label: '组图层',
          layerType: 'Group',
          icon: `${filePathPrefix}/file/default/dataIcons/组图层.png`,
        },
        {
          id: uuidv4(),
          label: '点图层',
          layerType: 'Pnt',
          icon: `${filePathPrefix}/file/default/dataIcons/点图层.png`,
        },
        {
          id: uuidv4(),
          label: '线图层',
          layerType: 'Lin',
          icon: `${filePathPrefix}/file/default/dataIcons/线图层.png`,
        },
        {
          id: uuidv4(),
          label: '区图层',
          layerType: 'Reg',
          icon: `${filePathPrefix}/file/default/dataIcons/区图层.png`,
        },
        {
          id: uuidv4(),
          label: '面图层',
          layerType: 'Surface',
          icon: `${filePathPrefix}/file/default/dataIcons/面图层.png`,
        },
        {
          id: uuidv4(),
          label: '体图层',
          layerType: 'Entity',
          icon: `${filePathPrefix}/file/default/dataIcons/体图层.png`,
        },
        {
          id: uuidv4(),
          label: '注记图层',
          layerType: 'Ann',
          icon: `${filePathPrefix}/file/default/dataIcons/注记图层.png`,
        },
        {
          id: uuidv4(),
          label: '网络类图层',
          layerType: 'Net',
          icon: `${filePathPrefix}/file/default/dataIcons/网络类图层.png`,
        },
        {
          id: uuidv4(),
          label: '栅格图层',
          layerType: 'ShanGe',
          icon: `${filePathPrefix}/file/default/dataIcons/栅格图层.png`,
        },
      ],
    },
  ],
}
