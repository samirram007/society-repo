import { Globe, Lock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { visibilityConfig, type NoticeVisibility } from '../types'

interface NoticeVisibilitySelectProps {
  value: NoticeVisibility
  onChange: (value: NoticeVisibility) => void
}

/**
 * Private = portal members only (default).
 * Public = shareable externally via link.
 */
export function NoticeVisibilitySelect({ value, onChange }: NoticeVisibilitySelectProps) {
  return (
    <div className="space-y-2">
      <Label>Visibility</Label>
      <Select value={value} onValueChange={(v) => onChange(v as NoticeVisibility)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="private">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              Private — portal members only
            </span>
          </SelectItem>
          <SelectItem value="public">
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Public — shareable via link
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{visibilityConfig[value].description}</p>
    </div>
  )
}
