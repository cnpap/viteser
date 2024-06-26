import React, { useEffect, useState } from 'react'
import { info } from './data'

async function boom(w: string) {
  'use server'
  return `${w} ${info.version}`
}

export default function App() {
  const [text, setText] = useState('')
  useEffect(() => {
    boom(`Hello ${info.name}`).then(setText)
  }, [])
  return (
    <div>
      <h1>{text}</h1>
    </div>
  )
}
