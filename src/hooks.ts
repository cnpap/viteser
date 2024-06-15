import { AsyncLocalStorage } from 'node:async_hooks'
import type { BaseContext } from 'koa'
import { decode } from 'jsonwebtoken'
import { getTokenByHeaders } from './utils'

export interface HooksContext<J extends Record<string, any>> {
  ctx: BaseContext
  jwt: J
}

export const hooksStorage = new AsyncLocalStorage<HooksContext<any>>()

export function context() {
  return hooksStorage.getStore()?.ctx as BaseContext
}

export function useJwtPayload<T>(): [T, (v: T) => void] {
  const jwtPayload = hooksStorage.getStore()?.jwt ?? {}
  function setJwtPayload(p: any) {
    Object.assign(jwtPayload, p)
  }
  if (!jwtPayload) {
    const ctx = context()
    const token = getTokenByHeaders(ctx.headers)
    const decodeValues = decode(token) as any
    Object.assign(jwtPayload, decodeValues)
    setJwtPayload(jwtPayload)
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
        ctx.body = result
      }
    }
    catch (e: any) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: e.message,
      }
      throw e
    }

    if (breakFlag)
      throw new Error(`middleware break`)
  }
}
