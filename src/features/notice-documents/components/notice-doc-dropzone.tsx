import { useRef, useState } from 'react'
import { UploadCloud, X, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  fileToPendingDocument,
} from '../hooks'
import { validateUpload, formatFileSize, buildAcceptAttribute } from '../utils'
import type { PendingDocument } from '../types'

interface NoticeDocDropzoneProps {
  uploadedBy: number
  onFilesAdded: (docs: PendingDocument[]) => void
  disabled?: boolean
  compact?: boolean
}

/**
 * Drag & drop / click-to-browse upload zone.
 * Produces PendingDocument entries (base64 local mode) via onFilesAdded.
 */
export function NoticeDocDropzone({
  uploadedBy,
  onFilesAdded,
  disabled,
  compact,
}: NoticeDocDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [reading, setReading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return
    setErrors([])
    setReading(true)
    const added: PendingDocument[] = []
    const errs: string[] = []
    for (const file of Array.from(fileList)) {
      const validation = validateUpload(file)
      if (!validation.valid) {
        errs.push(validation.error || `${file.name} rejected`)
        continue
      }
      try {
        added.push(await fileToPendingDocument(file, uploadedBy))
      } catch {
        errs.push(`Failed to read ${file.name}`)
      }
    }
    setReading(false)
    if (errs.length > 0) setErrors(errs)
    if (added.length > 0) onFilesAdded(added)
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload documents"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDragActive(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          if (!disabled) handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors cursor-pointer',
          compact ? 'px-4 py-6' : 'px-6 py-10',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={buildAcceptAttribute()}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {reading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <UploadCloud className={cn('text-muted-foreground', compact ? 'h-6 w-6' : 'h-10 w-10')} />
        )}
        <p className={cn('mt-2 font-medium', compact ? 'text-sm' : '')}>
          {reading ? 'Reading files…' : 'Drag & drop files here'}
        </p>
        {!compact && !reading && (
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse — PDFs, images, documents, up to 10MB each
          </p>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err) => (
            <div key={err} className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              {err}
              <button
                type="button"
                className="ml-1 hover:text-foreground"
                onClick={() => setErrors((prev) => prev.filter((e) => e !== err))}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Small pill showing an upload in progress */
export function NoticeDocUploadPill({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="truncate">{name}</span>
    </div>
  )
}

// Re-exported for convenience in parent forms
export { formatFileSize as formatDocSize }
