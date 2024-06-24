import type { PluginOption } from 'vite'
import type { ViteserPluginOptions } from './type'
import { pluginPack } from './plugin'
import handleFunction from './server'

export function ViteserPlugin(options: ViteserPluginOptions = {}): PluginOption {
  const pack = pluginPack(options)
  return ({
    name: 'viteser',
    ...pack,
  })
}

export { handleFunction }
export * from './middleware'
export * from './hooks'
export * from './utils'
