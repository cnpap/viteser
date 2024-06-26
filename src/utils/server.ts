import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from 'koa'
import Koa from 'koa'
import { bodyParser } from '@koa/bodyparser'
import { hooksStorage } from './hooks.ts'

function hybridBodyParser() {
  const bp = bodyParser()
  return async (ctx: Context, next: () => Promise<void>) => {
    ctx.request.body = ctx.request.body || ctx.req.body
    return bp(ctx, next)
  }
}

// noinspection JSUnusedGlobalSymbols
export function serve(next: (p: Record<string, any>) => Promise<void>) {
  const app = new Koa()
  app.use(hybridBodyParser())
  app.use(async (ctx, _next) => {
    const url = ctx.req.url || ''
    if (url.startsWith('/vs/call') || url.startsWith('/call')) {
      ctx.request.body = ctx.request.body || ctx.req.body
      const data = ctx.request.body.data
      const code = ctx.request.body.code
      await hooksStorage.run({
        ctx,
        jwt: {},
      }, async () => {
        const resData = await next({
          code,
          data,
          ctx,
        })
        ctx.body = {
          success: true,
          data: resData,
        }
      })
    }
  })

  return {
    app,
    fetch: (req: IncomingMessage, res: ServerResponse) => {
      app.callback()(req, res)
    },
  }
}
