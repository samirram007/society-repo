import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { RPCHandler } from '@orpc/server/fetch'
import { router } from './server/procedures'

const rpcHandler = new RPCHandler(router)

// Create the normal TanStack Start handler
const startFetch = createStartHandler(defaultStreamHandler)

function createServerEntry(entry: { fetch: typeof startFetch }) {
  return {
    async fetch(...args: Parameters<typeof startFetch>) {
      const request = args[0] as Request
      const url = new URL(request.url)

      // Intercept API RPC requests before TanStack Start's page rendering
      if (url.pathname.startsWith('/api/rpc/')) {
        const result = await rpcHandler.handle(request, {
          prefix: '/api/rpc',
          context: {},
        })

        if (result.matched) {
          return result.response
        }

        return new Response('Not Found', { status: 404 })
      }

      // Fall through to normal page rendering
      return await entry.fetch(...args)
    },
  }
}

export default createServerEntry({ fetch: startFetch })
