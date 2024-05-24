import type { IncomingHttpHeaders } from 'node:http'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { ImportedObject } from './type'

export function getToken(headers: IncomingHttpHeaders) {
  const authorization
    = headers.authorization || headers.Authorization || ''
  const token = (authorization as string).replace('Bearer ', '')
  if (!token) {
    // noinspection ExceptionCaughtLocallyJS
    throw new Error('Token is required')
  }
  return token
}

export function asyncImport(usedImports: ImportedObject[], importer: any) {
  const importIdentifiers: string[] = []
  return usedImports
    .filter(it => it !== null)
    .map((usedImport) => {
      if (importIdentifiers.includes(usedImport.identifier))
        return null

      importIdentifiers.push(usedImport.identifier)
      if (usedImport.type === 'named') {
        return {
          identifier: usedImport.identifier,
          data: importer(usedImport.moduleName).then(
            (m: any) => m[usedImport.identifier],
          ),
        }
      }
      if (usedImport.type === 'default') {
        return {
          identifier: usedImport.identifier,
          data: importer(usedImport.moduleName).then((m: any) => m.default),
        }
      }
      return null
    })
    .filter(Boolean)
}

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

export function getCachePath() {
  const nodeModulesPath = getNodeModulesPath()
  return `${nodeModulesPath}/.cache/viteser`
}

export function sha1(id: string) {
  return crypto.createHash('sha1').update(id).digest('hex')
}
