import type { NoticeDocType } from './types'

// ============================================
// FORMATTING HELPERS
// ============================================
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ============================================
// FILE TYPE DETECTION
// ============================================
export function detectDocType(mimeType: string, fileName: string): NoticeDocType {
  if (mimeType.startsWith('image/')) return 'photo'
  if (mimeType === 'text/plain' || fileName.toLowerCase().endsWith('.txt')) return 'note'
  return 'file'
}

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.')
  return idx === -1 ? '' : fileName.slice(idx + 1).toLowerCase()
}

/** Human-readable kind label from mime/extension */
export function describeFileType(mimeType: string | null | undefined, fileName: string | null | undefined): string {
  const ext = fileName ? getFileExtension(fileName) : ''
  if (mimeType?.startsWith('image/')) return 'Image'
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'PDF'
  if (mimeType === 'application/zip' || ['zip', 'rar', '7z'].includes(ext)) return 'Archive'
  if (['doc', 'docx'].includes(ext) || mimeType?.includes('word')) return 'Word'
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType?.includes('sheet')) return 'Spreadsheet'
  if (['ppt', 'pptx'].includes(ext) || mimeType?.includes('presentation')) return 'Slides'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mimeType?.startsWith('video/')) return 'Video'
  if (['mp3', 'wav', 'ogg'].includes(ext) || mimeType?.startsWith('audio/')) return 'Audio'
  if (mimeType === 'text/plain' || ext === 'txt') return 'Text'
  return ext ? ext.toUpperCase() : 'File'
}

// ============================================
// ALLOWED UPLOAD TYPES
// ============================================
export const MAX_UPLOAD_MB = 10

const ALLOWED_MIME_PREFIXES = [
  'image/',
  'video/',
  'audio/',
  'text/',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/zip',
  'application/json',
]

export function isAllowedMimeType(mimeType: string, fileName: string): boolean {
  const lower = mimeType.toLowerCase()
  if (ALLOWED_MIME_PREFIXES.some((p) => lower.startsWith(p))) return true
  // Fall back on extension for unknown/binary mimetypes
  const ext = getFileExtension(fileName)
  return ext.length > 0 && ext.length <= 5
}

/** Build the accept attribute value for file inputs */
export function buildAcceptAttribute(): string {
  return [
    'image/*',
    'video/*',
    'audio/*',
    'text/*',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.csv',
    '.ppt',
    '.pptx',
    '.zip',
    '.rar',
    '.7z',
    '.txt',
    '.json',
  ].join(',')
}

// ============================================
// SHARE URL HELPERS
// ============================================
export function buildShareUrl(token: string): string {
  if (typeof window === 'undefined') return `/share/${token}`
  return `${window.location.origin}/share/${token}`
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return Promise.resolve(false)
  }
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false)
}

// ============================================
// DOWNLOAD HELPER
// ============================================
export function triggerBrowserDownload(data: string, fileName: string, mimeType: string) {
  const blob = data.startsWith('data:')
    ? dataUrlToBlob(data)
    : new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, payload] = dataUrl.split(',')
  const mimeMatch = meta.match(/data:([^;]+)/)
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
  const isBase64 = meta.includes('base64')
  if (isBase64) {
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  }
  return new Blob([decodeURIComponent(payload)], { type: mime })
}

// ============================================
// VALIDATION
// ============================================
export function validateUpload(file: File): { valid: boolean; error?: string } {
  if (file.size === 0) return { valid: false, error: `${file.name} is empty` }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `${file.name} exceeds the ${MAX_UPLOAD_MB}MB limit`,
    }
  }
  if (!isAllowedMimeType(file.type, file.name)) {
    return { valid: false, error: `${file.name} has an unsupported file type` }
  }
  return { valid: true }
}
