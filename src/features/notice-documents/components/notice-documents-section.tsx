import { useState } from 'react'
import { FileStack, Loader2, Trash2, FolderPlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCurrentUser } from '@/hooks/auth'
import { orpc } from '@/server/client'
import { useNoticeDocuments, useNoticeDocumentActions } from '../hooks'
import { NoticeDocDropzone } from './notice-doc-dropzone'
import { NoticeDocCard } from './notice-doc-card'
import { NoticeDocPreviewDialog } from './notice-doc-preview-dialog'
import { triggerBrowserDownload } from '../utils'
import type { NoticeDocument, PendingDocument } from '../types'

interface NoticeDocumentsSectionProps {
  noticeId: number
  /** Fold the upload area by default (e.g. inside dialogs) */
  collapsible?: boolean
  defaultCollapsed?: boolean
}

/**
 * The core DMS panel for one notice:
 * drag & drop upload area + document list + preview.
 * Reusable anywhere a notice is displayed.
 */
export function NoticeDocumentsSection({ noticeId, collapsible, defaultCollapsed }: NoticeDocumentsSectionProps) {
  const { data: currentUser } = useCurrentUser()
  const { documents, loading, reload } = useNoticeDocuments(noticeId)
  const { createDocuments, deleteDocument, toggleStar, setDocumentVisibility } = useNoticeDocumentActions(noticeId)

  const [pending, setPending] = useState<PendingDocument[]>([])
  const [saving, setSaving] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<NoticeDocument | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteDoc, setDeleteDoc] = useState<NoticeDocument | null>(null)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const uploadedBy = currentUser?.id ?? 1

  const handleAddPending = (docs: PendingDocument[]) => {
    setPending((prev) => [...prev, ...docs])
  }

  const handleRemovePending = (id: string) => {
    setPending((prev) => prev.filter((d) => d.id !== id))
  }

  const handleSavePending = async () => {
    if (pending.length === 0) return
    setSaving(true)
    try {
      await createDocuments(pending)
      setPending([])
      reload()
    } catch (error) {
      console.error('Failed to save documents:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (doc: NoticeDocument) => {
    try {
      const res = await orpc.noticeDocuments.download({ id: doc.id })
      if (res.url) {
        window.open(res.url, '_blank')
      } else if (res.data) {
        triggerBrowserDownload(res.data, doc.fileName || doc.title, doc.mimeType || 'application/octet-stream')
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleToggleVisibility = async (doc: NoticeDocument) => {
    try {
      await setDocumentVisibility(doc.id, doc.visibility === 'public' ? 'private' : 'public')
      reload()
    } catch (error) {
      console.error('Failed to change visibility:', error)
    }
  }

  const handleToggleStar = async (doc: NoticeDocument) => {
    try {
      await toggleStar(doc.id)
      reload()
    } catch (error) {
      console.error('Failed to toggle star:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteDoc) return
    try {
      await deleteDocument(deleteDoc.id)
      reload()
    } catch (error) {
      console.error('Failed to delete document:', error)
    } finally {
      setDeleteDoc(null)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await orpc.noticeDocumentFolders.create({ societyId: 1, name: newFolderName.trim() })
      setNewFolderName('')
      setFolderDialogOpen(false)
      reload()
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const hasPending = pending.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FileStack className="h-4 w-4" />
          Documents
          <span className="text-xs font-normal text-muted-foreground">
            ({documents.length})
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus className="mr-1 h-3.5 w-3.5" />
            New Folder
          </Button>
        </div>
      </div>

      <NoticeDocDropzone uploadedBy={uploadedBy} onFilesAdded={handleAddPending} compact />

      {/* Pending uploads */}
      {hasPending && (
        <div className="space-y-1 rounded-md border border-dashed p-2">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
              <span className="truncate">{p.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {(p.size / 1024).toFixed(0)} KB
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemovePending(p.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setPending([])}>
              Clear
              </Button>
            <Button size="sm" onClick={handleSavePending} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Upload {pending.length} file{pending.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 && !hasPending ? (
        <p className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">
          No documents attached yet. Drop files above to attach them.
        </p>
      ) : (
        <div className="grid gap-2">
          {documents.map((doc) => (
            <NoticeDocCard
              key={doc.id}
              doc={doc}
              onPreview={(d) => {
                setPreviewDoc(d)
                setPreviewOpen(true)
              }}
              onDownload={handleDownload}
              onDelete={setDeleteDoc}
              onToggleStar={handleToggleStar}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <NoticeDocPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        doc={previewDoc}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteDoc} onOpenChange={(o) => { if (!o) setDeleteDoc(null) }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              "{deleteDoc?.title}" will be removed from this notice. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>Group related documents together</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Folder name</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Invoices 2026"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
