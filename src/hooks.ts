import { AsyncLocalStorage } from 'node:async_hooks'
import type { BaseContext } from 'koa'
import jwt from 'jsonwebtoken'
import { getToken } from './utils'

interface HooksContext<J> {
  ctx: BaseContext
  jwt: J
}

export const hooksStorage = new AsyncLocalStorage<HooksContext<any>>()

export function context() {
  return hooksStorage.getStore()?.ctx as BaseContext
}

export function useJwtPayload<T>(): [T, (v: T) => void] {
  let { payload } = hooksStorage.getStore() as any
  function setJwtPayload(p: any) {
    Object.assign(payload, p)
  }
  if (!payload) {
    const ctx = context()
    const token = getToken(ctx.headers)
    payload = jwt.decode(token) as any
    setJwtPayload(payload)
  }
  return [payload, setJwtPayload]
}
