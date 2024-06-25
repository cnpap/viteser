import jwt from 'jsonwebtoken'
import type { BaseContext } from 'koa'
import type { HooksContext } from './hooks.ts'
import { hooksStorage } from './hooks.ts'

interface TestContextHelperOptions {
  payload?: any
  callback: Function
}

export async function testContextHelper<T extends Record<string, any>>(options: TestContextHelperOptions) {
  const token = jwt.sign(options.payload, 'secret', {
    expiresIn: '3h',
  })
  const store: HooksContext<T> = {
    jwt: options.payload,
    ctx: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as BaseContext,
  }
  await hooksStorage.run(
    store,
    async () => {
      await options.callback()
    },
  )
}
