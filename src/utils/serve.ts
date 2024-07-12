import type { IncomingMessage, ServerResponse } from 'node:http'
import type { VercelRequest } from '@vercel/node'
import type { UserConfig } from 'vite'
import { createServer } from 'vite'
import { pluginProxy, virmod } from './vite.ts'

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

export async function apiProxy(c: UserConfig) {
  const viteServer = await createServer(await pluginProxy(c))

  const serveModule = await viteServer.ssrLoadModule(virmod)
  if (serveModule && serveModule.fetch)
    return serveModule.fetch

  return {
    fetch: (_: IncomingMessage, res: ServerResponse) => {
      res.end('viteser is not ready')
    },
  }
}
