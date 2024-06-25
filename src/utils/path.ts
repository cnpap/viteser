import fs from 'node:fs'

function getNodeModulesPath() {
  let basePath: any

  // 尝试使用 CommonJS 方法获取基路径
  if (typeof __dirname !== 'undefined') {
    basePath = __dirname
  }
  else {
    // 尝试使用 ESM 方法获取基路径
    try {
      const url = import.meta.url
      basePath = new URL('.', url).pathname
    }
    catch (error) {
      throw new Error('无法确定模块系统类型')
    }
  }

  // 处理 Windows 路径的情况
  const formattedPath = basePath.replace(/^\/([A-Za-z]:\/)/, '$1')

  // 寻找最近的 node_modules 路径
  const segments = formattedPath.split(/[\/\\]/)
  while (segments.length > 0) {
    const potentialPath = `${segments.join('/')}/node_modules`
    try {
      fs.accessSync(potentialPath)
      return potentialPath
    }
    catch (error) {
      segments.pop()
    }
  }

  return './node_modules'
}

let cachePath: string = ''

export function getCachePath() {
  if (cachePath)
    return cachePath

  const nodeModulesPath = getNodeModulesPath()
  cachePath = `${nodeModulesPath}/.cache/vs`
  return cachePath
}
