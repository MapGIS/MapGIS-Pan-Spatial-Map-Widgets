import { v4 as uuidv4 } from 'uuid'

const domain = window.location.origin
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
          label: 'MapGIS 矢量地图服务',
          serviceType: 'IGSMapImage',
          icon: `${domain}/file/data/dataIcons/MapGIS矢量地图服务.png`,
        },
        {
          id: uuidv4(),
          label: 'MapGIS 瓦片地图服务',
          serviceType: 'IGSTile',
          icon: `${domain}/file/data/dataIcons/MapGIS瓦片地图服务.png`,
        },
        {
          id: uuidv4(),
          label: 'MapGIS 图层地图服务',
          serviceType: 'IGSVector',
          icon: `${domain}/file/data/dataIcons/MapGIS图层地图服务.png`,
        },
        {
          id: uuidv4(),
          label: 'MapGIS 矢量瓦片服务',
          serviceType: 'VectorTile',
          icon: `${domain}/file/data/dataIcons/MapGIS矢量瓦片服务.png`,
        },
        {
          id: uuidv4(),
          label: 'IGSPanoramic 服务',
          serviceType: 'IGSPanoramic',
          icon: `${domain}/file/data/dataIcons/IGSPanoramic服务.png`,
        },
        {
          id: uuidv4(),
          label: 'MapGIS 数据流服务',
          serviceType: 'DataFlow',
          icon: `${domain}/file/data/dataIcons/MapGIS数据流服务.png`,
        },
        {
          id: uuidv4(),
          label: 'MapGIS 场景服务',
          serviceType: 'IGSScene',
          icon: `${domain}/file/data/dataIcons/MapGIS场景服务.png`,
        },
        {
          id: uuidv4(),
          label: 'MapGIS M3D模型缓存服务',
          serviceType: 'ModelCache',
          icon: `${domain}/file/data/dataIcons/M3D.png`,
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
          label: 'ArcGIS 地图服务',
          serviceType: 'ArcGISMapImage',
          icon: `${domain}/file/data/dataIcons/ArcGIS地图服务.png`,
        },
        {
          id: uuidv4(),
          label: 'ArcGIS 瓦片服务',
          serviceType: 'ArcGISTile',
          icon: `${domain}/file/data/dataIcons/ArcGIS瓦片服务.png`,
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
          label: 'OGC WMS服务',
          serviceType: 'OGCWMS',
          icon: `${domain}/file/data/dataIcons/OGC WMS服务.png`,
        },
        {
          id: uuidv4(),
          label: 'OGC WMTS',
          serviceType: 'OGCWMTS',
          icon: `${domain}/file/data/dataIcons/OGC WMTS服务.png`,
        },
        {
          id: uuidv4(),
          label: 'OGC WFS',
          serviceType: 'OGCWFS',
          icon: `${domain}/file/data/dataIcons/OGC WFS服务.png`,
        },
      ],
    },
    {
      id: `folder_${uuidv4()}`,
      label: '其他',
      type: 'other',
      children: [
        {
          id: uuidv4(),
          label: 'GEOJSON',
          serviceType: 'GeoJson',
          icon: `${domain}/file/data/dataIcons/GEOJSON.png`,
        },
        {
          id: uuidv4(),
          label: '3DTiles',
          serviceType: 'TILE3D',
          icon: `${domain}/file/data/dataIcons/3DTiles.png`,
        },
        {
          id: uuidv4(),
          label: 'STK地形',
          serviceType: 'STKTerrain',
          icon: `${domain}/file/data/dataIcons/STK地形.png`,
        },
        {
          id: uuidv4(),
          label: '标绘图层',
          serviceType: 'Plot',
          icon: `${domain}/file/data/dataIcons/标绘图层.png`,
        },
        {
          id: uuidv4(),
          label: 'KML',
          serviceType: 'KML',
          icon: `${domain}/file/data/dataIcons/KML.png`,
        },
        {
          id: uuidv4(),
          label: 'KMZ',
          serviceType: 'KMZ',
          icon: `${domain}/file/data/dataIcons/KMZ.png`,
        },
        {
          id: uuidv4(),
          label: 'CZML',
          serviceType: 'CZML',
          icon: `${domain}/file/data/dataIcons/CZML.png`,
        },
        {
          id: uuidv4(),
          label: 'OSM',
          serviceType: 'OSM',
          icon: `${domain}/file/data/dataIcons/OSM.png`,
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
          icon: `${domain}/file/data/dataIcons/组图层.png`,
        },
        {
          id: uuidv4(),
          label: '点图层',
          layerType: 'Pnt',
          icon: `${domain}/file/data/dataIcons/点图层.png`,
        },
        {
          id: uuidv4(),
          label: '线图层',
          layerType: 'Lin',
          icon: `${domain}/file/data/dataIcons/线图层.png`,
        },
        {
          id: uuidv4(),
          label: '区图层',
          layerType: 'Reg',
          icon: `${domain}/file/data/dataIcons/区图层.png`,
        },
        {
          id: uuidv4(),
          label: '面图层',
          layerType: 'Surface',
          icon: `${domain}/file/data/dataIcons/面图层.png`,
        },
        {
          id: uuidv4(),
          label: '体图层',
          layerType: 'Entity',
          icon: `${domain}/file/data/dataIcons/体图层.png`,
        },
        {
          id: uuidv4(),
          label: '注记图层',
          layerType: 'Ann',
          icon: `${domain}/file/data/dataIcons/注记图层.png`,
        },
        {
          id: uuidv4(),
          label: '网络类图层',
          layerType: 'Net',
          icon: `${domain}/file/data/dataIcons/网络类图层.png`,
        },
        {
          id: uuidv4(),
          label: '栅格图层',
          layerType: 'ShanGe',
          icon: `${domain}/file/data/dataIcons/栅格图层.png`,
        },
      ],
    },
  ],
}
