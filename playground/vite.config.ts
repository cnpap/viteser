import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import { ViteserPlugin } from '../src'

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  plugins: [
    Inspect(),
    ViteserPlugin({ fetchTool: 'axios' }),
  ],
})
