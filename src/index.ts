import type { PluginOption } from 'vite'
import type { ViteserPluginOptions } from './type.ts'
import { pluginPack } from './resolve/plugin.ts'

// noinspection JSUnusedGlobalSymbols
export function ViteserPlugin(options: ViteserPluginOptions = {}): PluginOption {
  const pack = pluginPack(options)
  return ({
    name: 'viteser',
    ...pack,
  })
}

export default ViteserPlugin
