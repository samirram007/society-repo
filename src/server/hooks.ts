import { createORPCClient } from '@orpc/client'
import { createORPCReactQueryUtils } from '@orpc/react-query'
import { rpcLink } from './rpc-link'

const client = createORPCClient(rpcLink)

export const orpc = createORPCReactQueryUtils(client)
export { client }
