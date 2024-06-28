import jwt from 'jsonwebtoken'
import type { AsyncHooksValueType, ViteserContext } from './hooks.ts'
import { hooksStorage } from './hooks.ts'

interface TestContextHelperOptions {
  payload?: any
  callback: Function
}

export async function testContextHelper(options: TestContextHelperOptions) {
  const token = jwt.sign(options.payload, 'secret', {
    expiresIn: '3h',
  })
  const store: AsyncHooksValueType = {
    jwt: options.payload,
    ctx: {
      req: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    } as ViteserContext,
  }
  await hooksStorage.run(
    store,
    async () => {
      await options.callback()
    },
  )
}
