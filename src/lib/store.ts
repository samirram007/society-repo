import { Store } from '@tanstack/react-store'

// ============================================
// AUTH STORE
// ============================================
interface AuthState {
  user: {
    id: number
    email: string
    name: string
    role: string
  } | null
  token: string | null
  isAuthenticated: boolean
}

export const authStore = new Store<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
})

// Auth actions
export const authActions = {
  login: (user: AuthState['user'], token: string) => {
    authStore.setState((state) => ({
      ...state,
      user,
      token,
      isAuthenticated: true,
    }))
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
    }
  },

  logout: () => {
    authStore.setState((state) => ({
      ...state,
      user: null,
      token: null,
      isAuthenticated: false,
    }))
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  },

  restoreSession: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('auth_user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          authStore.setState((state) => ({
            ...state,
            user,
            token,
            isAuthenticated: true,
          }))
        } catch {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        }
      }
    }
  },
}

// ============================================
// THEME CUSTOMIZATION
// ============================================
export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

export interface ThemeConfig {
  lightColors: ThemeColors
  darkColors: ThemeColors
  radius: number
  fontSans: string
  fontMono: string
}

export const defaultLightTheme: ThemeColors = {
  background: '0 0% 100%',
  foreground: '224 71% 4%',
  card: '0 0% 100%',
  cardForeground: '224 71% 4%',
  popover: '0 0% 100%',
  popoverForeground: '224 71% 4%',
  primary: '220.9 76.4% 48%',
  primaryForeground: '210 20% 98%',
  secondary: '220 14.3% 95.9%',
  secondaryForeground: '220.9 76.4% 48%',
  muted: '220 14.3% 95.9%',
  mutedForeground: '220 8.9% 46.1%',
  accent: '220 14.3% 95.9%',
  accentForeground: '220.9 76.4% 48%',
  destructive: '0 84.2% 60.2%',
  destructiveForeground: '210 20% 98%',
  border: '220 13% 91%',
  input: '220 13% 91%',
  ring: '220.9 76.4% 48%',
}

export const defaultDarkTheme: ThemeColors = {
  background: '224 71% 4%',
  foreground: '210 20% 98%',
  card: '224 71% 4%',
  cardForeground: '210 20% 98%',
  popover: '224 71% 4%',
  popoverForeground: '210 20% 98%',
  primary: '217.2 91.2% 59.8%',
  primaryForeground: '224 71% 4%',
  secondary: '217.2 32.6% 17.5%',
  secondaryForeground: '210 20% 98%',
  muted: '217.2 32.6% 17.5%',
  mutedForeground: '215 20.2% 65.1%',
  accent: '217.2 32.6% 17.5%',
  accentForeground: '210 20% 98%',
  destructive: '0 62.8% 30.6%',
  destructiveForeground: '210 20% 98%',
  border: '217.2 32.6% 17.5%',
  input: '217.2 32.6% 17.5%',
  ring: '224.3 76.3% 48%',
}

export const defaultThemeConfig: ThemeConfig = {
  lightColors: defaultLightTheme,
  darkColors: defaultDarkTheme,
  radius: 0.5,
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
}

// Preset themes with both light and dark variants
export interface PresetTheme {
  label: string
  light: ThemeColors
  dark: ThemeColors
}

