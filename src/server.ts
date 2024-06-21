import type http from 'node:http'
import type { IncomingMessage } from 'node:http'
import zodRouter from 'koa-zod-router'
import Koa from 'koa'
import { z } from 'zod'
import { handleMiddleware } from './middleware'

const router = zodRouter()
const app = new Koa()

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
    )
  },
  name: '/call',
  method: 'post',
  path: '/call',
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

const koaCallback = app.callback()

async function handleFunction(req: IncomingMessage, res: http.ServerResponse) {
  await koaCallback(req, res)
}

export default handleFunction
