import fs from 'node:fs'
import type { UseServerFunction } from './type'
import { compileTypeScript } from './ast'
import { asyncImport, getCachePath } from './utils'
import { hooksStorage } from './hooks'

const funcStatementMap: Record<string, any> = {}

const cachePath = getCachePath()

async function funcStatement(code: string, importer: any) {
  if (!funcStatementMap[code]) {
    const funcPayload = fs.readFileSync(`${cachePath}/${code}.json`).toString()
    const funcJsonPayload = JSON.parse(funcPayload) as {
      id: string
      func: UseServerFunction
    }
    const { id, func } = funcJsonPayload
    if (id.endsWith('.ts')) {
      const mod = await importer(id)
      const callable = mod[func.name]
      funcStatementMap[code] = (ctx: any, _values: any) => {
        hooksStorage.run({
          ctx,
          jwt: {},
        }, async () => {
          const resData = await callable(..._values)
          ctx.body = {
            success: true,
            data: resData,
          }
        })
      }
      return
    }
    /**
     * 要将 usedImports 中 identifier 相同的去重复
     */
    const importParams = asyncImport(func.usedImports, importer)
    const params: any[] = func.params.map((p: any) => p.name)
    const values: any[] = []
    if (importParams.length > 0) {
      const _importParams = await Promise.all(
        importParams.map((ip: any) => ip.data),
      )
      params.push(...importParams.map((ip: any) => ip.identifier))
      values.push(..._importParams)
    }
    const temp = compileTypeScript(`
  async function ${func.name}(${params.join(', ')}) ${func.body}
  `)
    const han = eval(`(${temp})`)
    funcStatementMap[code] = (ctx: any, _values: any) => {
      hooksStorage.run({
        ctx,

        jwt: {},
      }, async () => {
        const resData = await han(..._values, ...values)
        ctx.body = {
          success: true,
          data: resData,
        }
      })
    }
  }
}

export interface HandleMiddlewareOptionType {
  ctx: any
  data: any
  code: string
}

/**
 * 因为不想约束使用者的框架选择，该函数只实现基本调用逻辑，其他部分由使用者补齐
 */
// noinspection JSUnusedGlobalSymbols
export async function handleMiddleware({ data, code, ctx }: HandleMiddlewareOptionType, importer: any) {
  const values = [...data]
  await funcStatement(code, importer)
  await funcStatementMap[code](ctx, values)
}

// noinspection JSUnusedGlobalSymbols
/**
 * 目前是个空转接口，以后升级可能添加入参
 */
export async function prepareMiddleware() {
  // noinspection JSUnusedGlobalSymbols
  return async (data: any, code: string, ctx: any, importer: any) => {
    await handleMiddleware({ data, code, ctx }, importer)
  }
}
