import * as url from 'node:url'
import Koa from 'koa'
import zodRouter from 'koa-zod-router'
import { z } from 'zod'
import { handleMiddleware } from 'viteser'
import { createServer } from 'vite'

const SERVER_PORT = 12000

const router = zodRouter()
const app = new Koa()

async function run() {
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
    name: '/vs/call',
    method: 'post',
    path: '/vs/call',
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
  const viteServer = await createServer({
    configFile: false,
    server: {
      port: SERVER_PORT,
    },
    plugins: [
      {
        name: 'xxx',
        configureServer(server) {
          server.middlewares.use('/vs', async (req, res) => {
            await app.callback()(req, res)
          })
        },
      },
    ],
  })
  viteServer.listen()
    .then(() => {
      viteServer.printUrls()
    })
}

// noinspection JSIgnoredPromiseFromCall
run()
