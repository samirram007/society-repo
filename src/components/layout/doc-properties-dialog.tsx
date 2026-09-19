import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  FolderOpen,
  Calendar,
  HardDrive,
  Tag,
  User,
  Download,
  Star,
  Clock,
  Info,
} from 'lucide-react'

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

function formatDate(d?: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const categoryColors: Record<string, string> = {
  society: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  management: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  financial: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  legal: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  personal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

interface FileProperties {
  id: number
  name: string
  type: 'file' | 'folder'
  description?: string | null
  category?: string
  mimeType?: string | null
  fileName?: string | null
  fileSize?: number | null
  tags?: string | null
  version?: number | null
  downloadCount?: number | null
  isStarred?: boolean
  createdAt?: string | null
  updatedAt?: string | null
  fileUrl?: string
  folderId?: number | null
  parentId?: number | null
  color?: string | null
  docCount?: number
  folderSize?: number
  children?: number
}

interface DocPropertiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: FileProperties | null
}

export function DocPropertiesDialog({ open, onOpenChange, properties }: DocPropertiesDialogProps) {
  if (!properties) return null

  const isFolder = properties.type === 'folder'
  const Icon = isFolder ? FolderOpen : FileText

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: isFolder ? `${properties.color || '#3b82f6'}15` : 'hsl(var(--muted))' }}
            >
              <Icon
                className="h-5 w-5"
                style={isFolder ? { color: properties.color || '#3b82f6' } : undefined}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{properties.name}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {isFolder ? 'Folder' : (properties.mimeType || 'File')}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">General</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              {!isFolder && properties.fileName && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">File Name</span>
                  <p className="font-medium truncate">{properties.fileName}</p>
                </div>
              )}

              {!isFolder && properties.category && (
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p>
                    <Badge className={`${categoryColors[properties.category] || categoryColors.other} border-0 text-xs`}>
                      {properties.category}
                    </Badge>
                  </p>
                </div>
              )}

              {!isFolder && properties.fileSize != null && (
                <div>
                  <span className="text-muted-foreground">Size</span>
                  <p className="font-medium">{formatFileSize(properties.fileSize)}</p>
                </div>
              )}

              {isFolder && properties.docCount != null && (
                <div>
                  <span className="text-muted-foreground">Files</span>
                  <p className="font-medium">{properties.docCount} items</p>
                </div>
              )}

              {isFolder && properties.folderSize != null && properties.folderSize > 0 && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <HardDrive className="h-3 w-3" /> Total Size
                  </span>
                  <p className="font-medium">{formatFileSize(properties.folderSize)}</p>
                </div>
              )}

              {isFolder && properties.children != null && (
                <div>
                  <span className="text-muted-foreground">Subfolders</span>
                  <p className="font-medium">{properties.children}</p>
                </div>
              )}

              {properties.version != null && (
                <div>
                  <span className="text-muted-foreground">Version</span>
                  <p className="font-medium">v{properties.version}</p>
                </div>
              )}

              {properties.downloadCount != null && (
                <div>
                  <span className="text-muted-foreground">Downloads</span>
                  <p className="font-medium">{properties.downloadCount}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          {properties.tags && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {properties.tags.split(',').map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Description */}
          {properties.description && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3 w-3" /> Description
                </h4>
                <p className="text-sm text-muted-foreground">{properties.description}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Timestamps */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dates</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Created
                </span>
                <p className="font-medium">{formatDate(properties.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Updated
                </span>
                <p className="font-medium">{formatDate(properties.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
