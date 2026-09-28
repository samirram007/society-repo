import { useEffect, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { orpc } from '@/server/client'
import { cn } from '@/lib/utils'
import { docIcon } from './notice-doc-card'
import type { NoticeDocument } from '../types'

interface NoticeAttachmentsIndicatorProps {
  noticeId: number
  /** Show image thumbnails + file chips inline (used on notice cards) */
  showThumbnails?: boolean
  /** Max items to render before showing a +N overflow */
  maxThumbnails?: number
  /** Called when count loads, so parents can react (e.g. show filter) */
  onCountLoaded?: (count: number) => void
  /** Called when any attachment (photo or file chip) is clicked */
  onThumbnailClick?: (doc: NoticeDocument) => void
}

/**
 * Attachments strip for a notice:
 * - photos render as image thumbnails
 * - files (PDF, Word, zip...) render as clickable file chips
 * Clicking anything calls onThumbnailClick -> preview dialog.
 * Renders nothing when there are none.
 */
export function NoticeAttachmentsIndicator({
  noticeId,
  showThumbnails,
  maxThumbnails = 6,
  onCountLoaded,
  onThumbnailClick,
}: NoticeAttachmentsIndicatorProps) {
  const [docs, setDocs] = useState<NoticeDocument[] | null>(null)

  useEffect(() => {
    let cancelled = false
    orpc.noticeDocuments
      .list({ noticeId })
      .then((data: NoticeDocument[]) => {
        if (!cancelled) {
          setDocs(data || [])
          onCountLoaded?.(data?.length ?? 0)
        }
      })
      .catch(() => {
        if (!cancelled) setDocs([])
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticeId])

  if (docs === null || docs.length === 0) return null

  const overflow = docs.length - maxThumbnails
  const visible = docs.slice(0, maxThumbnails)

  if (!showThumbnails) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Paperclip className="h-3 w-3" />
        {docs.length} {docs.length === 1 ? 'doc' : 'docs'}
      </span>
    )
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((doc) => {
          const isImage = doc.docType === 'photo' || doc.mimeType?.startsWith('image/')
          const Icon = docIcon(doc.mimeType, doc.fileName, doc.docType)

          if (isImage) {
            return (
              <button
                key={doc.id}
                type="button"
                className="group relative h-14 w-14 overflow-hidden rounded-md border bg-muted transition-opacity hover:opacity-85"
                title={doc.title}
                onClick={() => onThumbnailClick?.(doc)}
              >
                {doc.thumbnailData || doc.fileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.thumbnailData || doc.fileUrl!}
                    alt={doc.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    IMG
                  </span>
                )}
              </button>
            )
          }

          // Non-image file chip (PDF, Word, zip, link, note...)
          return (
            <button
              key={doc.id}
              type="button"
              title={`Open ${doc.title}`}
              onClick={() => onThumbnailClick?.(doc)}
              className="inline-flex max-w-[190px] items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-xs shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  doc.docType === 'link' && 'text-blue-500',
                  doc.docType === 'note' && 'text-amber-500'
                )}
              />
              <span className="truncate font-medium">{doc.title}</span>
            </button>
          )
        })}
        {overflow > 0 && (
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground hover:bg-muted/70"
            title={`${overflow} more attachment(s)`}
            onClick={() => onThumbnailClick?.(docs[maxThumbnails])}
          >
            +{overflow}
          </button>
        )}
      </div>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Paperclip className="h-3 w-3" />
        {docs.length} {docs.length === 1 ? 'doc' : 'docs'}
      </span>
    </div>
  )
}
