// RPC API route - actual request handling is done in src/server.ts
// This file exists for route registration but the server entry
// intercepts /api/rpc/* requests before this route's handler runs
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rpc/$$')({
  component: () => null,
})
