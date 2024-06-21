![banner.png](md/banner.png)

[[ENGLISH](README-en.md)] [[中文](README.md)]

```tsx
// src/api.ts
import { useEffect, useState } from 'react'
import { db } from './db'

// src/App.tsx
import { getUser } from './api'

export async function getUser(id: number) {
  'use server'
  return db.query(`SELECT * FROM users WHERE id = ${id}`)
}

function App() {
  const [user, setUser] = useState<{
    id: number
    name: string
  }>({ id: 0, name: '' })
  useEffect(() => {
    getUser(1).then(setUser)
  }, [])
  return <div>{user.name}</div>
}
```

## 🏃🏻‍♂️‍➡️ 开始

---

1. 安装 viteser 和其他依赖

```bash
pnpm install viteser tsx
```

2. 修改 vite.config.ts

```ts
import { defineConfig } from 'vite'
import { ViteserPlugin } from 'viteser'

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  plugins: [
    ViteserPlugin(),
    // react() or vue() or other . . .
  ],
})
```

3. 运行服务

```bash
npx tsx node_modules/vite/bin/vite.js
```

#### 🔍 快速启动

https://github.com/sia-fl/viteser-demo

#### 📦 最佳实践（长期维护）

https://github.com/sia-fl/buess
