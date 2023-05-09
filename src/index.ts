import type { PluginOption } from 'vite'
import type {Options} from './type'

export default function Alias(options: Partial<Options> = {}): PluginOption {

  return {
    name: 'vite-plugin-starter',
    // 插件的配置选项
    config() {
      console.log('myPlugin config',options);
    },
    // 插件的生命周期钩子
    async transform(code, id) {
      console.log('myPlugin transform', id);
      return code;
    },
  }
}
