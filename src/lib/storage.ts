/**
 * Storage abstraction layer
 * Supports local (base64) and Cloudinary cloud storage
 */

// ============================================
// TYPES
// ============================================
export interface StorageResult {
  url: string
  publicId?: string
  format?: string
  bytes?: number
  storageType: 'local' | 'cloudinary'
}

export interface UploadOptions {
  folder?: string
  resourceType?: 'auto' | 'image' | 'video' | 'raw'
  tags?: string[]
}

// ============================================
// ENVIRONMENT CONFIG
// ============================================
const CLOUDINARY_URL = import.meta.env.VITE_CLOUDINARY_URL || ''
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'society_erp_docs'
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''

// ============================================
// CLOUDINARY HELPERS
// ============================================
export function isCloudinaryConfigured(): boolean {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)
}

// ============================================
// LOCAL STORAGE (Base64)
// ============================================
async function uploadToLocal(file: File, options?: UploadOptions): Promise<StorageResult> {
  const dataUrl = await readFileAsDataUrl(file)
  // Return a short marker as URL (base64 goes into fileData, not fileUrl which is varchar(500))
  return {
    url: `local://${file.name}`,
    publicId: dataUrl,
    format: file.type,
    bytes: file.size,
    storageType: 'local',
  }
}

// ============================================
// CLOUDINARY STORAGE
// ============================================
async function uploadToCloudinary(file: File, options?: UploadOptions): Promise<StorageResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  
  if (options?.folder) {
    formData.append('folder', `society_erp/${options.folder}`)
  }
  
  if (options?.tags) {
    formData.append('tags', options.tags.join(','))
  }
  
  // Determine resource type
  const resourceType = options?.resourceType || 'auto'
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Cloudinary upload failed')
  }
  
  const result = await response.json()
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
    storageType: 'cloudinary',
  }
}

// ============================================
// MAIN UPLOAD FUNCTION
// ============================================
export async function uploadFile(
  file: File,
  options?: UploadOptions
): Promise<StorageResult> {
  // Use Cloudinary if configured, otherwise fallback to local
  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(file, options)
    } catch (error) {
      console.warn('Cloudinary upload failed, falling back to local:', error)
      return await uploadToLocal(file, options)
    }
  }
  
  return await uploadToLocal(file, options)
}

// ============================================
// UPLOAD MULTIPLE FILES
// ============================================
export async function uploadFiles(
  files: File[],
  options?: UploadOptions,
  onProgress?: (current: number, total: number) => void
): Promise<StorageResult[]> {
  const results: StorageResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length)
    const result = await uploadFile(files[i], options)
    results.push(result)
  }
  
  return results
}

// ============================================
// DELETE FILE (Cloudinary only)
// ============================================
export async function deleteFile(publicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured() || !publicId) {
    return false
  }
  
  // Note: Deletion requires signed API call on server side
  // For now, we just mark as inactive in the database
  console.log('Cloudinary deletion should be done server-side:', publicId)
  return true
}

