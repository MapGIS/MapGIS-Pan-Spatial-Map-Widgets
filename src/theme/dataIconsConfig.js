import { v4 as uuidv4 } from 'uuid'

// const filePathPrefix = `/${window._CONFIG.productName}`
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
          icon: `/file/default/dataIcons/IGSMapImage.png`,
        },
        {
          id: uuidv4(),
          label: '栅格瓦片服务',
          serviceType: 'IGSTile',
          icon: `/file/default/dataIcons/IGSTile.png`,
        },
        {
          id: uuidv4(),
          label: '图层地图服务',
          serviceType: 'IGSVector',
          icon: `/file/default/dataIcons/IGSVector.png`,
        },
        {
          id: uuidv4(),
          label: '矢量瓦片服务',
          serviceType: 'VectorTile',
          icon: `/file/default/dataIcons/VectorTile.png`,
        },
        {
          id: uuidv4(),
          label: 'IGSPanoramic 服务',
          serviceType: 'IGSPanoramic',
          icon: `/file/default/dataIcons/IGSPanoramic.png`,
        },
        {
          id: uuidv4(),
          label: '数据流服务',
          serviceType: 'DataFlow',
          icon: `/file/default/dataIcons/DataFlow.png`,
        },
        {
          id: uuidv4(),
          label: '场景服务',
          serviceType: 'IGSScene',
          icon: `/file/default/dataIcons/IGSScene.png`,
        },
        {
          id: uuidv4(),
          label: 'M3D服务',
          serviceType: 'ModelCache',
          icon: `/file/default/dataIcons/M3D.png`,
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
          icon: `/file/default/dataIcons/ArcGISMapImage.png`,
        },
        {
          id: uuidv4(),
          label: 'ArcGIS瓦片服务',
          serviceType: 'ArcGISTile',
          icon: `/file/default/dataIcons/ArcGISTile.png`,
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
          icon: `/file/default/dataIcons/OGCWMS.png`,
        },
        {
          id: uuidv4(),
          label: 'WMTS服务',
          serviceType: 'OGCWMTS',
          icon: `/file/default/dataIcons/OGCWMTS.png`,
        },
        {
          id: uuidv4(),
          label: 'WFS服务',
          serviceType: 'OGCWFS',
          icon: `/file/default/dataIcons/OGCWFS.png`,
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
          icon: `/file/default/dataIcons/GEOJSON.png`,
        },
        {
          id: uuidv4(),
          label: '3DTiles',
          serviceType: 'TILE3D',
          icon: `/file/default/dataIcons/3DTiles.png`,
        },
        {
          id: uuidv4(),
          label: 'STK地形',
          serviceType: 'STKTerrain',
          icon: `/file/default/dataIcons/STKTerrain.png`,
        },
        {
          id: uuidv4(),
          label: '标绘图层',
          serviceType: 'Plot',
          icon: `/file/default/dataIcons/Plot.png`,
        },
        {
          id: uuidv4(),
          label: 'KML',
          serviceType: 'KML',
          icon: `/file/default/dataIcons/KML.png`,
        },
        {
          id: uuidv4(),
          label: 'KMZ',
          serviceType: 'KMZ',
          icon: `/file/default/dataIcons/KMZ.png`,
        },
        {
          id: uuidv4(),
          label: 'CZML',
          serviceType: 'CZML',
          icon: `/file/default/dataIcons/CZML.png`,
        },
        {
          id: uuidv4(),
          label: '互联网瓦片服务',
          serviceType: 'WebTile',
          icon: `/file/default/dataIcons/OSM.png`,
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
          icon: `/file/default/dataIcons/Group.png`,
        },
        {
          id: uuidv4(),
          label: '点图层',
          layerType: 'Pnt',
          icon: `/file/default/dataIcons/Pnt.png`,
        },
        {
          id: uuidv4(),
          label: '线图层',
          layerType: 'Lin',
          icon: `/file/default/dataIcons/Lin.png`,
        },
        {
          id: uuidv4(),
          label: '区图层',
          layerType: 'Reg',
          icon: `/file/default/dataIcons/Reg.png`,
        },
        {
          id: uuidv4(),
          label: '面图层',
          layerType: 'Surface',
          icon: `/file/default/dataIcons/Surface.png`,
        },
        {
          id: uuidv4(),
          label: '体图层',
          layerType: 'Entity',
          icon: `/file/default/dataIcons/Entity.png`,
        },
        {
          id: uuidv4(),
          label: '注记图层',
          layerType: 'Ann',
          icon: `/file/default/dataIcons/Ann.png`,
        },
        {
          id: uuidv4(),
          label: '网络类图层',
          layerType: 'Net',
          icon: `/file/default/dataIcons/Net.png`,
        },
        {
          id: uuidv4(),
          label: '栅格图层',
          layerType: 'ShanGe',
          icon: `/file/default/dataIcons/ShanGe.png`,
        },
      ],
    },
  ],
}
