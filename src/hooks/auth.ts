import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { loginSchema, type LoginInput } from '@/lib/validations'

// ============================================
// SERVER FUNCTIONS
// ============================================

const loginUser = createServerFn({ method: 'POST' })
  .validator((data: LoginInput) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { authenticateUser } = await import('@/lib/auth')
    return authenticateUser(data.email, data.password)
  })

const verifyUser = createServerFn({ method: 'GET' })
  .validator((token: string) => token)
  .handler(async ({ data }) => {
    const { getUserFromToken } = await import('@/lib/auth')
    return getUserFromToken(data)
  })

const logoutUser = createServerFn({ method: 'POST' })
  .validator((token: string) => token)
  .handler(async ({ data }) => {
    const { verifyToken } = await import('@/lib/auth')
    // In production, add token to blacklist
    await verifyToken(data)
    return { success: true }
  })

// ============================================
// QUERY KEYS
// ============================================
export const authKeys = {
  me: ['auth', 'me'] as const,
}

// ============================================
// AUTH HOOKS
// ============================================

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginInput) => loginUser({ data }),
    onSuccess: (result) => {
      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token)
        localStorage.setItem('auth_user', JSON.stringify(result.user))
      }
      // Invalidate auth query to refetch user
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      if (token) {
        return logoutUser({ data: token })
      }
      return Promise.resolve({ success: true })
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
      queryClient.setQueryData(authKeys.me, null)
      queryClient.clear()
    },
  })
}

/**
 * Returns the current user, but gates the query behind hydration
 * to ensure server and client render identical HTML during SSR.
 */
export function useCurrentUser() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) return null
      try {
        const user = await verifyUser({ data: token })
        return user
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    // Only run the query after hydration to ensure consistent state
    enabled: ready,
  })

  return {
    ...query,
    // Before hydration: show as loading (matches server's loading state)
    isLoading: !ready || query.isLoading,
    data: ready ? query.data : undefined,
  }
}
