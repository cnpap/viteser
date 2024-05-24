// noinspection JSUnusedGlobalSymbols
export function a() {
  'use server'

  return 'a'
}

const app = document.getElementById('app')
app!.innerHTML = '__VITE-PLUGIN__'
