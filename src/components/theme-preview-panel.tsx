import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Palette, ArrowUpRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { uiStore, uiActions, presetThemes, type ThemeConfig, type ThemeColors } from '@/lib/store'

// Resolve a ThemeColors value to its CSS color string
function resolveColor(val: string | undefined): string {
  if (!val) return 'transparent'
  // Already a full CSS color
  if (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl')) return val
  // HSL triplet like "222.2 47.4% 11.2%"
  return `hsl(${val})`
}

// Color swatch square
function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="h-8 w-8 rounded-md border shadow-sm"
        style={{ backgroundColor: resolveColor(color) }}
        title={color}
      />
      <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
    </div>
  )
}

// Detect which preset is active (if any)
function detectPreset(config: ThemeConfig): string | null {
  for (const [key, preset] of Object.entries(presetThemes)) {
    const lightMatch = Object.entries(preset.light).every(
      ([k, v]) => config.lightColors[k as keyof ThemeColors] === v
    )
    const darkMatch = Object.entries(preset.dark).every(
      ([k, v]) => config.darkColors[k as keyof ThemeColors] === v
    )
    if (lightMatch && darkMatch) return key
  }
  return null
}

export function ThemePreviewPanel() {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system')
  const [config, setConfig] = useState<ThemeConfig>(uiStore.get().themeConfig)

  useEffect(() => {
    setMounted(true)
    try {
      setMode((localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system')
    } catch {}
  }, [])

  // Subscribe to store changes
  useEffect(() => {
    if (!mounted) return
    const subscription = uiStore.subscribe(() => {
      setConfig(uiStore.get().themeConfig)
    })
    return () => subscription.unsubscribe()
  }, [mounted])

  const resolvedMode = !mounted ? 'light' : mode === 'system'
    ? (config as any).__resolved || 'light'
    : mode

  const activeColors = resolvedMode === 'dark' ? config.darkColors : config.lightColors
  const presetKey = detectPreset(config)
  const presetLabel = presetKey ? presetThemes[presetKey]?.label : 'Custom'

  const cycleMode = () => {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
    setMode(next)
    try { localStorage.setItem('theme', next) } catch {}
    // Resolve and apply
    const resolved = next === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : next
    uiActions.setTheme(resolved)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Theme</CardTitle>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings">
            Customize
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          {[
            { value: 'light' as const, icon: Sun, label: 'Light' },
            { value: 'dark' as const, icon: Moon, label: 'Dark' },
            { value: 'system' as const, icon: Monitor, label: 'Auto' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => {
                setMode(value)
                try { localStorage.setItem('theme', value) } catch {}
                const resolved = value === 'system'
                  ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                  : value
                uiActions.setTheme(resolved)
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Current Preset */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Preset:</span>
          <Badge variant={presetKey ? 'default' : 'secondary'} className="text-xs">
            {presetLabel}
          </Badge>
        </div>

        {/* Color Swatches */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Active Colors ({resolvedMode} mode)</p>
          <div className="flex gap-3 flex-wrap">
            <Swatch label="Primary" color={activeColors.primary} />
            <Swatch label="Background" color={activeColors.background} />
            <Swatch label="Card" color={activeColors.card} />
            <Swatch label="Muted" color={activeColors.muted} />
            <Swatch label="Accent" color={activeColors.accent} />
            <Swatch label="Destructive" color={activeColors.destructive} />
            <Swatch label="Border" color={activeColors.border} />
            <Swatch label="Ring" color={activeColors.ring} />
          </div>
        </div>

        {/* Quick Preset Switcher */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Quick Presets</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(presetThemes).slice(0, 6).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  uiActions.applyPresetTheme(key)
                  setConfig(uiStore.get().themeConfig)
                }}
                className={`group flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  presetKey === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
                title={`Apply ${preset.label} theme`}
              >
                {/* Mini dual-swatch */}
                <div className="flex -space-x-1">
                  <div
                    className="h-3 w-3 rounded-full border border-white/50"
                    style={{ backgroundColor: resolveColor(preset.light.primary) }}
                  />
                  <div
                    className="h-3 w-3 rounded-full border border-white/50"
                    style={{ backgroundColor: resolveColor(preset.dark.primary) }}
                  />
                </div>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Mini Preview */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <div
            className="rounded-lg border p-3 space-y-2"
            style={{
              backgroundColor: resolveColor(activeColors.background),
              borderColor: resolveColor(activeColors.border),
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: resolveColor(activeColors.primary),
                  color: resolveColor(activeColors.primaryForeground),
                }}
              >
                S
              </div>
              <span style={{ color: resolveColor(activeColors.foreground) }} className="text-xs font-semibold">
                Sample Card
              </span>
            </div>
            <p className="text-[10px]" style={{ color: resolveColor(activeColors.mutedForeground) }}>
              This is a preview of how your theme colors look together.
            </p>
            <div className="flex gap-2">
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: resolveColor(activeColors.primary),
                  color: resolveColor(activeColors.primaryForeground),
                }}
              >
                Primary
              </span>
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: resolveColor(activeColors.muted),
                  color: resolveColor(activeColors.mutedForeground),
                }}
              >
                Muted
              </span>
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: resolveColor(activeColors.destructive),
                  color: resolveColor(activeColors.destructiveForeground),
                }}
              >
                Destructive
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
