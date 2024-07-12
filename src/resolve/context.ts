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

export const contextLocalStorage = new AsyncLocalStorage<AsyncHooksValueType>()

export function context() {
  return contextLocalStorage.getStore()?.ctx as ViteserContext
}

export function payload(): [ViteserJwtPayload, (p: ViteserJwtPayload) => void] {
  const jwtPayload = contextLocalStorage.getStore()?.jwt ?? {}
  function setJwtPayload(p: ViteserJwtPayload) {
    Object.assign(jwtPayload, p)
  }
  return [jwtPayload, setJwtPayload]
}
