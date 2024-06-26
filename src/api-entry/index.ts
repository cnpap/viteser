import path from 'node:path'
import type { UseServerFunction } from '../types/type.ts'

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
  return `
import { serve } from 'viteser'

const { fetch, app } = serve(
  async ({ code, data, ctx }) => {
${identifierCode}
  }
)
export {
  fetch,
  app
}

export default fetch
  `
}
