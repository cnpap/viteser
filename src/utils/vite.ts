import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ConfigEnv, InlineConfig, PreviewServerHook, ServerHook, UserConfig, ViteDevServer } from 'vite'
import { build, createServer } from 'vite'
import type { UseServerFunction, ViteserPluginOptions } from '../types/type.ts'
import { fetchTemplete } from '../fetch-templates/fetch.ts'
import { axiosTemplate } from '../fetch-templates/axios.ts'
import { makeEntryCode } from '../api-entry'
import { getCachePath } from './path.ts'

type ObjectHook<T, O = NonNullable<unknown>> = T | ({ handler: T, order?: 'pre' | 'post' | null } & O)

type TemplateMaker = (funcname: string, funcCode: string) => string

const virmod = 'virtual:__viteser.ts'

export async function pluginProxy(c: UserConfig): Promise<InlineConfig> {
  const cachePath = getCachePath()
  /**
   * 获取文件夹下所有文件
   */
  const filenames = fs.readdirSync(cachePath)
  /**
   * 序列化所有文件
   */
  const funcPayloads: Record<string, {
    id: string
    func: UseServerFunction
  }> = {}
  for (const filename of filenames) {
    const funcPayload = fs.readFileSync(`${
      cachePath
    }/${
      filename
    }`).toString()
    funcPayloads[filename] = JSON.parse(funcPayload) as {
      id: string
      func: UseServerFunction
    }
  }

  return {
    base: c.base,
    resolve: c.resolve,
    server: {
      hmr: false,
    },
    build: {
      ssr: virmod,
      rollupOptions: {
        input: virmod,
      },
    },
    configFile: false,
    plugins: [
      {
        name: 'viteser-api-entry',
        resolveId(id) {
          if (id.endsWith(virmod))
            return id

          return null
        },
        async load(id) {
          if (id.endsWith(virmod))
            return await makeEntryCode(funcPayloads)

          return null
        },
      },
    ],
  }
}

export async function apiProxy(c: UserConfig) {
  const viteServer = await createServer(await pluginProxy(c))

  const serveModule = await viteServer.ssrLoadModule(virmod)
  if (serveModule && serveModule.fetch)
    return serveModule.fetch

  return {
    fetch: (_: IncomingMessage, res: ServerResponse) => {
      res.end('viteser is not ready')
    },
  }
}

type ConfigType = ObjectHook<(this: void, config: UserConfig, env: ConfigEnv) => Omit<UserConfig, 'plugins'> | null | void | Promise<Omit<UserConfig, 'plugins'> | null | void>>

/**
 * 收集 vite 配置信息
 *
 * @param options
 */
export function viteConfig(options: ViteserPluginOptions) {
  const cachePath = getCachePath()
  if (!fs.existsSync(cachePath))
    fs.mkdirSync(cachePath, { recursive: true })
  let fetchTemplate: TemplateMaker = fetchTemplete
  if (options.fetchTool === 'axios')
    fetchTemplate = axiosTemplate
  const beforeInit = options.beforeInit ?? (async () => { })
  let userConfig: UserConfig = null as unknown as UserConfig
  const config: ConfigType = async (config, env) => {
    userConfig = config
    if (env.command === 'build') {
      const inlineConfig = await pluginProxy(config)
      const external = [
        'typescript',
        'vite',
        'viteser',
        'node:async_hooks',
      ]
      if (config.build && config.build.rollupOptions && config.build.rollupOptions.external)
        external.push(...config.build.rollupOptions.external as string[])

      inlineConfig.build = {
        cssTarget: false,
        modulePreload: false,
        sourcemap: false,
        copyPublicDir: false,
        lib: {
          entry: virmod,
        },
        rollupOptions: {
          external,
          input: {
            api: virmod,
          },
          output: [
            {
              dir: 'dist-vs-api/esm',
              format: 'es',
              exports: 'named',
              entryFileNames: '[name].mjs', // This will output `api.js` in the `dist` directory
            },
            {
              dir: 'dist-vs-api/cjs',
              format: 'cjs',
              exports: 'named',
              entryFileNames: '[name].cjs', // This will output `api.js` in the `dist` directory
            },
          ],
        },
      }
      await build(inlineConfig)
    }
  }
  const configurePreviewServer: ObjectHook<PreviewServerHook> = async (server) => {
    await beforeInit()
    // eslint-disable-next-line node/prefer-global/process
    const rootPathname = process.cwd()
    const modPathname = `file:///${rootPathname}/dist-vs-api/esm/api.mjs`.replace(/\\/g, '/')
    /* @vite-ignore */
    const app = await import(modPathname)
    server.middlewares.use('/vs/', async (req, res) => {
      app.fetch(req, res)
    })
  }
  const configureServer: ObjectHook<ServerHook> = async (server: ViteDevServer) => {
    await beforeInit()
    server.middlewares.use('/vs/', async (req, res) => {
      const mod = await apiProxy(userConfig) as any
      mod(req, res)
    })
  }
  return {
    fetchTemplate,
    config,
    configureServer,
    configurePreviewServer,
  }
}
