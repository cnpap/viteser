/* eslint-disable no-console */
// noinspection JSUnusedGlobalSymbols

import { a } from './service'

const app = document.getElementById('app')

// 设置一个 button，用来触发 a 函数
const button = document.createElement('button')
button.textContent = 'click me'
button.onclick = async () => {
  a('world')
    .then(console.info)
}

app!.appendChild(button)
