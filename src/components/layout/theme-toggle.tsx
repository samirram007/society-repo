import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

interface ThemeToggleProps {
  variant?: 'sidebar' | 'header'
  collapsed?: boolean
}

export function ThemeToggle({ variant = 'sidebar', collapsed = false }: ThemeToggleProps) {
  const { mode, setTheme, mounted } = useTheme()

  const cycleTheme = () => {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
    setTheme(next)
  }

  const themeIcon = !mounted ? Monitor : mode === 'system' ? Monitor : mode === 'dark' ? Moon : Sun
  const themeLabel = !mounted ? 'System' : mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'

  if (variant === 'sidebar') {
    if (collapsed) {
      return (
        <button
          onClick={cycleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={`${themeLabel} mode (click to cycle)`}
        >
          {mounted ? React.createElement(themeIcon, { className: 'h-4 w-4' }) : <Monitor className="h-4 w-4" />}
        </button>
      )
    }
    return (
      <div className="px-3">
        {mounted ? (
          <button
            onClick={cycleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
            title={`Current: ${themeLabel} mode (click to cycle)`}
          >
            {React.createElement(themeIcon, { className: 'h-4 w-4' })}
            {themeLabel} Mode
          </button>
        ) : (
          <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground">
            <Monitor className="h-4 w-4" />
            System Mode
          </div>
        )}
      </div>
    )
  }

  // Header variant
  return (
    <button
      onClick={cycleTheme}
      className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      title={`${themeLabel} mode`}
    >
      {React.createElement(themeIcon, { className: 'h-4 w-4' })}
    </button>
  )
}
