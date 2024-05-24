// eslint.config.js
import antfu from '@antfu/eslint-config'

// noinspection JSUnusedGlobalSymbols
export default antfu({
  rules: {
    // evel
    'no-eval': 'off',
    'no-async-promise-executor': 'off',
  },
})
