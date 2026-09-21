import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MemberPicker } from '@/components/member-picker'
import type { NoticeFormData } from '../types'

interface NoticeFormFieldsProps {
  formData: NoticeFormData
  formErrors: Record<string, string>
  onChange: (updates: Partial<NoticeFormData>) => void
}

export function NoticeFormFields({ formData, formErrors, onChange }: NoticeFormFieldsProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Enter notice title"
          className={formErrors.title ? 'border-destructive' : ''}
        />
        {formErrors.title && (
          <p className="text-xs text-destructive">{formErrors.title}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Content *</Label>
        <textarea
          value={formData.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter notice content"
          className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.content ? 'border-destructive' : ''}`}
        />
        {formErrors.content && (
          <p className="text-xs text-destructive">{formErrors.content}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select value={formData.priority} onValueChange={(val) => onChange({ priority: val })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <MemberPicker
        value={formData.postedBy}
        onChange={(v) => onChange({ postedBy: v })}
        label="Posted By"
        placeholder="Select member posting this notice"
      />
    </div>
  )
}
