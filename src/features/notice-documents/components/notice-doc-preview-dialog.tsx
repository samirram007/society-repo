import { useEffect, useState } from 'react'
import { Download, ExternalLink, FileText, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocPreview } from '@/components/doc-preview'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { NoticeDocument } from '../types'
import { describeFileType, formatFileSize, triggerBrowserDownload } from '../utils'
import { orpc } from '@/server/client'

interface NoticeDocPreviewDialogProps {
  doc: NoticeDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optionally pass pre-fetched content (data URL) to avoid refetch */
  content?: string | null
}

/** Convert a base64 data URL into an object URL the browser can render natively */
function dataUrlToObjectUrl(dataUrl: string, mimeType: string): string {
  const [, payload] = dataUrl.split(',')
  if (!payload) return dataUrl
  if (dataUrl.includes(';base64')) {
    try {
      const binary = atob(payload)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return URL.createObjectURL(new Blob([bytes], { type: mimeType }))
    } catch {
      return dataUrl
    }
  }
  return URL.createObjectURL(new Blob([decodeURIComponent(payload)], { type: mimeType }))
}

/**
 * In-app preview for documents:
 * - Images render inline
 * - PDFs open in an embedded viewer (data URLs are converted to blob URLs
 *   for reliable iframe rendering)
 * - Text renders as-is
 * - Anything else offers download / open original
 */
export function NoticeDocPreviewDialog({ doc, open, onOpenChange, content }: NoticeDocPreviewDialogProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !doc) {
      setDataUrl(null)
      setError(null)
      return
    }
    if (content) {
      setDataUrl(content)
      return
    }
    let cancelled = false
    let revoke: string | null = null
    setLoading(true)
    setError(null)
    orpc.noticeDocuments.download({ id: doc.id })
      .then((res: { data: string | null; url: string | null; mimeType?: string | null }) => {
        if (cancelled) return
        const mime = res.mimeType || doc.mimeType || 'application/octet-stream'
        if (res.url) {
          setDataUrl(res.url)
        } else if (res.data) {
          if (res.data.startsWith('data:')) {
            // Blob URLs render far more reliably inside iframes (esp. PDFs)
            revoke = dataUrlToObjectUrl(res.data, mime)
            setDataUrl(revoke)
          } else {
            setDataUrl(res.data)
          }
        } else {
          setError('No file content available')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load document')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [open, doc, content])

  if (!doc) return null

  const isRemote = !!dataUrl && dataUrl.startsWith('http')

  const handleDownload = () => {
    if (!dataUrl) return
    if (isRemote) {
      window.open(dataUrl, '_blank')
    } else {
      triggerBrowserDownload(dataUrl, doc.fileName || doc.title, doc.mimeType || 'application/octet-stream')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {doc.title}
          </DialogTitle>
          <DialogDescription>
            {describeFileType(doc.mimeType, doc.fileName)} · {formatFileSize(doc.fileSize)}
            {doc.visibility === 'private' && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Lock className="inline h-3 w-3" /> Private
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-auto rounded-md border bg-muted/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Loading preview…</p>
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{error}</p>
          ) : (
            <DocPreview
              src={dataUrl}
              mimeType={doc.mimeType}
              fileName={doc.fileName || doc.title}
            />
          )}
        </div>

        <DialogFooter>
          {doc.fileUrl && (
            <Button variant="outline" onClick={() => window.open(doc.fileUrl!, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open original
            </Button>
          )}
          <Button onClick={handleDownload} disabled={!dataUrl}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
