import { createFileRoute, redirect } from '@tanstack/react-router'
import { GuestLayout } from '@/components/layout/guest-layout'

export const Route = createFileRoute('/_guest')({
  beforeLoad: async ({ location }) => {
    // Skip auth check on the server (SSR) — the client will handle it after hydration
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('auth_token')
    if (token) {
      // Redirect logged-in users away from guest pages to a protected route.
      // Avoid redirecting to '/' since that IS a guest route (causes infinite loop).
      if (location.pathname !== '/members') {
        throw redirect({ to: '/members' })
      }
    }
  },
  component: GuestLayout,
})
