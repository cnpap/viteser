import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Connect, PluginOption } from 'vite'
import ts from 'typescript'
import type { AnalyzedOptions, ImportedObject, UseServerFunction, ViteserPluginOptions } from './type'
import { analyzeUseServerNode, extractImports } from './ast'
import { getCachePath, sha1 } from './utils'
import handleFunction from './server'

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
  return fetch('/vs/call', {
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
  return __api.post('/vs/call', {
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

function useServerFunction(server: Connect.Server) {
  server.use('/vs', handleFunction)
}

export function pluginPack(options: ViteserPluginOptions = {}): PluginOption {
  const cachePath = getCachePath()
  if (!fs.existsSync(cachePath))
    fs.mkdirSync(cachePath, { recursive: true })
  const cwdPath = path.resolve(process.cwd())
  let fetchTemplate: TemplateMaker = fetchTemplete
  if (options.fetchTool === 'axios')
    fetchTemplate = axiosTemplate

  return {
    name: 'viteser',
    configurePreviewServer(server) {
      useServerFunction(server.middlewares)
    },
    configureServer(server) {
      useServerFunction(server.middlewares)
    },
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
