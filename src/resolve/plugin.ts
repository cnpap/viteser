import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { PluginOption } from 'vite'
import type { ImportedObject, ViteserPluginOptions } from '../type.ts'
import {
  analyzeOption,
  analyzeUseServerNode,
  extractImports,
  virtualSourceFile,
} from './ast.ts'
import { viteConfig } from './vite.ts'
import { getCacheFunctions, sha1, trimQMark } from './helper.ts'
import type { FuncFileType } from './api-entry.ts'

export function pluginPack(options: ViteserPluginOptions = {}): PluginOption {
  const { fetchTemplate, ...confRest } = viteConfig(options)
  const cachePath = getCacheFunctions()
  const cwdPath = path.resolve(process.cwd())
  return {
    name: 'viteser',
    ...confRest,
    async transform(code: string, id: string) {
      id = trimQMark(id)
      if ((options.filter && !options.filter(id)) || !/\.(?:tsx|vue|ts|svelte)/.test(id))
        return code

      const file = virtualSourceFile(id, code)
      const analyzedOptions = analyzeOption()
      /**
       * 如果不是 ts 文件，提取在该函数中所使用的 imports
       */
      if (!/\.ts$/.test(id))
        extractImports(file, analyzedOptions.importsMap)

      analyzeUseServerNode(file, analyzedOptions)
      /**
       * 去除后缀
       */
      const pureid = id.replace(/\.\w+$/, '')

      /**
       * 获取文件最后一个 / 后的内容
       */
      const dirs = pureid.split('/')
      const filename = dirs.pop()
      let positionDiff = 0
      const newCodes: string[] = []
      for (const func of analyzedOptions.functions) {
        const funcFile: FuncFileType = {
          id,
          name: func.name,
        }
        /**
         * 将 id 中的 cwdPath 部分去掉
         */
        const pureId = pureid.replace(cwdPath, '')
        /**
         * idHash 标记函数唯一
         */
        const idhash = sha1(pureId).substring(0, 12)
        const funcCode = `${idhash}-${filename}-${func.name}`
        /**
         * 如果是 ts 文件则只保留 "use server" 函数，如果不是，则保留所有函数
         *
         * 只有 ts 文件才可以清理无关代码，比如 import 可能导致前端运行到服务端代码
         */
        if (!/\.ts$/.test(id)) {
          /**
           * 开始清理无关代码
           */
          const usedImports: Record<string, ImportedObject> = {}
          /**
           * 通过 identifier 去重
           */
          func.usedImports.forEach((imp) => {
            usedImports[imp.identifier] = imp
          })
          func.usedImports = Object.values(usedImports)
          funcFile.func = func
        }
        /**
         * 将 func JSON.stringify 以后，以 `${funcCode}.json` 的形式存储在 cachePath 中
         */
        const bcode = code.substring(0, func.position[0] + positionDiff)
        const acode = code.substring(func.position[1] + positionDiff)
        const badiffLength = func.position[1] - func.position[0]
        const funcname = func.name ?? ''
        let newCode = fetchTemplate(funcname, funcCode)
        if (/\.ts/.test(id)) {
          newCode = `export ${newCode}`
          newCodes.push(newCode)
        }
        else {
          const newCodeLength = newCode.length
          code = bcode + newCode + acode
          positionDiff += newCodeLength - badiffLength
        }

        fs.writeFileSync(`${cachePath}/${funcCode}.json`, JSON.stringify(funcFile))
      }
      if (analyzedOptions.functions.length > 0 && /\.ts$/.test(id))
        code = newCodes.join('\n\n')

      return code
    },
  }
}
