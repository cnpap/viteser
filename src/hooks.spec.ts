import { describe, expect, it } from 'vitest'
import { testContextHelper } from './utils'
import { useJwtPayload } from './hooks'

const testUserPayload = {
  id: 'admin',
  name: 'admin',
}

describe('hooks', () => {
  it('hooks', async () => {
    await testContextHelper<typeof testUserPayload>({
      payload: testUserPayload,
      callback: async () => {
        const [payload] = useJwtPayload<typeof testUserPayload>()
        expect(payload.id).toEqual('admin')
      },
    })
  })
})
