import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileSpreadsheet,
  Link2,
  StickyNote,
  Star,
  Download,
  Trash2,
  Globe,
  Lock,
  Eye,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { NoticeDocument } from '../types'
import { describeFileType, formatFileSize, formatDate } from '../utils'

interface NoticeDocCardProps {
  doc: NoticeDocument
  onPreview: (doc: NoticeDocument) => void
  onDownload: (doc: NoticeDocument) => void
  onDelete: (doc: NoticeDocument) => void
  onToggleStar?: (doc: NoticeDocument) => void
  onToggleVisibility?: (doc: NoticeDocument) => void
  disabled?: boolean
}

/** Pick the right icon for a document */
export function docIcon(mimeType: string | null | undefined, fileName: string | null | undefined, docType?: string | null) {
  if (docType === 'link') return Link2
  if (docType === 'note') return StickyNote
  const described = describeFileType(mimeType, fileName)
  if (described === 'Image') return ImageIcon
  if (described === 'PDF' || described === 'Word' || described === 'Text') return FileText
  if (described === 'Archive') return FileArchive
  if (described === 'Spreadsheet') return FileSpreadsheet
  return FileIcon
}

export function NoticeDocCard({
  doc,
  onPreview,
  onDownload,
  onDelete,
  onToggleStar,
  onToggleVisibility,
  disabled,
}: NoticeDocCardProps) {
  const Icon = docIcon(doc.mimeType, doc.fileName, doc.docType)
  const isPublic = doc.visibility === 'public'

  return (
    <Card className={cn('group relative overflow-hidden', isPublic && 'border-emerald-300/60 dark:border-emerald-800')}>
      <CardContent className="flex items-center gap-3 p-3">
        {/* Icon / thumbnail */}
        <button
          type="button"
          onClick={() => onPreview(doc)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          title="Preview"
        >
          <Icon className="h-5 w-5" />
        </button>

        {/* Meta */}
        <button
          type="button"
          onClick={() => onPreview(doc)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{doc.title}</span>
            {doc.isStarred && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>{describeFileType(doc.mimeType, doc.fileName)}</span>
            <span>·</span>
            <span>{formatFileSize(doc.fileSize)}</span>
            <span>·</span>
            <span>{formatDate(doc.createdAt)}</span>
            {doc.version != null && doc.version > 1 && <span>· v{doc.version}</span>}
          </div>
        </button>

        {/* Badges */}
        <div className="hidden items-center gap-1 sm:flex">
          {isPublic ? (
            <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <Globe className="mr-1 h-3 w-3" /> Public
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Lock className="mr-1 h-3 w-3" /> Private
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {onToggleVisibility && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={isPublic ? 'Make private' : 'Make public (shareable)'}
              disabled={disabled}
              onClick={() => onToggleVisibility(doc)}
            >
              {isPublic ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            </Button>
          )}
          {onToggleStar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={doc.isStarred ? 'Unstar' : 'Star'}
              disabled={disabled}
              onClick={() => onToggleStar(doc)}
            >
              <Star className={cn('h-4 w-4', doc.isStarred && 'fill-amber-400 text-amber-400')} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Download"
            disabled={disabled}
            onClick={() => onDownload(doc)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            title="Delete"
            disabled={disabled}
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Preview"
            disabled={disabled}
            onClick={() => onPreview(doc)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
