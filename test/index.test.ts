import { describe, expect, it } from 'vitest'
import a from '../src'

describe('should', () => {
  it('exported', () => {
    expect(a).toEqual(1)
  })
})
