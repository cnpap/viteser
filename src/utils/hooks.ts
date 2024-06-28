import { AsyncLocalStorage } from 'node:async_hooks'
import type { ServerResponse } from 'node:http'
import type { VercelRequest } from '@vercel/node'

export type ViteserContext<T extends Record<string, any> = Record<string, any>> = {
  req: VercelRequest
  res: ServerResponse
} & T

export type ViteserJwtPayload = Record<string, any>

export interface AsyncHooksValueType {
  ctx: ViteserContext
  jwt: ViteserJwtPayload
}

export const hooksStorage = new AsyncLocalStorage<AsyncHooksValueType>()

export function context() {
  return hooksStorage.getStore()?.ctx as ViteserContext
}

export function useJwtPayload(): [ViteserJwtPayload, (p: ViteserJwtPayload) => void] {
  const jwtPayload = hooksStorage.getStore()?.jwt ?? {}
  function setJwtPayload(p: ViteserJwtPayload) {
    Object.assign(jwtPayload, p)
  }
  return [jwtPayload, setJwtPayload]
}

export function makeMiddleware(func: Function) {
  return async () => {
    const ctx = context()

    let breakFlag = false
    try {
      const result = await func()
      /**
       * 如果有值，则直接返回
       */
      if (result) {
        breakFlag = true
        ctx.res.writeHead(200, { 'Content-Type': 'application/json' })
        ctx.res.end(JSON.stringify(result))
      }
    }
    catch (e: any) {
      ctx.status = 500
      console.error(e)
      ctx.res.writeHead(500, { 'Content-Type': 'application/json' })
      ctx.res.end(JSON.stringify({
        success: false,
        message: 'error, please check the log',
      }))
      throw e
    }

    if (breakFlag)
      throw new Error(`middleware break`)
  }
}
