import * as url from 'node:url'
import Koa from 'koa'
import k2c from 'koa2-connect'
import { createProxyMiddleware } from 'http-proxy-middleware'
import signale from 'signale'
import zodRouter from 'koa-zod-router'
import { z } from 'zod'
import { handleMiddleware } from 'viteser'

const VITE_PORT = 5173
const SERVER_PORT = 12000

const router = zodRouter()
const app = new Koa()

router.register({
  handler: async (ctx) => {
    const data = ctx.request.body.data
    const code = ctx.request.body.code
    await handleMiddleware({
      data,
      code,
      ctx,
    }, async (id: string) => {
      const { href } = url.pathToFileURL(id)
      return await import(href)
    })
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

app.use(
  k2c(
    createProxyMiddleware({
      target: `http://localhost:${VITE_PORT}`,
      changeOrigin: true,
      ws: true,
      logger: signale,
    }),
  ),
)

app.listen(SERVER_PORT, () => {
  signale.log(`Proxy server is running on http://localhost:${SERVER_PORT}`)
})
