![banner.png](md/banner.png)

[[ENGLISH](README-en)] [[中文](README)]

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
pnpm install viteser tsx koa koa2-connect jsonwebtoken signale koa-zod-router http-proxy-middleware zod
```

2. 安装 @types

```bash
pnpm install --save-dev @types/jsonwebtoken @types/signale
```

3. 复制 [api.ts](https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts)

```bash
wget -O src/api.ts https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts
```

5. 修改 vite.config.ts

```ts
import { defineConfig } from 'vite'
import { ViteserPlugin } from 'viteser'

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  plugins: [
    // react() or vue() or other . . .
    ViteserPlugin(),
  ],
})
```

6. 运行服务

```bash
tsx src/api.ts
```

#### 🔍 快速启动

https://github.com/sia-fl/viteser-demo

#### 📦 最佳实践（长期维护）

https://github.com/sia-fl/buess
