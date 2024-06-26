import type { PluginOption } from 'vite'
import type { ViteserPluginOptions } from './types/type'
import { pluginPack } from './plugin'

export function ViteserPlugin(options: ViteserPluginOptions = {}): PluginOption {
  const pack = pluginPack(options)
  return ({
    name: 'viteser',
    ...pack,
  })
}

export * from './utils/server.ts'
export * from './utils/hooks'
