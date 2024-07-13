// noinspection JSUnusedGlobalSymbols

import { AsyncLocalStorage } from 'node:async_hooks'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { VercelRequest } from '@vercel/node'

function hybridBodyParser(req: IncomingMessage) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      resolve(JSON.parse(body))
    })
    req.on('error', (err) => {
      reject(err)
    })
  })
}

// noinspection JSUnusedGlobalSymbols
export function serve(next: (p: Record<string, any>) => Promise<void>) {
  const fetch = async (req: IncomingMessage, res: ServerResponse) => {
    if ((req.url as string).startsWith('/vs/call') || (req.url as string).startsWith('/call')) {
      try {
        if (!(req as VercelRequest).body)
          (req as VercelRequest).body = await hybridBodyParser(req)
        const { data, code } = (req as VercelRequest).body
        return next({ data, code, req, res })
      }
      catch (error) {
        console.error(error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: false, error: 'error, please check the log' }))
      }
    }
  }

  return {
    fetch,
  }
}

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

export function getContext() {
  return contextLocalStorage.getStore()?.ctx as ViteserContext
}

export function getPayload(): [ViteserJwtPayload, (p: ViteserJwtPayload) => void] {
  const jwtPayload = contextLocalStorage.getStore()?.jwt ?? {}
  function setJwtPayload(p: ViteserJwtPayload) {
    Object.assign(jwtPayload, p)
  }
  return [jwtPayload, setJwtPayload]
}

export async function response<T>(data: T, code: number = 200, headers: Record<string, string> | null = null): Promise<T> {
  const ctx = getContext()
  if (headers) {
    for (const key in headers)
      ctx.res.setHeader(key, headers[key])
  }
  const result = ctx.result as {
    code: number
    data: T
  }
  Object.assign(result, {
    code,
    data,
  })
  return data
}
