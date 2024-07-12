import { responseJson } from 'viteser'
import { info } from './data'

export async function a(name: string) {
  'use server'

  return {
    hello: `${info.name} ${info.version} ${name}`,
  }
}

export async function boom(w: string) {
  'use server'
  return responseJson(`${w} ${info.version}`, 201)
}
