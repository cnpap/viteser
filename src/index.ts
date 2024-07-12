import type { PluginOption } from 'vite'
import type { ViteserPluginOptions } from './type.ts'
import { pluginPack } from './plugin'
import { serve } from './utils/serve.ts'

// noinspection JSUnusedGlobalSymbols
export function ViteserPlugin(options: ViteserPluginOptions = {}): PluginOption {
  const pack = pluginPack(options)
  return ({
    name: 'viteser',
    ...pack,
  })
}

export * from './utils/response.ts'
export * from './utils/helper.ts'
export * from './resolve/context.ts'

export { serve }
