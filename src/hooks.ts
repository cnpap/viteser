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