// ============================================
// GET OPTIMIZED URL (Cloudinary)
// ============================================
export function getOptimizedUrl(
  url: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
  }
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }
  
  const transformations: string[] = []
  
  if (options?.width) transformations.push(`w_${options.width}`)
  if (options?.height) transformations.push(`h_${options.height}`)
  if (options?.quality) transformations.push(`q_${options.quality}`)
  if (options?.format) transformations.push(`f_${options.format}`)
  
  if (transformations.length === 0) return url
  
  // Insert transformations into Cloudinary URL
  const parts = url.split('/upload/')
  if (parts.length === 2) {
    return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`
  }
  
  return url
}

// ============================================
// HELPER: Read file as Data URL
// ============================================
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============================================
// FILE VALIDATION
// ============================================
// ============================================
// FILE TYPE RESTRICTIONS
// ============================================
export type FileTypeCategory = 'images' | 'documents' | 'spreadsheets' | 'presentations' | 'videos' | 'audio' | 'archives' | 'all'

export interface FileTypeRestriction {
  category: FileTypeCategory
  label: string
  mimeTypes: string[]
  extensions: string[]
}

// Predefined file type categories
export const FILE_TYPE_CATEGORIES: Record<FileTypeCategory, FileTypeRestriction> = {
  all: {
    category: 'all',
    label: 'All Files',
    mimeTypes: [],
    extensions: [],
  },
  images: {
    category: 'images',
    label: 'Images',
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif'],
  },
  documents: {
    category: 'documents',
    label: 'Documents',
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/rtf', 'application/rtf'],
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
  },
  spreadsheets: {
    category: 'spreadsheets',
    label: 'Spreadsheets',
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    extensions: ['.xls', '.xlsx', '.csv'],
  },
  presentations: {
    category: 'presentations',
    label: 'Presentations',
    mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    extensions: ['.ppt', '.pptx'],
  },
  videos: {
    category: 'videos',
    label: 'Videos',
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
    extensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  },
  audio: {
    category: 'audio',
    label: 'Audio',
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'],
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
  },
  archives: {
    category: 'archives',
    label: 'Archives',
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  },
}

// Default allowed categories (configurable)
export const DEFAULT_ALLOWED_CATEGORIES: FileTypeCategory[] = ['images', 'documents', 'spreadsheets']

// Get all allowed mime types from categories
export function getAllowedMimeTypes(categories: FileTypeCategory[]): string[] {
  if (categories.includes('all')) return []
  
  const mimeTypes: string[] = []
  for (const cat of categories) {
    const restriction = FILE_TYPE_CATEGORIES[cat]
    if (restriction) {
      mimeTypes.push(...restriction.mimeTypes)
    }
  }
  return [...new Set(mimeTypes)]
}

// Get all allowed extensions from categories
export function getAllowedExtensions(categories: FileTypeCategory[]): string[] {
  if (categories.includes('all')) return []
  
  const extensions: string[] = []
  for (const cat of categories) {
    const restriction = FILE_TYPE_CATEGORIES[cat]
    if (restriction) {
      extensions.push(...restriction.extensions)
    }
  }
  return [...new Set(extensions)]
}

// Check if file type is allowed
export function isFileTypeAllowed(file: File, allowedCategories: FileTypeCategory[]): boolean {
  if (allowedCategories.includes('all')) return true
  
  const fileName = file.name.toLowerCase()
  const mimeType = file.type.toLowerCase()
  
  // Check against all allowed categories
  for (const cat of allowedCategories) {
    const restriction = FILE_TYPE_CATEGORIES[cat]
    if (!restriction) continue
    
    // Check mime type
    if (restriction.mimeTypes.some(m => mimeType.includes(m) || m.includes(mimeType))) {
      return true
    }
    
    // Check extension
    if (restriction.extensions.some(ext => fileName.endsWith(ext))) {
      return true
    }
  }
  
  return false
}

// Get file type category from file
export function getFileTypeCategory(file: File): FileTypeCategory | null {
  const fileName = file.name.toLowerCase()
  const mimeType = file.type.toLowerCase()
  
  for (const [key, restriction] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (key === 'all') continue
    
    if (restriction.mimeTypes.some(m => mimeType.includes(m) || m.includes(mimeType))) {
      return key as FileTypeCategory
    }
    if (restriction.extensions.some(ext => fileName.endsWith(ext))) {
      return key as FileTypeCategory
    }
  }
  
  return null
}

// Format allowed categories for display
export function formatAllowedTypes(categories: FileTypeCategory[]): string {
  if (categories.includes('all')) return 'All file types allowed'
  
  return categories
    .map(cat => FILE_TYPE_CATEGORIES[cat]?.label)
    .filter(Boolean)
    .join(', ')
}

export const FILE_SIZE_LIMITS = {
  local: 10 * 1024 * 1024, // 10MB for local storage
  cloudinary: 100 * 1024 * 1024, // 100MB for Cloudinary
}

export function getMaxFileSize(): number {
  return isCloudinaryConfigured()
    ? FILE_SIZE_LIMITS.cloudinary
    : FILE_SIZE_LIMITS.local
}

export function validateFile(file: File, allowedCategories: FileTypeCategory[] = DEFAULT_ALLOWED_CATEGORIES): { valid: boolean; error?: string } {
  const maxSize = getMaxFileSize()
  
  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024))
    return {
      valid: false,
      error: `${file.name} is too large (${formatBytes(file.size)}). Max size: ${maxMB}MB`,
    }
  }
  
  // Check if empty
  if (file.size === 0) {
    return {
      valid: false,
      error: `${file.name} is empty`,
    }
  }
  
  // Check file type
  if (!allowedCategories.includes('all') && !isFileTypeAllowed(file, allowedCategories)) {
    const allowed = formatAllowedTypes(allowedCategories)
    return {
      valid: false,
      error: `${file.name} is not allowed. Allowed types: ${allowed}`,
    }
  }
  
  return { valid: true }
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

// ============================================
// GOOGLE DOCS/PHOTOS INTEGRATION
// ============================================
export interface GoogleDocLink {
  type: 'google_doc' | 'google_sheet' | 'google_slides' | 'google_photo'
  url: string
  title?: string
}

/**
 * Extract Google Doc/Sheet/Slide ID from URL
 */
export function extractGoogleId(url: string): string | null {
  // Google Docs: https://docs.google.com/document/d/{id}/edit
  // Google Sheets: https://docs.google.com/spreadsheets/d/{id}/edit
  // Google Slides: https://docs.google.com/presentation/d/{id}/edit
  // Google Photos: https://photos.google.com/photo/{id}
  
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (docMatch) return docMatch[1]
  
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (sheetMatch) return sheetMatch[1]
  
  const slidesMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)
  if (slidesMatch) return slidesMatch[1]
  
  const photoMatch = url.match(/\/photo\/([a-zA-Z0-9_-]+)/)
  if (photoMatch) return photoMatch[1]
  
  return null
}

/**
 * Detect Google content type from URL
 */
export function detectGoogleType(url: string): GoogleDocLink['type'] | null {
  if (url.includes('docs.google.com/document')) return 'google_doc'
  if (url.includes('docs.google.com/spreadsheets')) return 'google_sheet'
  if (url.includes('docs.google.com/presentation')) return 'google_slides'
  if (url.includes('photos.google.com')) return 'google_photo'
  return null
}

/**
 * Get embed URL for Google content
 */
export function getGoogleEmbedUrl(url: string): string | null {
  const id = extractGoogleId(url)
  if (!id) return null
  
  const type = detectGoogleType(url)
  if (!type) return null
  
  switch (type) {
    case 'google_doc':
      return `https://docs.google.com/document/d/${id}/preview`
    case 'google_sheet':
      return `https://docs.google.com/spreadsheets/d/${id}/preview`
    case 'google_slides':
      return `https://docs.google.com/presentation/d/${id}/preview`
    case 'google_photo':
      return url // Google Photos don't have embed URLs
    default:
      return null
  }
}

/**
 * Create a Google link document entry
 */
export function createGoogleDocEntry(
  url: string,
  title?: string
): {
  fileUrl: string
  fileName: string
  mimeType: string
  isGoogleLink: boolean
  googleType: string
} | null {
  const type = detectGoogleType(url)
  if (!type) return null
  
  const mimeMap: Record<string, string> = {
    google_doc: 'application/vnd.google-apps.document',
    google_sheet: 'application/vnd.google-apps.spreadsheet',
    google_slides: 'application/vnd.google-apps.presentation',
    google_photo: 'image/jpeg',
  }
  
  const nameMap: Record<string, string> = {
    google_doc: 'Google Doc',
    google_sheet: 'Google Sheet',
    google_slides: 'Google Slides',
    google_photo: 'Google Photo',
  }
  
  return {
    fileUrl: url,
    fileName: title || nameMap[type],
    mimeType: mimeMap[type],
    isGoogleLink: true,
    googleType: type,
  }
}
