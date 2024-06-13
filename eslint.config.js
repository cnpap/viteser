// eslint.config.js
import antfu from '@antfu/eslint-config'

// noinspection JSUnusedGlobalSymbols
export default antfu({
  // 忽略
  ignores: ['example/**/*'],
  rules: {
    // evel
    'no-eval': 'off',
    'no-async-promise-executor': 'off',
  },
})
