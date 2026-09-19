import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { RPCHandler } from '@orpc/server/fetch'

// RPC middleware: intercepts /api/rpc/* requests before TanStack Router renders them as pages
function rpcMiddleware() {
  let handlerPromise: Promise<RPCHandler<any>> | null = null

  function getHandler(server: any): Promise<RPCHandler<any>> {
    if (!handlerPromise) {
      handlerPromise = (async () => {
        const mod = await server.ssrLoadModule('/src/server/procedures.ts')
        return new RPCHandler(mod.router)
      })()
    }
    return handlerPromise
  }

  return {
    name: 'rpc-middleware',
    configureServer(server: any) {
      // Register as position 0 middleware to run before TanStack Start
      server.middlewares.use(0, async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/rpc/')) return next()
        if (req.method !== 'POST' && req.method !== 'GET') return next()

        try {
          const handler = await getHandler(server)
          const protocol = 'http'
          const host = req.headers.host || 'localhost:3000'
          const fullUrl = `${protocol}://${host}${req.url}`

          // Collect request body
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk)
          }
          const body = Buffer.concat(chunks)

          const headers: Record<string, string> = {}
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers[key] = value
            else if (Array.isArray(value)) headers[key] = value.join(', ')
          }

          const request = new Request(fullUrl, {
            method: req.method,
            headers,
            body: body.length > 0 ? body : undefined,
          })

          const result = await handler.handle(request, {
            prefix: '/api/rpc',
            context: {},
          })

          if (result.matched) {
            const response = result.response
            res.statusCode = response.status
            response.headers.forEach((value: string, key: string) => {
              res.setHeader(key, value)
            })
            const responseBody = await response.arrayBuffer()
            res.end(Buffer.from(responseBody))
            return
          }
        } catch (err) {
          console.error('[RPC] Middleware error:', err)
          const message = err instanceof Error ? err.message : String(err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Internal Server Error', detail: message }))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
  plugins: [
    rpcMiddleware(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
})
