import { info } from './data'

export async function a(name: string) {
  'use server'

  return {
    hello: `${info.name} ${info.version} ${name}`,
  }
}
