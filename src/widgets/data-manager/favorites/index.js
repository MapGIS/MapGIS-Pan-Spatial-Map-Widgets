export const defaultSceneSetting = {
  'basicSetting': {
    'earth': true,
    'skyAtmosphere': false,
    'shadow': false,
    'depthTest': true,
    'FPS': false,
    'timeline': false,
    'compass': false,
    'zoom': false,
    'statebar': true,
    'sceneMode': false,
    'layerbrightness': 1.2,
    'layercontrast': 1,
    'layerhue': 0,
    'layersaturation': 1,
    'compassPosition': {
      'anchor': 'top-left',
      'horizontalOffset': 328,
      'verticalOffset': 400,
    },
  },
  'cameraSetting': {
    'selfAdaption': false,
    'undgrdParams': {
      'groundAlpha': 1,
      'maxHeigh': 400000,
      'enableIndependentTranslucency': true,
    },
    'fov': 60,
    'selfAdaptionParams': {
      'maxHeigh': 400000,
    },
    'undgrd': true,
  },
  'lightSetting': {
    'sunlight': false,
    'sunlightParams': {
      'lightingMode': 'DAYNIGHT_SHADING',
      'lightColor': 'rgba(255,255,255,255)',
    },
    'lightIntensity': 10,
  },
  'weatherSetting': {
    'sun': false,
    'moon': false,
    'sceneSkybox': true,
    'skybox': false,
    'clouds': false,
    'cloudsParams': {
      'cloudsduration': 5,
    },
    'rain': false,
    'rainParams': {
      'speed': 18,
      'rainOpacity': 0.6,
      'angle': -30,
      'length': 1,
    },
    'snow': false,
    'snowParams': {
      'size': 5,
      'density': 5,
    },
    'fog': false,
    'fogParams': {
      'fogOpacity': 0.5,
      'color': '#FFFFFF',
    },
    'surficialFog': false,
    'surfFogParams': {
      'surfFogDst': 0.0002,
    },
  },
  'effectSetting': {
    'blckWhite': false,
    'ntVision': false,
    'bloom': false,
    'bloomParams': {
      'bloomBrt': -0.3,
      'bloomCtrst': 128,
    },
  },
}
