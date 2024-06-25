import fs from 'node:fs'
import type { PreviewServer, PreviewServerHook, ServerHook, ViteDevServer } from 'vite'
import type { ViteserPluginOptions } from '../types/type.ts'
import handleFunction from '../server.ts'
import { fetchTemplete } from '../fetch-templates/fetch.ts'
import { axiosTemplate } from '../fetch-templates/axios.ts'
import { getCachePath } from './path.ts'

type ObjectHook<T, O = NonNullable<unknown>> = T | ({ handler: T, order?: 'pre' | 'post' | null } & O)

type TemplateMaker = (funcname: string, funcCode: string) => string

export function viteConfig(options: ViteserPluginOptions) {
  const cachePath = getCachePath()
  if (!fs.existsSync(cachePath))
    fs.mkdirSync(cachePath, { recursive: true })
  let fetchTemplate: TemplateMaker = fetchTemplete
  if (options.fetchTool === 'axios')
    fetchTemplate = axiosTemplate
  const beforeInit = options.beforeInit ?? (async () => { })
  const configurePreviewServer: ObjectHook<PreviewServerHook> = async (server: PreviewServer) => {
    await beforeInit()
    server.middlewares.use('/vs', handleFunction)
  }
  const configureServer: ObjectHook<ServerHook> = async (server: ViteDevServer) => {
    await beforeInit()
    server.middlewares.use('/vs', handleFunction)
  }
  return {
    fetchTemplate,
    configureServer,
    configurePreviewServer,
  }
}
