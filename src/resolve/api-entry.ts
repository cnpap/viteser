import path from 'node:path'
import fs from 'node:fs'
import { format } from 'prettier'
import type { UseServerFunction } from '../type.ts'
import { getCachePath } from '../utils/helper.ts'

export interface FuncFileType {
  id: string
  func: UseServerFunction
}

export type FuncFileMapType = Record<string, FuncFileType>

export async function transEntryIdentifier(funcPayloads: FuncFileMapType) {
  let code = ''
  for (const fileCode in funcPayloads) {
    const funcPayload = funcPayloads[fileCode]
    // 去除后缀名
    const pureFileCode = fileCode.replace(/\.\w+$/, '')
    if (pureFileCode.endsWith('.ts')) {
      code += `\
    if (code === '${pureFileCode}') {
      return import('${funcPayload.id}')
        .then(m => {
          return m.${funcPayload.func.name}(...data)
        })
    }
`
    }
    else {
      const dataParams = funcPayload
        .func
        .params
        .map(p => p.name)
      const importParams = funcPayload
        .func
        .usedImports
        .map(u => u.identifier)
      const imports = funcPayload
        .func
        .usedImports
        .map((u) => {
          let mKey = u.identifier
          if (u.type === 'default')
            mKey = 'default'

          if (u.moduleName.startsWith('.')) {
            const dir = path.dirname(funcPayload.id)
            u.moduleName = path.resolve(dir, u.moduleName)
            u.moduleName = u.moduleName.replace(/\\/g, '/')
          }
          return `\
          import('${u.moduleName}')
            .then(m => m['${mKey}'])`
        })
        .join(',\n')
      code += `\
    if (code === '${pureFileCode}') {
      const importData = await Promise.all([
${imports}
      ])
      const values = [
        ...data,
        ...importData
      ]
      return (
        async (${[...dataParams, ...importParams].join(', ')}) => ${funcPayload.func.body}
      )(...values)
    }
      `
    }
  }

  return code
}

export async function makeEntryCode(funcPayloads: FuncFileMapType) {
  const identifierCode = await transEntryIdentifier(funcPayloads)
  const code = `
import { serve, contextLocalStorage } from 'viteser'

const { fetch } = serve(
  async ({ code, data, req, res }) => {
    const __ctx__ = {
      req,
      res,
      result: {
        code: 200,
        data: {},
      },
    }
    const values = await contextLocalStorage
      .run({
        ctx: __ctx__,
        jwt: {}
      }, async () => {
        ${identifierCode}
      })
    if (values) {
      __ctx__.result.data = values
    }
    res.writeHead(__ctx__.result.code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      success: true,
      data: __ctx__.result.data,
    }))
  }
)
export {
  fetch,
}

export default fetch
  `
  const prettierCode = await format(code, {
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    parser: 'typescript',
  })
  const cachePath = getCachePath()
  const entryPath = path.resolve(cachePath, 'entry.ts')
  fs.writeFileSync(entryPath, prettierCode)
  return code
}
