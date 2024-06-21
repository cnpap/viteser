import type { PluginOption } from 'vite'
import type { ViteserPluginOptions } from './type'
import { pluginPack } from './plugin'

export function ViteserPlugin(options: ViteserPluginOptions = {}): PluginOption {
  const pack = pluginPack(options)
  return ({
    name: 'viteser',
    ...pack,
  })
}

export * from './middleware'
export * from './hooks'
export * from './utils'
