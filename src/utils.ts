import type { IncomingHttpHeaders } from 'node:http'
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import jwt from 'jsonwebtoken'
import type { BaseContext } from 'koa'
import ts from 'typescript'
import type { AnalyzedOptions, ImportedObject, UseServerFunction, ViteserPluginOptions } from './type'
import type { HooksContext } from './hooks'
import { hooksStorage } from './hooks'
import { analyzeUseServerNode, extractImports } from './ast'

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

interface TestContextHelperOptions {
  payload?: any
  callback: Function
}

export async function testContextHelper<T extends Record<string, any>>(options: TestContextHelperOptions) {
  const token = jwt.sign(options.payload, 'secret', {
    expiresIn: '3h',
  })
  const store: HooksContext<T> = {
    jwt: options.payload,
    ctx: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as BaseContext,
  }
  await hooksStorage.run(
    store,
    async () => {
      await options.callback()
    },
  )
}

function virtualSourceFile(id: string, code: string) {
  return ts.createSourceFile(
    id,
    code,
    ts.ScriptTarget.ESNext,
    true,
  )
}

function analyzeOption(): AnalyzedOptions {
  const importsMap: Record<string, ImportedObject> = {}
  const functions: UseServerFunction[] = []
  return {
    importsMap,
    functions,
  }
}

type TemplateMaker = (funcname: string, funcCode: string) => string

function fetchTemplete(funcname: string, funcCode: string) {
  return `\
async function ${funcname}(...args) {
  const __token__ = localStorage.getItem('token')
  return fetch('/viteser/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': __token__ ? 'Bearer ' + __token__ : '',
    },
    body: JSON.stringify({
      code: '${funcCode}',
      data: args,
    })
  })
    .then(async (res) => {
      const data = await res.json()
      if (!data.success) {
        throw new Error('fail on use server function')
      }
      return data.data
    })
}`
}

function axiosTemplate(funcname: string, funcCode: string) {
  return `\
async function ${funcname}(...args) {
  const __api = await import('axios').then((m) => m.default)
  return __api.post('/viteser/call', {
    code: '${funcCode}',
    data: args,
  })
    .then(async (res) => {
      const data = res.data
      if (!data.success) {
        throw new Error('fail on use server function')
      }
      return data.data
    })
}`
}

export function pluginPack(options: ViteserPluginOptions) {
  const cachePath = getCachePath()
  if (!fs.existsSync(cachePath))
    fs.mkdirSync(cachePath, { recursive: true })
  const cwdPath = path.resolve(process.cwd())
  let fetchTemplate: TemplateMaker = fetchTemplete
  if (options.fetchTool === 'axios')
    fetchTemplate = axiosTemplate
  return {
    async transform(code: string, id: string) {
      /**
       * 去除 id 中的 ? 后面的内容
       */
      id = id.split('?')[0]
      if (options.filter) {
        if (!options.filter(id))
          return code
      }
      /**
       * 判断是否为 tsx、vue 文件，需要考虑后续可能会存在 ?t=xxx 的情况
       */
      else if (!/\.(tsx|vue|ts)/.test(id)) {
        return code
      }
      const file = virtualSourceFile(id, code)
      const analyzedOptions = analyzeOption()
      extractImports(file, analyzedOptions.importsMap)
      analyzeUseServerNode(file, analyzedOptions)
      /**
       * 去除后缀
       */
      const oldid = id
      id = id.replace(/\.\w+$/, '')
      /**
       * 获取文件最后一个 / 后的内容
       */
      const dirs = id.split('/')
      const filename = dirs.pop()
      let positionDiff = 0
      for (const func of analyzedOptions.functions) {
        /**
         * 将 id 中的 cwdPath 部分去掉
         */
        const pureId = id.replace(cwdPath, '')
        const idhash = sha1(pureId)
        const bcode = code.substring(0, func.position[0] + positionDiff)
        const acode = code.substring(func.position[1] + positionDiff)
        const badiff = func.position[1] - func.position[0]
        const funcname = func.name ?? ''
        const funcCode = `${idhash}-${filename}-${func.name}`
        /**
         * 将 func JSON.stringify 以后，以 `${funcCode}.json` 的形式存储在 cachePath 中
         */
        fs.writeFileSync(`${cachePath}/${funcCode}.json`, JSON.stringify({
          id: oldid,
          func,
        }))
        let newCode = fetchTemplate(funcname, funcCode)
        if (/\.(ts)/.test(oldid))
          newCode = `export ${newCode}`
        const newCodeLength = newCode.length
        code = bcode + newCode + acode
        positionDiff += newCodeLength - badiff
      }

      return code
    },
  }
}
