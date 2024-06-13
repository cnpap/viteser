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

### experience

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

### usage

1. install viteser and other dependencies

```bash
pnpm install viteser tsx koa koa2-connect jsonwebtoken signale koa-zod-router http-proxy-middleware zod
```

2. install @types

```bash
pnpm install --save-dev @types/jsonwebtoken @types/signale
```

3. copy api.ts to src/api.ts and glob.d.ts to src/glob.d.ts

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

6. modify package.json

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

7. run api and run dev

```bash
pnpm run api
```

```bash
pnpm run dev
```

😄 Remember to access the API port: http://localhost:12000
