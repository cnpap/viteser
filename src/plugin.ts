import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { PluginOption } from 'vite'
import type { ViteserPluginOptions } from './types/type.ts'
import { analyzeOption, analyzeUseServerNode, extractImports, removeAllImports, virtualSourceFile } from './utils/ast.ts'
import { getCachePath } from './utils/path.ts'
import { sha1 } from './utils/hash.ts'
import { viteConfig } from './utils/vite.ts'
import { trimQMark } from './utils/str.ts'

export function pluginPack(options: ViteserPluginOptions = {}): PluginOption {
  const cachePath = getCachePath()
  const cwdPath = path.resolve(process.cwd())
  const { fetchTemplate, ...confRest } = viteConfig(options)

  return {
    name: 'viteser',
    ...confRest,
    async transform(code: string, id: string) {
      id = trimQMark(id)
      if ((options.filter && !options.filter(id)) || !/\.(?:tsx|vue|ts)/.test(id))
        return code

      const file = virtualSourceFile(id, code)
      const analyzedOptions = analyzeOption()
      /**
       * 如果是 tsx 或者 vue 文件，提取 imports
       */
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
      for (const func of analyzedOptions.functions) {
        /**
         * 将 id 中的 cwdPath 部分去掉
         */
        const pureId = pureid.replace(cwdPath, '')
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
          id,
          func,
        }))
        let newCode = fetchTemplate(funcname, funcCode)
        if (/\.ts/.test(id))
          newCode = `export ${newCode}`
        const newCodeLength = newCode.length
        code = bcode + newCode + acode
        positionDiff += newCodeLength - badiff
      }
      if (analyzedOptions.functions.length > 0 && /\.ts$/.test(id))
        code = removeAllImports(virtualSourceFile(id, code))

      return code
    },
  }
}
