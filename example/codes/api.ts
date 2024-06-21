import * as url from 'node:url'
import Koa from 'koa'
import k2c from 'koa2-connect/ts'
import zodRouter from 'koa-zod-router'
import { z } from 'zod'
import { handleMiddleware } from 'viteser'
import { createServer } from 'vite'

const SERVER_PORT = 12000

const router = zodRouter()
const app = new Koa()

async function run() {
  const viteServer = await createServer({
    server: {
      port: SERVER_PORT,
      middlewareMode: true,
    },
  })
  router.register({
    handler: async (ctx) => {
      const data = ctx.request.body.data
      const code = ctx.request.body.code
      await handleMiddleware(
        {
          data,
          code,
          ctx,
        },
        async (id: string) => {
          const { href } = url.pathToFileURL(id)
          return await import(href)
        },
      )
    },
    name: '/viteser/call',
    method: 'post',
    path: '/viteser/call',
    validate: {
      body: z.object({
        data: z.array(z.any()),
        code: z.string(),
      }),
      response: z.object({
        success: z.boolean(),
        data: z.any(),
        message: z.string().optional(),
      }),
    },
  })
  app.use(router.routes())
  app.use(k2c(viteServer.middlewares))

  app.listen(SERVER_PORT, () => {
    viteServer.resolvedUrls = {
      local: [
        `http://localhost:${SERVER_PORT}`,
      ],
      network: [],
    }
    viteServer.printUrls()
  })
}

// noinspection JSIgnoredPromiseFromCall
run()
