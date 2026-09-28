import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MemberPicker } from '@/components/member-picker'
import { NoticeVisibilitySelect } from '@/features/notice-documents/components/notice-visibility-select'
import { NoticeDocDropzone } from '@/features/notice-documents/components/notice-doc-dropzone'
import { TowerPicker } from './tower-picker'
import { useCurrentUser } from '@/hooks/auth'
import type { NoticeCategory, NoticeFormData, NoticeTargetAudience } from '../types'

const categoryOptions: { value: NoticeCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'event', label: 'Event' },
  { value: 'security', label: 'Security' },
  { value: 'rule', label: 'Rule' },
]

const audienceOptions: { value: NoticeTargetAudience; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'owners', label: 'Owners' },
  { value: 'tenants', label: 'Tenants' },
  { value: 'committee', label: 'Committee' },
  { value: 'specific_tower', label: 'Specific Tower' },
]

interface NoticeFormFieldsProps {
  formData: NoticeFormData
  formErrors: Record<string, string>
  onChange: (updates: Partial<NoticeFormData>) => void
}

export function NoticeFormFields({ formData, formErrors, onChange }: NoticeFormFieldsProps) {
  const { data: currentUser } = useCurrentUser()

  const removeAttachment = (id: string) =>
    onChange({ attachments: formData.attachments.filter((a) => a.id !== id) })

  return (
    <div className="space-y-3 py-3">
      <div className="space-y-1.5">
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
      <div className="space-y-1.5">
        <Label>Content *</Label>
        <textarea
          value={formData.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Enter notice content"
          rows={3}
          className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.content ? 'border-destructive' : ''}`}
        />
        {formErrors.content && (
          <p className="text-xs text-destructive">{formErrors.content}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Photos & Attachments</Label>
        <NoticeDocDropzone
          uploadedBy={currentUser?.id ?? 1}
          onFilesAdded={(docs) => onChange({ attachments: [...formData.attachments, ...docs] })}
          compact
        />
        {formData.attachments.length > 0 && (
          <div className="space-y-1">
            {formData.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
              >
                {att.docType === 'photo' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.data}
                    alt={att.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium uppercase">
                    {att.name.split('.').pop()?.slice(0, 4) || 'file'}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate" title={att.name}>{att.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {att.size > 1024 * 1024
                    ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.max(1, Math.round(att.size / 1024))} KB`}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeAttachment(att.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Images, PDFs and documents are attached to this notice and uploaded when you save.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={formData.category}
            onValueChange={(val) => onChange({ category: val as NoticeCategory })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
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
      </div>
      <div className="space-y-1.5">
        <Label>Target Audience</Label>
        <Select
          value={formData.targetAudience}
          onValueChange={(val) => {
            const next = val as NoticeTargetAudience
            // Reset tower selection when leaving specific_tower mode
            onChange({
              targetAudience: next,
              ...(next === 'specific_tower' ? {} : { targetTowers: [] }),
            })
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {audienceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose who this notice is visible to
        </p>
      </div>
      {formData.targetAudience === 'specific_tower' && (
        <TowerPicker
          value={formData.targetTowers}
          onChange={(towerIds) => onChange({ targetTowers: towerIds })}
        />
      )}
      <MemberPicker
        value={formData.postedBy}
        onChange={(v) => onChange({ postedBy: v })}
        label="Posted By"
        placeholder="Select member posting this notice"
      />
      <NoticeVisibilitySelect
        value={formData.visibility}
        onChange={(v) => onChange({ visibility: v })}
      />
    </div>
  )
}