export const presetThemes: Record<string, PresetTheme> = {
  blue: {
    label: 'Blue',
    light: defaultLightTheme,
    dark: defaultDarkTheme,
  },
  slate: {
    label: 'Slate',
    light: {
      ...defaultLightTheme,
      primary: '222.2 47.4% 11.2%',
      primaryForeground: '210 40% 98%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accentForeground: '222.2 47.4% 11.2%',
      ring: '222.2 84% 4.9%',
    },
    dark: {
      ...defaultDarkTheme,
      primary: '210 40% 98%',
      primaryForeground: '222.2 47.4% 11.2%',
      ring: '212.7 26.8% 83.9%',
    },
  },
  green: {
    label: 'Green',
    light: {
      ...defaultLightTheme,
      primary: '142.1 76.2% 36.3%',
      primaryForeground: '355.7 100% 97.3%',
      ring: '142.1 76.2% 36.3%',
    },
    dark: {
      ...defaultDarkTheme,
      primary: '142.1 70.6% 45.3%',
      primaryForeground: '144.9 80.4% 10%',
      ring: '142.4 71.8% 29.2%',
    },
  },
  violet: {
    label: 'Violet',
    light: {
      ...defaultLightTheme,
      primary: '263.4 70% 50.4%',
      primaryForeground: '210 20% 98%',
      ring: '263.4 70% 50.4%',
    },
    dark: {
      ...defaultDarkTheme,
      primary: '263.4 70% 50.4%',
      primaryForeground: '210 20% 98%',
      ring: '263.4 70% 50.4%',
    },
  },
  orange: {
    label: 'Orange',
    light: {
      ...defaultLightTheme,
      primary: '24.6 95% 53.1%',
      primaryForeground: '60 9.1% 97.8%',
      ring: '24.6 95% 53.1%',
    },
    dark: {
      ...defaultDarkTheme,
      primary: '20.5 90.2% 48.2%',
      primaryForeground: '60 9.1% 97.8%',
      ring: '24.6 95% 53.1%',
    },
  },
  rose: {
    label: 'Rose',
    light: {
      ...defaultLightTheme,
      primary: '346.8 77.2% 49.8%',
      primaryForeground: '355.7 100% 97.3%',
      ring: '346.8 77.2% 49.8%',
    },
    dark: {
      ...defaultDarkTheme,
      primary: '346.8 77.2% 49.8%',
      primaryForeground: '355.7 100% 97.3%',
      ring: '346.8 77.2% 49.8%',
    },
  },
  midnight: {
    label: 'Midnight',
    light: {
      ...defaultLightTheme,
      primary: '234.7 80% 50%',
      primaryForeground: '0 0% 100%',
      ring: '234.7 80% 50%',
    },
    dark: {
      background: '224 71% 4%',
      foreground: '213 31% 91%',
      card: '224 71% 4%',
      cardForeground: '213 31% 91%',
      popover: '224 71% 4%',
      popoverForeground: '213 31% 91%',
      primary: '210 40% 98%',
      primaryForeground: '224.7 71.2% 20.2%',
      secondary: '222.2 47.4% 11.2%',
      secondaryForeground: '210 40% 98%',
      muted: '223 47% 11%',
      mutedForeground: '215.4 16.3% 56.9%',
      accent: '216 34% 17%',
      accentForeground: '210 40% 98%',
      destructive: '0 63% 31%',
      destructiveForeground: '210 40% 98%',
      border: '216 34% 17%',
      input: '216 34% 17%',
      ring: '216 34% 17%',
    },
  },
  forest: {
    label: 'Forest',
    light: {
      ...defaultLightTheme,
      primary: '152 58% 32%',
      primaryForeground: '0 0% 100%',
      ring: '152 58% 32%',
    },
    dark: {
      background: '150 20% 6%',
      foreground: '120 20% 90%',
      card: '150 20% 6%',
      cardForeground: '120 20% 90%',
      popover: '150 20% 6%',
      popoverForeground: '120 20% 90%',
      primary: '152 58% 45%',
      primaryForeground: '0 0% 100%',
      secondary: '150 15% 14%',
      secondaryForeground: '120 20% 90%',
      muted: '150 15% 14%',
      mutedForeground: '120 10% 60%',
      accent: '150 15% 14%',
      accentForeground: '120 20% 90%',
      destructive: '0 63% 31%',
      destructiveForeground: '0 0% 98%',
      border: '150 15% 14%',
      input: '150 15% 14%',
      ring: '152 58% 45%',
    },
  },
  sunset: {
    label: 'Sunset',
    light: {
      ...defaultLightTheme,
      primary: '14 80% 55%',
      primaryForeground: '0 0% 100%',
      ring: '14 80% 55%',
    },
    dark: {
      background: '10 15% 6%',
      foreground: '30 20% 90%',
      card: '10 15% 6%',
      cardForeground: '30 20% 90%',
      popover: '10 15% 6%',
      popoverForeground: '30 20% 90%',
      primary: '14 80% 58%',
      primaryForeground: '0 0% 100%',
      secondary: '15 20% 14%',
      secondaryForeground: '30 20% 90%',
      muted: '15 20% 14%',
      mutedForeground: '20 10% 60%',
      accent: '15 20% 14%',
      accentForeground: '30 20% 90%',
      destructive: '0 63% 31%',
      destructiveForeground: '0 0% 98%',
      border: '15 20% 14%',
      input: '15 20% 14%',
      ring: '14 80% 58%',
    },
  },
}

