// noinspection JSUnusedGlobalSymbols

import { a } from './service'

const app = document.getElementById('app')

// 设置一个 button，用来触发 a 函数
const button = document.createElement('button')
button.textContent = 'click me'
button.onclick = async () => {
  a('world')
    .then((res) => {
      // eslint-disable-next-line no-alert
      alert(`服务端返回了: ${res.hello}`)
    })
}

app!.appendChild(button)
