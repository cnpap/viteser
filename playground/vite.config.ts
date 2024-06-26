import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import react from '@vitejs/plugin-react'

import { ViteserPlugin } from '../src'

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig(async () => {
  return ({
    plugins: [
      Inspect(),
      {
        name: 'demo',
        transform(code: string) {
          if (code.includes(`from 'viteser'`))
            return code.replace(`from 'viteser'`, `from '../../src'`)

          return code
        },
      },
      ViteserPlugin(),

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
