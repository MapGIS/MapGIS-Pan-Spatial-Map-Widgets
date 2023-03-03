import { getRequest } from '../utils/request'

// 获取态势推演脚本列表
export function getScriptList(ip, port, name) {
  return getRequest()({
    url: `http://${ip}:${port}/igs/rest/services/${name}/PlotServer/scripts?f=json`,
    method: 'get',
  })
}

// 获取态势推演脚本
export function getScriptById(ip, port, name, id) {
  return getRequest()({
    url: `http://${ip}:${port}/igs/rest/services/${name}/PlotServer/scripts/${id}?f=json`,
    method: 'get',
  })
}

// 保存/更新态势推演脚本
export function saveScriptById(ip, port, name, scriptParams) {
  if (scriptParams.scriptId) {
    console.log(scriptParams)
    // 更新
    return getRequest()({
      // url: `http://${ip}:${port}/igs/rest/services/${name}/PlotServer/scripts`,
      url: `http://${ip}:${port}/igs/rest/services/${name}/PlotServer/scripts?f=json&scriptId=${scriptParams.scriptId}&scriptName=${scriptParams.scriptName}&content=${scriptParams.content}`,
      method: 'post',
    })
  }
  // 保存
  return getRequest()({
    url: `http://${ip}:${port}/igs/rest/services/${name}/PlotServer/scripts?f=json&scriptName=${scriptParams.scriptName}&content=${scriptParams.content}`,
    method: 'post',
  })
}

// 删除态势推演脚本
export function removeScriptById(ip, port, name, id) {
  return getRequest()({
    url: `http://${ip}:${port}/igs/rest/services/${name}/PlotServer/scripts/${id}?f=json`,
    method: 'delete',
  })
}

// 获取符号库列表
export function getSymbolLibsById(ip, port, name, id) {
  return getRequest()({
    url: `http://${ip}:${port}/igs/rest/services/${name}/PlotServer/symbolLibs/${id}?f=json`,
    method: 'get',
  })
}
