import { useState, useRef } from 'react'
import {
  Upload,
  Trash2,
  Eye,
  FileText,
  File,
  FileCheck,
  Shield,
  Paperclip,
  Camera,
  Plus,
  X,
  Loader2,
  CloudUpload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { uploadFile, type StorageResult } from '@/lib/storage'
import { compressImage, COMPRESS_PRESETS, type CompressResult } from '@/lib/compress'

// ============================================
// TYPES
// ============================================
export interface UploadedDocument {
  name: string
  type: string
  data: string // URL (Cloudinary) or base64 data URL (local fallback)
  size: number
  uploadedAt: string
  storageType?: 'local' | 'cloudinary'
}

// ============================================
// CONSTANTS
// ============================================
export const defaultDocTypes = [
  { value: 'id_proof', label: 'ID Proof', icon: FileCheck },
  { value: 'address_proof', label: 'Address Proof', icon: FileCheck },
  { value: 'rc_copy', label: 'RC Copy', icon: FileCheck },
  { value: 'insurance_policy', label: 'Insurance Policy', icon: Shield },
  { value: 'puc_certificate', label: 'PUC Certificate', icon: FileCheck },
  { value: 'receipt', label: 'Receipt', icon: FileText },
  { value: 'invoice', label: 'Invoice', icon: FileText },
  { value: 'warranty', label: 'Warranty Card', icon: Shield },
  { value: 'agreement', label: 'Agreement', icon: FileText },
  { value: 'certificate', label: 'Certificate', icon: FileCheck },
  { value: 'other', label: 'Other', icon: File },
]

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ============================================
// HELPER: Upload file to Cloudinary/local
// ============================================
async function uploadToCloud(
  file: File,
  folder?: string
): Promise<StorageResult> {
  return uploadFile(file, {
    folder: folder || 'society_erp/general',
    resourceType: 'auto',
  })
}

// ============================================
// HELPER: Check if URL is a cloud URL (not base64)
// ============================================
function isCloudUrl(url: string): boolean {
  return url.startsWith('http') || url.startsWith('cloudinary://')
}

// ============================================
// DOCUMENT UPLOADER COMPONENT
// ============================================
export function DocumentUploader({
  documents,
  onAdd,
  onRemove,
  onView,
  docTypes = defaultDocTypes,
  label = 'Documents',
  folder,
}: {
  documents: UploadedDocument[]
  onAdd: (doc: UploadedDocument) => void
  onRemove: (index: number) => void
  onView: (doc: UploadedDocument) => void
  docTypes?: typeof defaultDocTypes
  label?: string
  folder?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedType, setSelectedType] = useState(docTypes[0]?.value || 'other')
  const [customName, setCustomName] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPDF = file.type === 'application/pdf'
    if (!isImage && !isPDF) return

    setUploading(true)
    try {
      let uploadFile_ = file
      let originalSize = file.size

      // Compress images before upload
      if (isImage) {
        const compressed = await compressImage(file, COMPRESS_PRESETS.document)
        uploadFile_ = compressed.file
        if (compressed.wasCompressed) {
          console.log(`Compressed ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(compressed.compressedSize)} (${compressed.compressionPercent}% saved)`)
        }
      }

      const result = await uploadToCloud(uploadFile_, folder || 'society_erp/documents')
      const docType = docTypes.find(d => d.value === selectedType)
      const name = customName.trim() || docType?.label || 'Document'
      onAdd({
        name,
        type: selectedType,
        data: result.url,
        size: uploadFile_.size,
        uploadedAt: new Date().toISOString(),
        storageType: result.storageType,
      })
      setCustomName('')
    } catch (err) {
      console.error('Upload failed:', err)
      // Fallback to local base64 (with compression)
      try {
        if (isImage) {
          const compressed = await compressImage(file, COMPRESS_PRESETS.document)
          onAdd({
            name: customName.trim() || docTypes.find(d => d.value === selectedType)?.label || 'Document',
            type: selectedType,
            data: compressed.dataUrl,
            size: compressed.compressedSize,
            uploadedAt: new Date().toISOString(),
            storageType: 'local',
          })
        } else {
          const reader = new FileReader()
          reader.onload = () => {
            onAdd({
              name: customName.trim() || docTypes.find(d => d.value === selectedType)?.label || 'Document',
              type: selectedType,
              data: reader.result as string,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              storageType: 'local',
            })
          }
          reader.readAsDataURL(file)
        }
        setCustomName('')
      } catch { /* ignore */ }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const getDocIcon = (type: string) => {
    const opt = docTypes.find(d => d.value === type)
    return opt?.icon || File
  }

  const isImageDoc = (data: string) => data.startsWith('data:image/') || data.includes('cloudinary.com') || data.startsWith('http')
  const isPdfDoc = (data: string) => data.startsWith('data:application/pdf') || data.endsWith('.pdf')

  return (
    <div className="space-y-3">
      {/* Upload controls */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {docTypes.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <opt.icon className="h-3 w-3" />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Label</Label>
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Front side, Page 1"
            className="h-9 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Document list */}
      {documents.length > 0 ? (
        <div className="space-y-1.5">
          {documents.map((doc, idx) => {
            const isImg = isImageDoc(doc.data)
            return (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                {isImg ? (
                  <div className="h-10 w-14 rounded border overflow-hidden shrink-0">
                    <img src={doc.data} alt={doc.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {docTypes.find(d => d.value === doc.type)?.label || doc.type}
                    {' · '}
                    {formatFileSize(doc.size)}
                    {isCloudUrl(doc.data) && <span className="text-green-600 ml-1">☁️</span>}
                  </p>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onView(doc)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRemove(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="w-full h-16 rounded-lg border-2 border-dashed bg-muted/20 flex flex-col items-center justify-center gap-1">
          <Paperclip className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground">No documents yet</span>
        </div>
      )}
    </div>
  )
}

// ============================================
// IMAGE UPLOAD ZONE COMPONENT
// ============================================
export function ImageUploadZone({
  label,
  icon: Icon,
  image,
  onUpload,
  onRemove,
  aspect = 'aspect-video',
  hint,
  folder,
}: {
  label: string
  icon: any
  image: string | null
  onUpload: (dataUrl: string) => void
  onRemove: () => void
  aspect?: string
  hint?: string
  folder?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number; percent: number } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return

    setUploading(true)
    setCompressionInfo(null)
    try {
      // Compress before upload
      const compressed = await compressImage(file, COMPRESS_PRESETS.standard)
      if (compressed.wasCompressed) {
        setCompressionInfo({
          original: compressed.originalSize,
          compressed: compressed.compressedSize,
          percent: compressed.compressionPercent,
        })
      }

      const result = await uploadToCloud(compressed.file, folder || 'society_erp/images')
      onUpload(result.url)
    } catch (err) {
      console.error('Upload failed, falling back to local:', err)
      // Fallback to local base64 (compressed)
      try {
        const compressed = await compressImage(file, COMPRESS_PRESETS.standard)
        onUpload(compressed.dataUrl)
      } catch {
        const reader = new FileReader()
        reader.onload = () => onUpload(reader.result as string)
        reader.readAsDataURL(file)
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (image) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{label}</Label>
        <div className={`relative ${aspect} rounded-lg border overflow-hidden group`}>
          <img src={image} alt={label} className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={onRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <button
        type="button"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        className={`w-full ${aspect} rounded-lg border-2 border-dashed bg-muted/30 hover:bg-muted/60 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground/60" />
        )}
        <span className="text-xs text-muted-foreground font-medium">
          {uploading ? 'Compressing & uploading...' : `Upload ${label}`}
        </span>
        {hint && !uploading && <span className="text-[10px] text-muted-foreground/60">{hint}</span>}
        {compressionInfo && !uploading && (
          <span className="text-[10px] text-green-600 font-medium">
            ✓ Compressed {compressionInfo.percent}% ({formatFileSize(compressionInfo.original)} → {formatFileSize(compressionInfo.compressed)})
          </span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ============================================
// IMAGE GALLERY COMPONENT
// ============================================
export function ImageGallery({
  images,
  onAdd,
  onRemove,
  maxCols = 4,
  folder,
}: {
  images: string[]
  onAdd: (dataUrl: string) => void
  onRemove: (index: number) => void
  maxCols?: number
  folder?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState({ done: 0, total: 0 })

  const [compressionStats, setCompressionStats] = useState<{ saved: number; total: number } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (fileArray.length === 0) return

    setUploading(true)
    setUploadCount({ done: 0, total: fileArray.length })
    setCompressionStats(null)
    let totalSaved = 0
    let totalOriginal = 0

    for (let i = 0; i < fileArray.length; i++) {
      try {
        // Compress before upload
        const compressed = await compressImage(fileArray[i], COMPRESS_PRESETS.gallery)
        if (compressed.wasCompressed) {
          totalSaved += compressed.originalSize - compressed.compressedSize
          totalOriginal += compressed.originalSize
        }

        const result = await uploadToCloud(compressed.file, folder || 'society_erp/gallery')
        onAdd(result.url)
      } catch (err) {
        console.error('Upload failed, falling back to local:', err)
        // Fallback to local base64 (compressed)
        try {
          const compressed = await compressImage(fileArray[i], COMPRESS_PRESETS.gallery)
          onAdd(compressed.dataUrl)
        } catch {
          const reader = new FileReader()
          reader.onload = () => onAdd(reader.result as string)
          reader.readAsDataURL(fileArray[i])
        }
      }
      setUploadCount(prev => ({ ...prev, done: i + 1 }))
    }

    if (totalOriginal > 0) {
      setCompressionStats({ saved: totalSaved, total: totalOriginal })
    }

    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          Photos ({images.length})
          {uploading && <span className="text-primary ml-2">Compressing & uploading {uploadCount.done + 1}/{uploadCount.total}...</span>}
          {!uploading && compressionStats && compressionStats.saved > 0 && (
            <span className="text-green-600 ml-2">✓ Saved {formatFileSize(compressionStats.saved)}</span>
          )}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
          {uploading ? 'Uploading...' : 'Add'}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      {images.length === 0 && !uploading ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-20 rounded-lg border-2 border-dashed bg-muted/30 hover:bg-muted/60 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <CloudUpload className="h-5 w-5 text-muted-foreground/60" />
          <span className="text-[11px] text-muted-foreground">Click to add photos (stored in cloud)</span>
        </button>
      ) : (
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg border overflow-hidden group cursor-pointer"
              onClick={() => setPreviewImage(img)}
            >
              <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(idx)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="absolute bottom-0.5 right-0.5 bg-black/60 rounded px-1 py-0.5">
                <span className="text-[9px] text-white font-medium">{idx + 1}</span>
              </div>
              {/* Cloud indicator */}
              {isCloudUrl(img) && (
                <div className="absolute top-0.5 left-0.5 bg-green-500/80 rounded px-1 py-0.5">
                  <CloudUpload className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
          ))}
          {/* Uploading placeholder */}
          {uploading && uploadCount.done < uploadCount.total && (
            <div className="aspect-square rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Full-size preview */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="sm:max-w-[600px] p-0">
            <img src={previewImage} alt="Preview" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ============================================
// DOCUMENT PREVIEW DIALOG
// ============================================
export function DocumentPreviewDialog({
  open,
  onOpenChange,
  src,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string
  title: string
}) {
  const isPdf = src?.startsWith('data:application/pdf') || src?.endsWith('.pdf') || src?.includes('.pdf?')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-2">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm flex items-center gap-2">
            {isPdf ? <FileText className="h-4 w-4" /> : null}
            {title}
          </DialogTitle>
        </DialogHeader>
        {src && isPdf ? (
          <div className="w-full rounded-lg overflow-hidden border">
            <iframe src={src} className="w-full h-[60vh]" title={title} />
          </div>
        ) : src ? (
          <img
            src={src}
            alt={title}
            className="w-full rounded-lg max-h-[60vh] object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
