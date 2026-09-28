import { useState } from 'react'
import { FileStack, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NoticeDocumentsSection } from '@/features/notice-documents/components/notice-documents-section'
import { NoticeShareDialog } from '@/features/notice-documents/components/notice-share-dialog'
import type { Notice } from '../types'

interface NoticeDocumentsManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: Notice | null
}

/**
 * "Manage" dialog for a notice: tabs for Documents (upload/preview/delete)
 * and Sharing (public links). Read-only view of the notice for context.
 */
export function NoticeDocumentsManagerDialog({
  open,
  onOpenChange,
  notice,
}: NoticeDocumentsManagerDialogProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'public'>(
    notice?.visibility === 'public' ? 'public' : 'private'
  )

  if (!notice) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileStack className="h-4 w-4" />
              Documents & Sharing
            </DialogTitle>
            <DialogDescription className="truncate">{notice.title}</DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Tabs defaultValue="documents">
              <TabsList className="w-full">
                <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
                <TabsTrigger value="sharing" className="flex-1">Sharing</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-3">
                <NoticeDocumentsSection noticeId={notice.id} />
              </TabsContent>

              <TabsContent value="sharing" className="mt-3">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {visibility === 'public'
                      ? 'This notice is public. Generate a link to share it with anyone — even people without a portal account.'
                      : 'This notice is private. Share links only work for public notices.'}
                  </p>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      {visibility === 'public' ? (
                        <Link2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <FileStack className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {visibility === 'public' ? 'Public notice' : 'Private notice'}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => setShareOpen(true)}>
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                      Manage share links
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <NoticeShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        noticeId={notice.id}
        noticeTitle={notice.title}
        visibility={notice.visibility === 'public' ? 'public' : 'private'}
      />
    </>
  )
}
