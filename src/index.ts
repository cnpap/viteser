import type { PluginOption } from 'vite'
import type { Options } from './type'

export default function Alias(options: Partial<Options> = {}): PluginOption {
  return {
    name: 'vite-plugin-starter',
    transform(code) {
      return code.replace('__VITE-PLUGIN__', `Hello Plugin! ${options}`)
    },
  }
}
