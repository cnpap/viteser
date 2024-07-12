import type { PluginOption } from 'vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import react from '@vitejs/plugin-react'

import { ViteserPlugin } from 'viteser'

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig(async () => {
  return ({
    plugins: [
      Inspect(),
      ViteserPlugin() as PluginOption,
      react(),
    ],
    build: {
      rollupOptions: {
        external: [
          'argon2',
        ],
      },
    },
  })
})
