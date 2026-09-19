import { RPCLink } from '@orpc/client/fetch'

const RPC_BASE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

export const rpcLink = new RPCLink({
  url: `${RPC_BASE_URL}/api/rpc`,
})
