![banner.png](md/banner.png)

[[ENGLISH](README.md)] [[中文](README-zh.md)]

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

### 使用体验

1. 克隆测试仓库

```bash
git clone https://github.com/sia-fl/viteser-demo.git
```

2. 安装依赖

```bash
pnpm install
```

3. 运行开发服务器

```bash
pnpm run dev
```

### 使用方法

1. 安装 viteser 及其他依赖

```bash
pnpm install viteser tsx koa koa2-connect jsonwebtoken signale koa-zod-router http-proxy-middleware zod
```

2. 安装类型定义

```bash
pnpm install --save-dev @types/jsonwebtoken @types/signale
```

3. 复制 [api.ts](https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts)

```bash
wget -O src/api.ts https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts
```

4. 修改 vite.config.ts

```ts
import { defineConfig } from 'vite'
import { ViteserPlugin } from 'viteser'

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  plugins: [
    // react() 或 vue() 或其他 . . .
    ViteserPlugin(),
  ],
})
```

5. 运行开发服务器

```bash
tsx src/api.ts
```
