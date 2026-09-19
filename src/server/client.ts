import { createORPCClient } from '@orpc/client'
import { rpcLink } from './rpc-link'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const orpc: any = createORPCClient(rpcLink as any)
