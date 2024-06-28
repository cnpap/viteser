import type { IncomingMessage, ServerResponse } from 'node:http'
import type { VercelRequest } from '@vercel/node'
import { hooksStorage } from './hooks.ts'

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
        const ctx = {
          req: req as VercelRequest,
          res,
        }

        await hooksStorage.run({ ctx, jwt: {} }, async () => {
          const resData = await next({ code, data, ctx })
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            success: true,
            data: resData,
          }))
        })
      }
      catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        console.error(error)
        res.end(JSON.stringify({ success: false, error: 'error, please check the log' }))
      }
    }
  }

  return {
    fetch,
  }
}
