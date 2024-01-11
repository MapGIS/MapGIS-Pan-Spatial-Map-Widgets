import {
  MpAttributeTableList,
} from './components'

import {
  MpBufferAnalysis,
  MpNetworkAnalysis,
  MpOverlayAnalysis,
  MpProfileAnalysis,
  MpSceneRoaming,
  MpShadowAnalysis,
  MpSkylineAnalysis,
  MpSwipe,
  MpTerrainAnalysis,
  MpTopologyAnalysis,
  MpVisibilityAnalysis,
  MpVisualAnalysis,
} from './widgets/analysis'

import {
  MpAddData,
  MpBasemapManager,
  MpDataCatalog,
  MpTopographyManager,
  MpFavorites,
} from './widgets/data-manager'

import {
  MpBookmark,
  MpLayerList,
  MpLayerListContainer,
  MpLegend,
  MpMapModePicker,
  MpParticleEffects,
  MpProjectorManager,
  MpRotate,
  MpScalebar,
  MpSceneSetting,
  MpViewpointManager,
  MpZoom,
  MpSceneModePicker,
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
  MpMeasurement,
  MpOutputImage,
  MpSplitScreen,
  MpModelPick,
  MpOpacityFactor,
} from './widgets/tool'

const components = [
  MpAttributeTableList,
  // analysis
  MpBufferAnalysis,
  MpNetworkAnalysis,
  MpOverlayAnalysis,
  MpProfileAnalysis,
  MpSceneRoaming,
  MpShadowAnalysis,
  MpSkylineAnalysis,
  MpSwipe,
  MpTerrainAnalysis,
  MpTopologyAnalysis,
  MpVisibilityAnalysis,
  MpVisualAnalysis,
  // data-manager
  MpAddData,
  MpBasemapManager,
  MpDataCatalog,
  MpTopographyManager,
  // data-visualization
  MpBookmark,
  MpLayerList,
  MpLayerListContainer,
  MpLegend,
  MpMapModePicker,
  MpParticleEffects,
  MpProjectorManager,
  MpRotate,
  MpScalebar,
  MpSceneSetting,
  MpViewpointManager,
  MpZoom,
  MpSceneModePicker,
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
  // tool
  MpMeasurement,
  MpOutputImage,
  MpSplitScreen,
  MpModelPick,
  MpOpacityFactor,
  MpFavorites,
]

const install = (Vue) => {
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
