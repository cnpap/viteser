// noinspection JSUnusedGlobalSymbols

import { a } from './service'

const app = document.getElementById('app')

// 设置一个 button，用来触发 a 函数
const button = document.createElement('button')
button.innerText = 'click me'
button.onclick = async () => {
  console.log(await a('world'))
}

app!.appendChild(button)
