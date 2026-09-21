import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NoticeFormFields } from './notice-form-fields'
import type { NoticeFormData } from '../types'

interface NoticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NoticeFormData
  formErrors: Record<string, string>
  onChange: (updates: Partial<NoticeFormData>) => void
  onSubmit: () => void
  submitting: boolean
}

export function NoticeCreateDialog({
  open,
  onOpenChange,
  formData,
  formErrors,
  onChange,
  onSubmit,
  submitting,
}: NoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Post Notice</DialogTitle>
          <DialogDescription>Create a new notice for society members</DialogDescription>
        </DialogHeader>
        <NoticeFormFields formData={formData} formErrors={formErrors} onChange={onChange} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.title || !formData.content || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Notice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NoticeEditDialog({
  open,
  onOpenChange,
  formData,
  formErrors,
  onChange,
  onSubmit,
  submitting,
}: NoticeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Notice</DialogTitle>
          <DialogDescription>Update notice details</DialogDescription>
        </DialogHeader>
        <NoticeFormFields formData={formData} formErrors={formErrors} onChange={onChange} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.title || !formData.content || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Notice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
