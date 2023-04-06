import {
  MpAttributeTable,
  MpAttributeTableList,
  MpTreeLayer,
} from './components'

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
  MpVisualAnalysis,
  MpExplosionAnalysis,
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
  MpPlotAnimation,
  MpPlotManager,
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
  MpModelPick,
} from './widgets/tool'

const components = [
  MpAttributeTable,
  MpAttributeTableList,
  MpTreeLayer,
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
  MpVisualAnalysis,
  MpExplosionAnalysis,
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
  MpPlotAnimation,
  MpPlotManager,
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
  MpModelPick,
]

import { thematicMapStore } from './widgets/data-visualization/thematic-map/store'

const install = (Vue) => {
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
