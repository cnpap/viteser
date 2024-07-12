import { defineBuildConfig } from 'unbuild'

// noinspection JSUnusedGlobalSymbols
export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  clean: true,
  declaration: true,
  externals: [
    'vite',
    'typescript',
    'source-map-support',
  ],
  rollup: {
    esbuild: {

    },
    emitCJS: true,
    dts: {
      respectExternal: false,
    },
    output: {
      exports: 'named',
    },
  },
  failOnWarn: false,
})
