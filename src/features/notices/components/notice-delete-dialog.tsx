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
import type { Notice } from '../types'

interface NoticeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: Notice | null
  onSubmit: () => void
  submitting: boolean
}

export function NoticeDeleteDialog({
  open,
  onOpenChange,
  notice,
  onSubmit,
  submitting,
}: NoticeDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Notice</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{notice?.title}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
