import * as configService from './config'

import * as uploadService from './upload'

import * as mapSheetService from './map-sheet'

import * as plotService from './plot'

const apiTable = {
  getConfig: configService.getConfig,
  saveConfig: configService.saveConfig,
  getWidgetConfig: configService.getWidgetConfig,
  saveWidgetConfig: configService.saveWidgetConfig,
  imagesUpload: uploadService.imagesUpload,
  getFrameNoByCoord: mapSheetService.getFrameNoByCoord,
  getFrameExtentByNo: mapSheetService.getFrameExtentByNo,
  getFrameNoList: mapSheetService.getFrameNoList,
  getScriptList: plotService.getScriptList,
  getScriptById: plotService.getScriptById,
  saveScriptById: plotService.saveScriptById,
  removeScriptById: plotService.removeScriptById,
  getSymbolLibsById: plotService.getSymbolLibsById,
  setApiProxy,
}

function setApiProxy(apiProxyTable) {
  Object.keys(apiProxyTable).forEach((api) => {
    const proxy = apiProxyTable[api]
    apiTable[api] = proxy
  })
}

export default apiTable
