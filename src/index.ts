import {
  MpAttributeTable,
  MpAttributeTableList,
  MpTreeLayer,
} from './components'

import {
  //   MpBufferAnalysis,
  //   MpDynamicSectionAnalysis,
  //   MpHeightLimitedAnalysis,
  //   MpModelFlatten,
  //   MpNetworkAnalysis,
  //   MpOverlayAnalysis,
  //   MpProfileAnalysis,
  //   MpRetrospect,
  //   MpSceneRoaming,
  //   MpShadowAnalysis,
  //   MpSkylineAnalysis,
  MpSwipe,
  //   MpTerrainAnalysis,
  //   MpTopologyAnalysis,
  //   MpVisibilityAnalysis,
} from './widgets/analysis'

import {
  // MpAddData,
  MpBasemapManager,
  MpDataCatalog,
} from './widgets/data-manager'

import {
  MpBookmark,
  MpLayerList,
  MpLayerListContainer,
  MpLegend,
  MpMapModePicker,
  // MpMapStory,
  // MpParticleEffects,
  // MpProjectorManager,
  // MpRotate,
  // MpScalebar,
  // MpSceneSetting,
  MpThematicMap,
  // MpVectorTileCarto,
  // MpViewpointManager,
  // MpZoom,
} from './widgets/data-visualization'

// import { MpMarkerManager, MpOverlayManager } from './widgets/editing'

// import {
//   MpAbindCard,
//   MpAbout,
//   MpFuncWarehouse,
//   MpKibanaV,
//   MpMapDataV,
// } from './widgets/extended'

import {
  MpComprehensiveQuery,
  //  MpFeatureQuery
} from './widgets/query'

// import {
//   MpBuildingGrow,
//   MpCityGrow,
//   MpPondingSimulation,
// } from './widgets/simulation'

import {
  //   MpBimComponent,
  MpMeasurement,
  //   MpOutputImage,
  MpSplitScreen,
  MpStratifiedHousehold,
} from './widgets/tool'

const components = [
  MpAttributeTable,
  MpAttributeTableList,
  MpTreeLayer,
  // analysis
  // MpBufferAnalysis,
  // MpDynamicSectionAnalysis,
  // MpHeightLimitedAnalysis,
  // MpModelFlatten,
  // MpNetworkAnalysis,
  // MpOverlayAnalysis,
  // MpProfileAnalysis,
  // MpRetrospect,
  // MpSceneRoaming,
  // MpShadowAnalysis,
  // MpSkylineAnalysis,
  MpSwipe,
  // MpTerrainAnalysis,
  // MpTopologyAnalysis,
  // MpVisibilityAnalysis,
  // data-manager
  // MpAddData,
  MpBasemapManager,
  MpDataCatalog,
  // data-visualization
  MpBookmark,
  MpLayerList,
  MpLayerListContainer,
  MpLegend,
  MpMapModePicker,
  // MpMapStory,
  // MpParticleEffects,
  // MpProjectorManager,
  // MpRotate,
  // MpScalebar,
  // MpSceneSetting,
  MpThematicMap,
  // MpVectorTileCarto,
  // MpViewpointManager,
  // MpZoom,
  // editing
  // MpMarkerManager,
  // MpOverlayManager,
  // extended
  // MpAbindCard,
  // MpAbout,
  // MpFuncWarehouse,
  // MpKibanaV,
  // MpMapDataV,
  // query
  MpComprehensiveQuery,
  // MpFeatureQuery,
  // simulation
  // MpBuildingGrow,
  // MpCityGrow,
  // MpPondingSimulation,
  // tool
  // MpBimComponent,
  MpMeasurement,
  // MpOutputImage,
  MpSplitScreen,
  MpStratifiedHousehold,
]

import { thematicMapStore } from './widgets/data-visualization/thematic-map/store'

const install = (Vue) => {
  // Vue.use(VueMapbox)
  // Vue.use(VueCesium)
  // Vue.use(MapgisUi)
  Vue.observable(thematicMapStore)
  components.forEach((component) => {
    Vue.component(
      (component.options && component.options.name) || component.name,
      component
    )
  })
}

export default {
  install,
}
