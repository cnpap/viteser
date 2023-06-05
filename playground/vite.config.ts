import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Starter from '../src'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Inspect(),
    Starter(),
  ],
})
