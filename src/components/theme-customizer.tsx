import { useState, useRef, useCallback, useMemo } from 'react'
import { useStore } from '@tanstack/react-store'
import {
  uiStore,
  uiActions,
  presetThemes,
  defaultLightTheme,
  defaultThemeConfig,
  type ThemeColors,
  type ThemeConfig,
} from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  RotateCcw,
  Palette,
  Type,
  Circle,
  Check,
  Sun,
  Moon,
  Download,
  Upload,
  Copy,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'

// ============================================
// UTILS
// ============================================
function hslToHex(hsl: string): string {
  const parts = hsl.split(' ').map(Number)
  if (parts.length < 3) return '#000000'
  const [h, s, l] = parts
  const sNorm = s / 100
  const lNorm = l / 100
  const a = sNorm * Math.min(lNorm, 1 - lNorm)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function relativeLuminance(hsl: string): number {
  const [h, s, l] = hsl.split(' ').map(Number)
  const sNorm = s / 100
  const lNorm = l / 100
  // Convert HSL to RGB linear
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm
  const p = 2 * lNorm - q
  const r = hue2rgb(p, q, h / 360 + 1 / 3)
  const g = hue2rgb(p, q, h / 360)
  const b = hue2rgb(p, q, h / 360 - 1 / 3)
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastRatio(hsl1: string, hsl2: string): number {
  const l1 = relativeLuminance(hsl1)
  const l2 = relativeLuminance(hsl2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getContrastLevel(ratio: number): { label: string; color: string } {
  if (ratio >= 7) return { label: 'AAA', color: 'text-emerald-600' }
  if (ratio >= 4.5) return { label: 'AA', color: 'text-emerald-600' }
  if (ratio >= 3) return { label: 'AA Large', color: 'text-amber-600' }
  return { label: 'Fail', color: 'text-destructive' }
}

// ============================================
// COLOR LABELS & GROUPS
// ============================================
const colorLabels: Record<keyof ThemeColors, string> = {
  background: 'Background',
  foreground: 'Foreground',
  card: 'Card',
  cardForeground: 'Card Foreground',
  popover: 'Popover',
  popoverForeground: 'Popover Foreground',
  primary: 'Primary',
  primaryForeground: 'Primary Foreground',
  secondary: 'Secondary',
  secondaryForeground: 'Secondary Foreground',
  muted: 'Muted',
  mutedForeground: 'Muted Foreground',
  accent: 'Accent',
  accentForeground: 'Accent Foreground',
  destructive: 'Destructive',
  destructiveForeground: 'Destructive Foreground',
  border: 'Border',
  input: 'Input',
  ring: 'Ring',
}

const colorGroups = [
  { title: 'Base', icon: '🎨', colors: ['background', 'foreground'] as const, description: 'Main page background and text' },
  { title: 'Card', icon: '🃏', colors: ['card', 'cardForeground'] as const, description: 'Card surfaces' },
  { title: 'Primary', icon: '🔵', colors: ['primary', 'primaryForeground'] as const, description: 'Main action buttons & links' },
  { title: 'Secondary', icon: '⚪', colors: ['secondary', 'secondaryForeground'] as const, description: 'Secondary buttons & badges' },
  { title: 'Muted', icon: '🩶', colors: ['muted', 'mutedForeground'] as const, description: 'Subtle backgrounds & placeholders' },
  { title: 'Accent', icon: '✨', colors: ['accent', 'accentForeground'] as const, description: 'Hover states & highlights' },
  { title: 'Destructive', icon: '🔴', colors: ['destructive', 'destructiveForeground'] as const, description: 'Error buttons & alerts' },
  { title: 'Borders & Inputs', icon: '🔲', colors: ['border', 'input', 'ring'] as const, description: 'Borders, input fields & focus rings' },
  { title: 'Popover', icon: '💬', colors: ['popover', 'popoverForeground'] as const, description: 'Dropdowns, dialogs & tooltips' },
]

// ============================================
// HSL SLIDER COMPONENT
// ============================================
function HslSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 360,
  step = 1,
  unit = '',
  gradient,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  gradient?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-mono text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer rounded-full appearance-none"
        style={{
          background: gradient || '#ccc',
        }}
      />
    </div>
  )
}

// ============================================
// COLOR PICKER WITH HSL SLIDERS
// ============================================
function AdvancedColorPicker({
  label,
  value,
  onChange,
  defaultVal,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  defaultVal?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const parts = value.split(' ').map(Number)
  const [h = 0, s = 0, l = 0] = parts

  const updateHsl = useCallback(
    (key: 'h' | 's' | 'l', val: number) => {
      const newParts = [h, s, l]
      if (key === 'h') newParts[0] = val
      if (key === 's') newParts[1] = val
      if (key === 'l') newParts[2] = val
      onChange(`${newParts[0]} ${newParts[1]}% ${newParts[2]}%`)
    },
    [h, s, l, onChange]
  )

  const hex = hslToHex(value)

  // Hue gradient: full rainbow at current saturation/lightness
  const hueGradient = `linear-gradient(to right, 
    hsl(0,${s}%,${l}%),hsl(60,${s}%,${l}%),hsl(120,${s}%,${l}%),
    hsl(180,${s}%,${l}%),hsl(240,${s}%,${l}%),hsl(300,${s}%,${l}%),hsl(360,${s}%,${l}%))`

  // Saturation gradient
  const satGradient = `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`

  // Lightness gradient
  const lightGradient = `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`

  return (
    <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-sm">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3"
      >
        {/* Color swatch */}
        <div
          className="h-10 w-10 shrink-0 rounded-lg border shadow-inner"
          style={{ backgroundColor: `hsl(${value})` }}
        />
        {/* Label and value */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs font-mono text-muted-foreground truncate">{value}</p>
        </div>
        {/* Hex badge */}
        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
          {hex}
        </Badge>
        {/* Expand icon */}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded: HSL sliders + hex input */}
      {expanded && (
        <div className="mt-3 space-y-3 border-t pt-3">
          {/* Hue */}
          <HslSlider
            label="Hue"
            value={h}
            onChange={(v) => updateHsl('h', v)}
            min={0}
            max={360}
            unit="°"
            gradient={hueGradient}
          />
          {/* Saturation */}
          <HslSlider
            label="Saturation"
            value={s}
            onChange={(v) => updateHsl('s', v)}
            min={0}
            max={100}
            unit="%"
            gradient={satGradient}
          />
          {/* Lightness */}
          <HslSlider
            label="Lightness"
            value={l}
            onChange={(v) => updateHsl('l', v)}
            min={0}
            max={100}
            unit="%"
            gradient={lightGradient}
          />
          {/* Hex input */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={hex}
              onChange={(e) => onChange(hexToHsl(e.target.value))}
              className="h-8 w-8 shrink-0 cursor-pointer rounded-md border appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 flex-1 text-xs font-mono"
              placeholder="H S% L%"
            />
            {defaultVal && value !== defaultVal && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onChange(defaultVal)}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// CONTRAST INDICATOR
// ============================================
function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const ratio = contrastRatio(fg, bg)
  const level = getContrastLevel(ratio)
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold"
        style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }}
      >
        Aa
      </div>
      <span className={`text-[10px] font-semibold ${level.color}`}>
        {ratio.toFixed(1)}:1 {level.label}
      </span>
    </div>
  )
}

// ============================================
// LIVE COMPONENT PREVIEW
// ============================================
function LivePreview({ colors, radius }: { colors: ThemeColors; radius: number }) {
  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{
        backgroundColor: `hsl(${colors.background})`,
        borderColor: `hsl(${colors.border})`,
        borderRadius: `${radius}rem`,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: `hsl(${colors.mutedForeground})` }}>
        Live Preview
      </p>

      {/* Card */}
      <div
        className="rounded-lg border p-4 space-y-3"
        style={{
          backgroundColor: `hsl(${colors.card})`,
          borderColor: `hsl(${colors.border})`,
          color: `hsl(${colors.cardForeground})`,
          borderRadius: `${radius}rem`,
        }}
      >
        <p className="text-sm font-semibold">Card Title</p>
        <p className="text-xs" style={{ color: `hsl(${colors.mutedForeground})` }}>
          This is how your cards will look with the current theme.
        </p>

        {/* Buttons row */}
        <div className="flex flex-wrap gap-2">
          <span
            className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium shadow"
            style={{
              backgroundColor: `hsl(${colors.primary})`,
              color: `hsl(${colors.primaryForeground})`,
              borderRadius: `${radius}rem`,
            }}
          >
            Primary
          </span>
          <span
            className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: `hsl(${colors.secondary})`,
              color: `hsl(${colors.secondaryForeground})`,
              borderRadius: `${radius}rem`,
            }}
          >
            Secondary
          </span>
          <span
            className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium shadow-sm"
            style={{
              backgroundColor: `hsl(${colors.destructive})`,
              color: `hsl(${colors.destructiveForeground})`,
              borderRadius: `${radius}rem`,
            }}
          >
            Destructive
          </span>
          <span
            className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: `hsl(${colors.muted})`,
              color: `hsl(${colors.mutedForeground})`,
              borderRadius: `${radius}rem`,
            }}
          >
            Muted
          </span>
        </div>

        {/* Input preview */}
        <div
          className="flex h-8 items-center rounded-md border px-3 text-xs"
          style={{
            borderColor: `hsl(${colors.border})`,
            color: `hsl(${colors.mutedForeground})`,
            borderRadius: `${radius}rem`,
          }}
        >
          Input field placeholder...
        </div>

        {/* Badge row */}
        <div className="flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: `hsl(${colors.accent})`,
              color: `hsl(${colors.accentForeground})`,
              borderRadius: `${radius}rem`,
            }}
          >
            Accent
          </span>
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: `hsl(${colors.primary})`,
              color: `hsl(${colors.primaryForeground})`,
              borderRadius: `${radius}rem`,
            }}
          >
            Primary
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PRESET THEME BUTTON
// ============================================
function PresetButton({
  name,
  preset,
  isActive,
  onClick,
}: {
  name: string
  preset: { label: string; light: ThemeColors; dark: ThemeColors }
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:bg-muted ${
        isActive ? 'border-primary shadow-sm' : 'border-transparent hover:border-border'
      }`}
    >
      {/* Color strip showing primary palette */}
      <div className="flex w-full gap-0.5 overflow-hidden rounded-md">
        <div className="h-6 flex-1" style={{ backgroundColor: `hsl(${preset.light.primary})` }} />
        <div className="h-6 flex-1" style={{ backgroundColor: `hsl(${preset.light.secondary})` }} />
        <div className="h-6 flex-1" style={{ backgroundColor: `hsl(${preset.light.accent})` }} />
        <div className="h-6 flex-1" style={{ backgroundColor: `hsl(${preset.dark.primary})` }} />
        <div className="h-6 flex-1" style={{ backgroundColor: `hsl(${preset.dark.secondary})` }} />
      </div>
      <span className="text-xs font-medium">{preset.label}</span>
      {isActive && <Check className="h-3 w-3 text-primary" />}
    </button>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ThemeCustomizer() {
  const [editMode, setEditMode] = useState<'light' | 'dark'>('light')
  const { themeConfig, theme } = useStore(uiStore, (s) => ({
    themeConfig: s.themeConfig,
    theme: s.theme,
  }))

  const activeColors = editMode === 'dark' ? themeConfig.darkColors : themeConfig.lightColors
  const defaultColors = editMode === 'dark' ? defaultThemeConfig.darkColors : defaultThemeConfig.lightColors

  // Check which preset is active
  const activePreset = useMemo(() => {
    return (
      Object.entries(presetThemes).find(([_, preset]) => {
        const compareColors = editMode === 'dark' ? preset.dark : preset.light
        return compareColors.primary === activeColors.primary
      })?.[0] ?? null
    )
  }, [activeColors, editMode])

  // Import/Export state
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(themeConfig, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `society-erp-theme-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(themeConfig, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportSuccess(false)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as ThemeConfig
        if (!json.lightColors || !json.darkColors) {
          setImportError('Invalid theme: missing lightColors or darkColors')
          return
        }
        const colorKeys = Object.keys(defaultLightTheme)
        if (!colorKeys.every((k) => Object.keys(json.lightColors).includes(k))) {
          setImportError('Invalid theme: lightColors is missing required keys')
          return
        }
        if (!colorKeys.every((k) => Object.keys(json.darkColors).includes(k))) {
          setImportError('Invalid theme: darkColors is missing required keys')
          return
        }
        uiActions.setThemeConfig({
          lightColors: json.lightColors,
          darkColors: json.darkColors,
          radius: json.radius ?? 0.5,
          fontSans: json.fontSans ?? defaultThemeConfig.fontSans,
          fontMono: json.fontMono ?? defaultThemeConfig.fontMono,
        })
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch {
        setImportError('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const setColor = useCallback(
    (key: keyof ThemeColors, val: string) => {
      uiActions.setThemeColorsForMode(editMode, { [key]: val } as Partial<ThemeColors>)
    },
    [editMode]
  )

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* PRESET THEMES */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Presets
          </CardTitle>
          <CardDescription>
            Start with a coordinated color scheme, then fine-tune
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
            {Object.entries(presetThemes).map(([name, preset]) => (
              <PresetButton
                key={name}
                name={name}
                preset={preset}
                isActive={activePreset === name}
                onClick={() => uiActions.applyPresetTheme(name)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* LIVE PREVIEW + MODE TOGGLE */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your theme looks on real components</CardDescription>
            </div>
            {/* Mode toggle */}
            <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted">
              <button
                onClick={() => setEditMode('light')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  editMode === 'light'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </button>
              <button
                onClick={() => setEditMode('dark')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  editMode === 'dark'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Side-by-side preview */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sun className="h-3 w-3" /> Light Mode
              </p>
              <LivePreview colors={themeConfig.lightColors} radius={themeConfig.radius} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Moon className="h-3 w-3" /> Dark Mode
              </p>
              <LivePreview colors={themeConfig.darkColors} radius={themeConfig.radius} />
            </div>
          </div>

          {/* Contrast indicators */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs font-semibold mb-2 text-muted-foreground">Accessibility (Contrast Ratios)</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ContrastBadge fg={activeColors.foreground} bg={activeColors.background} />
              <ContrastBadge fg={activeColors.cardForeground} bg={activeColors.card} />
              <ContrastBadge fg={activeColors.primaryForeground} bg={activeColors.primary} />
              <ContrastBadge fg={activeColors.destructiveForeground} bg={activeColors.destructive} />
              <ContrastBadge fg={activeColors.mutedForeground} bg={activeColors.muted} />
              <ContrastBadge fg={activeColors.secondaryForeground} bg={activeColors.secondary} />
              <ContrastBadge fg={activeColors.accentForeground} bg={activeColors.accent} />
              <ContrastBadge fg={activeColors.popoverForeground} bg={activeColors.popover} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* COLOR EDITOR */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Color Editor
          </CardTitle>
          <CardDescription>
            Editing <strong className="capitalize">{editMode}</strong> mode colors — expand any color to fine-tune with HSL sliders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {colorGroups.map((group) => (
            <div key={group.title}>
              <Separator className="mb-3" />
              <div className="mb-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span>{group.icon}</span> {group.title}
                </p>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.colors.map((key) => (
                  <AdvancedColorPicker
                    key={key}
                    label={colorLabels[key]}
                    value={activeColors[key]}
                    defaultVal={defaultColors[key]}
                    onChange={(val) => setColor(key, val)}
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* BORDER RADIUS */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" />
            Border Radius
          </CardTitle>
          <CardDescription>
            Adjust the global border radius ({themeConfig.radius}rem)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={themeConfig.radius}
              onChange={(e) => uiActions.setThemeConfig({ radius: Number(e.target.value) })}
              className="flex-1"
            />
            <Badge variant="secondary" className="min-w-[4rem] justify-center font-mono">
              {themeConfig.radius}rem
            </Badge>
          </div>
          {/* Visual radius samples */}
          <div className="flex items-end gap-3">
            {[0, 0.25, 0.5, 0.75, 1.0, 1.5].map((r) => (
              <button
                key={r}
                onClick={() => uiActions.setThemeConfig({ radius: r })}
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  themeConfig.radius === r ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                <div
                  className={`h-10 w-10 border-2 ${
                    themeConfig.radius === r ? 'border-primary' : 'border-border'
                  }`}
                  style={{ borderRadius: `${r}rem` }}
                />
                <span className={`text-[10px] font-mono ${themeConfig.radius === r ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {r}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* TYPOGRAPHY */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Typography
          </CardTitle>
          <CardDescription>Customize the font families</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sans-serif Font</Label>
            <Input
              value={themeConfig.fontSans}
              onChange={(e) => uiActions.setThemeConfig({ fontSans: e.target.value })}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: themeConfig.fontSans }}>
              The quick brown fox jumps over the lazy dog — Preview text
            </p>
          </div>
          <div className="space-y-2">
            <Label>Monospace Font</Label>
            <Input
              value={themeConfig.fontMono}
              onChange={(e) => uiActions.setThemeConfig({ fontMono: e.target.value })}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground" style={{ fontFamily: themeConfig.fontMono }}>
              const greeting = &quot;Hello, World!&quot; — Code preview
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* IMPORT / EXPORT */}
      {/* ============================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import / Export Theme
          </CardTitle>
          <CardDescription>
            Save your theme as a JSON file or load a previously saved theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export as JSON
            </Button>
            <Button variant="outline" onClick={handleCopyJson} className="w-full sm:w-auto">
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Import from JSON
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            {importError && <Badge variant="destructive" className="text-xs">{importError}</Badge>}
            {importSuccess && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Theme imported successfully
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* RESET */}
      {/* ============================================ */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => uiActions.resetTheme()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
