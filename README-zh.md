![banner.png](md/banner.png)

[english](README.md)
[中文](README-zh.md)

```tsx
// src/api.ts
import { db } from './db'

export const getUser = async (id: number) => {
  "use server"
  /**
   * 使用 mysql、redis 或其他服务端服务
   */
  return db.query(`SELECT * FROM users WHERE id = ${id}`)
}

// src/App.tsx
import { getUser } from './api'
import { useState, useEffect } from 'react'

const App = () => {
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

### 尝试使用

1. clone test repo

```bash
git clone https://github.com/sia-fl/viteser-demo.git
```

2. install dependencies

```bash
pnpm install
```

3. start api and dev

```bash
pnpm run api
```

```bash
pnpm run dev
```

😄 now visit: http://localhost:12000

### 从已有的项目中启用 【推荐】

1. 安装 viteser 及其他依赖

```bash
pnpm install viteser tsx koa koa2-connect jsonwebtoken signale koa-zod-router http-proxy-middleware zod
```

2. 安装 @types

```bash
pnpm install --save-dev @types/jsonwebtoken @types/signale
```

3. 拷贝 api.ts 到 src/api.ts 以及 glob.d.ts 到 src/glob.d.ts

windows
```bash
Invoke-WebRequest -Uri https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts -OutFile src/api.ts
Invoke-WebRequest -Uri https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/glob.d.ts -OutFile src/glob.d.ts
```

linux or macos
```bash
wget -O src/api.ts https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts
wget -O src/glob.d.ts https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/glob.d.ts
```

5. modify vite.config.ts

```ts
import { defineConfig } from 'vite'
import { ViteserPlugin } from 'viteser'

// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  plugins: [
    // react() or vue() or other . . .
    ViteserPlugin({ vitePort: 5173, serverPort: 12000 }),
  ],
})
```

6. 添加脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    // other scripts . . .
    "api": "tsx src/api.ts"
  }
}
```

7. 运行 api 和 dev

```bash
pnpm run api
```

```bash
pnpm run dev
```

😄 记得访问的是 api 端口喔: http://localhost:12000
