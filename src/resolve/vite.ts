import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ConfigEnv, InlineConfig, PreviewServerHook, ServerHook, UserConfig, ViteDevServer } from 'vite'
import { build, createServer } from 'vite'
import type { ViteserPluginOptions } from '../type.ts'
import { fetchTemplete } from './tpl/fetch/fetch.ts'
import { axiosTemplate } from './tpl/fetch/axios.ts'
import type { FuncFileType } from './api-entry.ts'
import { makeEntryCode } from './api-entry.ts'
import { getCacheFunctions } from './helper.ts'

type ObjectHook<T, O = NonNullable<unknown>> = T | ({ handler: T, order?: 'pre' | 'post' | null } & O)

type TemplateMaker = (funcname: string, funcCode: string) => string

export const virmod = 'virtual:__viteser.ts'

export async function pluginProxy(c: UserConfig): Promise<InlineConfig> {
  const cachePath = getCacheFunctions()
  /**
   * 获取文件夹下所有文件
   */
  const filenames = fs.readdirSync(cachePath)
  /**
   * 序列化所有文件
   */
  const funcPayloads: Record<string, FuncFileType> = {}
  for (const filename of filenames) {
    const funcPayload = fs.readFileSync(`${
      cachePath
    }/${
      filename
    }`).toString()
    funcPayloads[filename] = JSON.parse(funcPayload) as FuncFileType
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

type ConfigType = ObjectHook<(this: void, config: UserConfig, env: ConfigEnv) => Omit<UserConfig, 'plugins'> | null | void | Promise<Omit<UserConfig, 'plugins'> | null | void>>

let oldServer: ViteDevServer | null = null

export async function apiProxy(c: UserConfig) {
  let viteServer: ViteDevServer

  if (oldServer)
    viteServer = oldServer
  else
    viteServer = await createServer(await pluginProxy(c))

  oldServer = viteServer

  const serveModule = await viteServer.ssrLoadModule(virmod)
  if (serveModule && serveModule.fetch)
    return serveModule.fetch

  return {
    fetch: (_: IncomingMessage, res: ServerResponse) => {
      res.end('viteser is not ready')
    },
  }
}

/**
 * 收集 vite 配置信息
 *
 * @param options
 */
export function viteConfig(options: ViteserPluginOptions) {
  const cachePath = getCacheFunctions()
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true })
  }
  else {
    fs.readdirSync(cachePath).forEach((file) => {
      fs.unlinkSync(`${cachePath}/${file}`)
    })
  }
  let fetchTemplate: TemplateMaker = fetchTemplete
  if (options.fetchTool === 'axios')
    fetchTemplate = axiosTemplate
  let userConfig: UserConfig = null as unknown as UserConfig
  let configEnv: ConfigEnv = null as unknown as ConfigEnv
  const config: ConfigType = async (config, env) => {
    userConfig = config
    configEnv = env
  }
  const configurePreviewServer: ObjectHook<PreviewServerHook> = async (server) => {
    // eslint-disable-next-line node/prefer-global/process
    const rootPathname = process.cwd()
    const modPathname = `file:///${rootPathname}/dist-vs-api/esm/api.mjs`.replace(/\\/g, '/')
    const app = await import(/* @vite-ignore */modPathname)
    server.middlewares.use('/vs/', async (req, res) => {
      await app.fetch(req, res)
    })
  }
  const configureServer: ObjectHook<ServerHook> = async (server: ViteDevServer) => {
    server.middlewares.use('/vs/', async (req, res) => {
      const mod = await apiProxy(userConfig) as any
      await mod(req, res)
    })
  }
  const buildEnd = async () => {
    const config = userConfig
    if (configEnv.command === 'build') {
      const inlineConfig = await pluginProxy(config)
      const external = [
        'typescript',
        'vite',
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
          treeshake: {
            // moduleSideEffects: false,
          },
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
  return {
    fetchTemplate,
    buildEnd,
    config,
    configureServer,
    configurePreviewServer,
  }
}
