import MapgisUi from '@mapgis/webclient-vue-ui'
import VueMapbox from '@mapgis/webclient-vue-mapboxgl'
import VueCesium from '@mapgis/webclient-vue-cesium'

export {
  api,
  getRequest,
  ProjectionTransformationUtil,
  events,
  eventBus,
  baseConfigInstance,
  loadConfigs,
  markerIconInstance,
  dataCatalogManagerInstance,
  DataCatalogManager,
  DataFlowList,
  ActiveResultSet,
  DataStoreCatalog,
  ProjectorManager,
} from './model'

import {
  MpBufferAnalysis,
  MpDynamicSectionAnalysis,
  MpHeightLimitedAnalysis,
  MpModelFlatten,
  MpNetworkAnalysis,
  MpOverlayAnalysis,
  MpProfileAnalysis,
  MpRetrospect,
  MpSceneRoaming,
  MpShadowAnalysis,
  MpSkylineAnalysis,
  MpSwipe,
  MpTerrainAnalysis,
  MpTopologyAnalysis,
  MpVisibilityAnalysis,
} from './widgets/analysis'

import {
  MpAddData,
  MpBasemapManager,
  MpDataCatalog,
} from './widgets/data-manager'

import {
  MpBookmark,
  MpLayerList,
  MpLayerListContainer,
  MpLegend,
  MpMapModePicker,
  MpMapStory,
  MpParticleEffects,
  MpProjectorManager,
  MpRotate,
  MpScalebar,
  MpSceneSetting,
  MpThematicMap,
  MpVectorTileCarto,
  MpViewpointManager,
  MpZoom,
} from './widgets/data-visualization'

import { MpMarkerManager, MpOverlayManager } from './widgets/editing'

import {
  MpAbindCard,
  MpAbout,
  MpFuncWarehouse,
  MpKibanaV,
  MpMapDataV,
} from './widgets/extended'

import { MpComprehensiveQuery, MpFeatureQuery } from './widgets/query'

import {
  MpBuildingGrow,
  MpCityGrow,
  MpPondingSimulation,
} from './widgets/simulation'

import {
  MpBimComponent,
  MpMeasurement,
  MpOutputImage,
  MpSplitScreen,
  MpStratifiedHousehold,
} from './widgets/tool'

// import RightPopover from './components/TreeLayer/components/RightPopover/index.vue'

const components = [
  // RightPopover,
  // analysis
  MpBufferAnalysis,
  MpDynamicSectionAnalysis,
  MpHeightLimitedAnalysis,
  MpModelFlatten,
  MpNetworkAnalysis,
  MpOverlayAnalysis,
  MpProfileAnalysis,
  MpRetrospect,
  MpSceneRoaming,
  MpShadowAnalysis,
  MpSkylineAnalysis,
  MpSwipe,
  MpTerrainAnalysis,
  MpTopologyAnalysis,
  MpVisibilityAnalysis,
  // data-manager
  MpAddData,
  MpBasemapManager,
  MpDataCatalog,
  // data-visualization
  MpBookmark,
  MpLayerList,
  MpLayerListContainer,
  MpLegend,
  MpMapModePicker,
  MpMapStory,
  MpParticleEffects,
  MpProjectorManager,
  MpRotate,
  MpScalebar,
  MpSceneSetting,
  MpThematicMap,
  MpVectorTileCarto,
  MpViewpointManager,
  MpZoom,
  // editing
  MpMarkerManager,
  MpOverlayManager,
  // extended
  MpAbindCard,
  MpAbout,
  MpFuncWarehouse,
  MpKibanaV,
  MpMapDataV,
  // query
  MpComprehensiveQuery,
  MpFeatureQuery,
  // simulation
  MpBuildingGrow,
  MpCityGrow,
  MpPondingSimulation,
  // tool
  MpBimComponent,
  MpMeasurement,
  MpOutputImage,
  MpSplitScreen,
  MpStratifiedHousehold,
]

const install = (Vue) => {
  components.forEach((component) => {
    Vue.component(
      (component.options && component.options.name) || component.name,
      component
    )
  })
  Vue.use(VueMapbox)
  Vue.use(VueCesium)
  Vue.use(MapgisUi)
}

export default {
  install,
}
