import { defineBuildConfig } from 'unbuild'

// noinspection JSUnusedGlobalSymbols
export default defineBuildConfig({
  entries: [
    'src/index',
    'src/middleware',
  ],
  clean: true,
  declaration: true,
  externals: [
    'vite',
    'typescript',
    'source-map-support',
    'koa',
  ],
  rollup: {
    emitCJS: true,
    output: {
      exports: 'named',
    },
  },
  failOnWarn: false,
})
