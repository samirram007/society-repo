import { useEffect, useState } from 'react'
import { Building2, Check, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { orpc } from '@/server/client'

interface TowerPickerProps {
  value: number[]
  onChange: (towerIds: number[]) => void
}

interface Tower {
  id: number
  name: string
  totalFloors: number | null
  flatsPerFloor: number | null
}

/**
 * Tower selection list shown when targetAudience = "specific_tower".
 * Loads towers from the society and lets the poster tick which towers
 * the notice applies to. Includes Select all / Clear shortcuts.
 */
export function TowerPicker({ value, onChange }: TowerPickerProps) {
  const [towers, setTowers] = useState<Tower[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    orpc.notices
      .listTowers({})
      .then((data: Tower[]) => {
        if (!cancelled) setTowers(data || [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading towers…
      </div>
    )
  }

  if (error || towers.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <Building2 className="mr-1.5 inline h-4 w-4" />
        No towers found. Add towers in Society Map first to target notices at them.
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">
          Share to which towers? ({value.length} selected)
        </Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange(towers.map((t) => t.id))}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange([])}
            disabled={value.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {towers.map((tower) => {
          const selected = value.includes(tower.id)
          return (
            <button
              key={tower.id}
              type="button"
              onClick={() => toggle(tower.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'bg-background hover:bg-muted/60'
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'
                )}
              >
                {selected && <Check className="h-3 w-3" />}
              </span>
              <Building2 className={cn('h-4 w-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
              <span className="min-w-0 flex-1 truncate font-medium">{tower.name}</span>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {tower.totalFloors ?? 0}F
              </Badge>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        This notice will only appear targeted to residents of the selected towers.
      </p>
    </div>
  )
}