// ============================================
// UI STORE
// ============================================
interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  themeConfig: ThemeConfig
  loading: boolean
}

function ensureThemeColors(colors: any, fallback: ThemeColors): ThemeColors {
  if (!colors || typeof colors !== 'object') return fallback
  const result = { ...fallback }
  for (const key of Object.keys(fallback) as Array<keyof ThemeColors>) {
    if (typeof colors[key] === 'string') {
      result[key] = colors[key]
    }
  }
  return result
}

function loadThemeConfig(): ThemeConfig {
  if (typeof window === 'undefined') return defaultThemeConfig
  try {
    const stored = localStorage.getItem('themeConfig')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Migrate old format: { colors } → { lightColors, darkColors }
      if (parsed.colors && !parsed.lightColors) {
        return {
          ...defaultThemeConfig,
          lightColors: ensureThemeColors(parsed.colors, defaultLightTheme),
          darkColors: defaultDarkTheme,
          radius: typeof parsed.radius === 'number' ? parsed.radius : 0.5,
          fontSans: parsed.fontSans || defaultThemeConfig.fontSans,
          fontMono: parsed.fontMono || defaultThemeConfig.fontMono,
        }
      }
      // Ensure all required fields exist with full validation
      return {
        lightColors: ensureThemeColors(parsed.lightColors, defaultLightTheme),
        darkColors: ensureThemeColors(parsed.darkColors, defaultDarkTheme),
        radius: typeof parsed.radius === 'number' ? parsed.radius : 0.5,
        fontSans: parsed.fontSans || defaultThemeConfig.fontSans,
        fontMono: parsed.fontMono || defaultThemeConfig.fontMono,
      }
    }
  } catch {}
  return defaultThemeConfig
}

export const uiStore = new Store<UIState>({
  sidebarOpen: true,
  theme: 'light',
  themeConfig: loadThemeConfig(),
  loading: false,
})

// UI actions
export const uiActions = {
  toggleSidebar: () => {
    uiStore.setState((state) => ({
      ...state,
      sidebarOpen: !state.sidebarOpen,
    }))
  },

  setTheme: (theme: UIState['theme']) => {
    uiStore.setState((state) => ({
      ...state,
      theme,
    }))
  },

  setThemeConfig: (config: Partial<ThemeConfig>) => {
    uiStore.setState((state) => {
      const newConfig = { ...state.themeConfig, ...config }
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeConfig', JSON.stringify(newConfig))
      }
      return { ...state, themeConfig: newConfig }
    })
  },

  setThemeColors: (colors: Partial<ThemeColors>) => {
    uiStore.setState((state) => {
      const isDark = state.theme === 'dark'
      const colorKey = isDark ? 'darkColors' : 'lightColors'
      const newConfig = { ...state.themeConfig, [colorKey]: { ...state.themeConfig[colorKey], ...colors } }
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeConfig', JSON.stringify(newConfig))
      }
      return { ...state, themeConfig: newConfig }
    })
  },

  setThemeColorsForMode: (mode: 'light' | 'dark', colors: Partial<ThemeColors>) => {
    uiStore.setState((state) => {
      const colorKey = mode === 'dark' ? 'darkColors' : 'lightColors'
      const newConfig = { ...state.themeConfig, [colorKey]: { ...state.themeConfig[colorKey], ...colors } }
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeConfig', JSON.stringify(newConfig))
      }
      return { ...state, themeConfig: newConfig }
    })
  },

  applyPresetTheme: (preset: string) => {
    const theme = presetThemes[preset]
    if (theme) {
      uiStore.setState((state) => {
        const newConfig = {
          ...state.themeConfig,
          lightColors: theme.light,
          darkColors: theme.dark,
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('themeConfig', JSON.stringify(newConfig))
        }
        return { ...state, themeConfig: newConfig }
      })
    }
  },

  resetTheme: () => {
    uiStore.setState((state) => {
      const newConfig = { ...defaultThemeConfig }
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeConfig', JSON.stringify(newConfig))
      }
      return { ...state, themeConfig: newConfig }
    })
  },

  setLoading: (loading: boolean) => {
    uiStore.setState((state) => ({
      ...state,
      loading,
    }))
  },
}
