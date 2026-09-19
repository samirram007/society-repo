import { useEffect, useState, useCallback } from 'react'
import { uiStore, uiActions, defaultThemeConfig, type ThemeConfig } from '@/lib/store'

type Theme = 'light' | 'dark' | 'system'

// ============================================
// SAFE DOM HELPERS
// ============================================

const COLOR_MAP: Record<string, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
}

function safeApplyColors(colors: Record<string, string> | undefined | null) {
  if (typeof document === 'undefined') return
  if (!colors || typeof colors !== 'object') return
  try {
    const root = document.documentElement
    for (const [key, cssVar] of Object.entries(COLOR_MAP)) {
      const val = (colors as Record<string, unknown>)[key]
      if (typeof val === 'string' && val.length > 0) {
        root.style.setProperty(cssVar, val)
      }
    }
  } catch {}
}

function safeApplyTheme(resolved: 'light' | 'dark', config: ThemeConfig | undefined | null) {
  if (typeof document === 'undefined') return
  if (!config) return
  try {
    const root = document.documentElement
    // Set class
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    // Set colors
    const active = resolved === 'dark' ? config.darkColors : config.lightColors
    if (active && typeof active === 'object') {
      safeApplyColors(active as unknown as Record<string, string>)
    }
    // Radius
    if (typeof config.radius === 'number' && !isNaN(config.radius)) {
      root.style.setProperty('--radius', `${config.radius}rem`)
    }
    // Fonts
    if (typeof config.fontSans === 'string' && config.fontSans.length > 0) {
      root.style.setProperty('--font-sans', config.fontSans)
    }
    if (typeof config.fontMono === 'string' && config.fontMono.length > 0) {
      root.style.setProperty('--font-mono', config.fontMono)
    }
  } catch {}
}

// ============================================
// SAFE PERSISTENCE HELPERS
// ============================================
function getPersistedMode(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    return (localStorage.getItem('theme') as Theme) || 'system'
  } catch {
    return 'system'
  }
}

function resolveMode(mode: Theme): 'light' | 'dark' {
  if (mode === 'system') {
    if (typeof window === 'undefined') return 'light'
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  }
  return mode === 'dark' ? 'dark' : 'light'
}

function getStoreConfig(): ThemeConfig {
  try {
    return uiStore.get().themeConfig
  } catch {
    return defaultThemeConfig
  }
}

// ============================================
// HOOK — NO useStore, NO render-phase side effects
// ============================================
export function useTheme() {
  // Simple useState — never reads localStorage during render
  const [mounted, setMounted] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const [mode, setModeState] = useState<Theme>('system')

  // Everything in useEffect — never runs on server
  useEffect(() => {
    // Read persisted preferences
    const persistedMode = getPersistedMode()
    const resolved = resolveMode(persistedMode)

    // Sync state
    setModeState(persistedMode)
    setThemeState(resolved)
    uiActions.setTheme(resolved)

    // Apply to DOM
    const config = getStoreConfig()
    safeApplyTheme(resolved, config)

    // Mark as mounted
    setMounted(true)
  }, []) // Only runs once on mount

  // Listen for theme/config changes (from theme customizer etc.)
  useEffect(() => {
    if (!mounted) return
    const subscription = uiStore.subscribe(() => {
      const state = uiStore.get()
      const currentMode = getPersistedMode()
      const resolved = resolveMode(currentMode)
      setThemeState(resolved)
      setModeState(currentMode)
      safeApplyTheme(resolved, state.themeConfig)
    })
    return () => subscription.unsubscribe()
  }, [mounted])

  // Listen for system preference changes (when in system mode)
  useEffect(() => {
    if (!mounted) return
    const mode = getPersistedMode()
    if (mode !== 'system') return
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        const resolved = e.matches ? 'dark' : 'light'
        setThemeState(resolved)
        uiActions.setTheme(resolved)
        safeApplyTheme(resolved, getStoreConfig())
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } catch {
      return undefined
    }
  }, [mounted])

  const setTheme = useCallback((newMode: Theme) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('theme', newMode) } catch {}
    }
    const resolved = resolveMode(newMode)
    setModeState(newMode)
    setThemeState(resolved)
    uiActions.setTheme(resolved)
    safeApplyTheme(resolved, getStoreConfig())
  }, [])

  return { theme, mode, setTheme, mounted }
}
