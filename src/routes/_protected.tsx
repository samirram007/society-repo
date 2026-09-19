import { createFileRoute, redirect } from '@tanstack/react-router'
import { ProtectedLayout } from '@/components/layout/protected-layout'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    // Skip auth check on the server (SSR) — the client will handle it after hydration
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('auth_token')
    if (!token) {
      // Avoid redirect loop: don't redirect if we're already heading to landing or login
      if (location.pathname !== '/' && location.pathname !== '/login') {
        throw redirect({ to: '/' })
      }
    }
  },
  component: ProtectedLayout,
})
