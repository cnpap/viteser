import React, { useEffect, useState } from 'react'
import { info } from './data'
import { boom } from './service'

export default function App() {
  const [text, setText] = useState('')
  useEffect(() => {
    boom(`Hello ${info.name}`).then((res) => {
      setText(res)
    })
  }, [])
  return (
    <div>
      <h1>{text}</h1>
    </div>
  )
}
