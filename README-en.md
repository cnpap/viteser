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

## 🏃🏻‍♂️‍➡️ start

---

1. install viteser and other dependencies

```bash
pnpm install viteser tsx koa koa2-connect jsonwebtoken signale koa-zod-router http-proxy-middleware zod
```

2. install @types

```bash
pnpm install --save-dev @types/jsonwebtoken @types/signale
```

3. copy [api.ts](https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts)

```bash
wget -O src/api.ts https://raw.githubusercontent.com/sia-fl/viteser/main/example/codes/api.ts
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
    ViteserPlugin(),
  ],
})
```

6. run service

```bash
tsx src/api.ts
```

#### 🔍 quick start

https://github.com/sia-fl/viteser-demo

#### 📦 best practices (Long-Term Maintenance)

https://github.com/sia-fl/buess
