import type { IncomingHttpHeaders } from 'node:http'
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
  const formattedPath = basePath.replace(/^\/([A-Z]:\/)/i, '$1')

  // 寻找最近的 node_modules 路径
  const segments = formattedPath.split(/[/\\]/)
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

export function getCacheFunctions() {
  if (cachePath)
    return `${cachePath}/vs`
  getCachePath()
  return `${cachePath}/vs`
}

export function getCachePath() {
  if (cachePath)
    return cachePath
  cachePath = `${getNodeModulesPath()}/.cache`
  return cachePath
}

// noinspection JSUnusedGlobalSymbols
/**
 * 从 headers 中获取 token
 *
 * @param headers
 */
export function getTokenByHeaders(headers: IncomingHttpHeaders) {
  const authorization
    = headers.authorization || headers.Authorization || ''
  const token = (authorization as string).replace('Bearer ', '')
  if (!token) {
    // noinspection ExceptionCaughtLocallyJS
    throw new Error('Token is required')
  }
  return token
}
