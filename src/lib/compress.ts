/**
 * Client-side image compression using Canvas API
 * Resizes and compresses images before upload to reduce storage and bandwidth
 */

// ============================================
// TYPES
// ============================================
export interface CompressOptions {
  /** Max width in pixels (default: 1920) */
  maxWidth?: number
  /** Max height in pixels (default: 1440) */
  maxHeight?: number
  /** JPEG/WebP quality 0-1 (default: 0.82) */
  quality?: number
  /** Output format (default: 'jpeg') */
  format?: 'jpeg' | 'webp' | 'png'
  /** Skip compression if file is smaller than this in bytes (default: 200KB) */
  skipBelow?: number
}

export interface CompressResult {
  /** Compressed file ready for upload */
  file: File
  /** Compressed data URL (for preview/fallback) */
  dataUrl: string
  /** Original file size in bytes */
  originalSize: number
  /** Compressed size in bytes */
  compressedSize: number
  /** Compression ratio as percentage */
  compressionPercent: number
  /** Whether compression was applied */
  wasCompressed: boolean
  /** Output width */
  width: number
  /** Output height */
  height: number
}

// ============================================
// DEFAULTS
// ============================================
const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1440,
  quality: 0.82,
  format: 'jpeg',
  skipBelow: 200 * 1024, // 200KB
}

// ============================================
// MAIN COMPRESS FUNCTION
// ============================================
export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<CompressResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Skip compression for small files or non-images
  if (file.size <= opts.skipBelow || !file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file)
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
      compressionPercent: 0,
      wasCompressed: false,
      width: 0,
      height: 0,
    }
  }

  // Skip PNG (lossless) unless it's huge — compressing PNG often makes it bigger
  if (file.type === 'image/png' && file.size < 5 * 1024 * 1024) {
    const dataUrl = await readFileAsDataUrl(file)
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
      compressionPercent: 0,
      wasCompressed: false,
      width: 0,
      height: 0,
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const result = compressLoadedImage(img, file, opts)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(file)
  })
}

// ============================================
// COMPRESS FROM DATA URL (for base64 fallback flow)
// ============================================
export async function compressDataUrl(
  dataUrl: string,
  options?: CompressOptions
): Promise<CompressResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        // Estimate original size from data URL
        const originalSize = Math.round((dataUrl.length * 3) / 4)
        const result = compressLoadedImage(img, null, opts, originalSize, dataUrl)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = dataUrl
  })
}

// ============================================
// INTERNAL: Compress a loaded HTMLImageElement
// ============================================
function compressLoadedImage(
  img: HTMLImageElement,
  originalFile: File | null,
  opts: Required<CompressOptions>,
  originalSizeHint?: number,
  originalDataUrl?: string
): CompressResult {
  const { naturalWidth: origW, naturalHeight: origH } = img

  // Calculate new dimensions (maintain aspect ratio)
  let newW = origW
  let newH = origH

  if (origW > opts.maxWidth || origH > opts.maxHeight) {
    const ratio = Math.min(opts.maxWidth / origW, opts.maxHeight / origH)
    newW = Math.round(origW * ratio)
    newH = Math.round(origH * ratio)
  }

  // Create canvas and draw
  const canvas = document.createElement('canvas')
  canvas.width = newW
  canvas.height = newH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')

  // Use high-quality image rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, newW, newH)

  // Determine MIME type
  const mimeType = opts.format === 'webp' ? 'image/webp' : opts.format === 'png' ? 'image/png' : 'image/jpeg'

  // Compress
  const dataUrl = canvas.toDataURL(mimeType, opts.quality)

  // Convert to File
  const blob = dataUrlToBlob(dataUrl)
  const fileName = originalFile
    ? originalFile.name.replace(/\.[^.]+$/, `.${opts.format === 'jpeg' ? 'jpg' : opts.format}`)
    : `compressed.${opts.format === 'jpeg' ? 'jpg' : opts.format}`

  const compressedFile = new File([blob], fileName, { type: mimeType })

  const originalSize = originalFile?.size || originalSizeHint || originalDataUrl
    ? Math.round((originalDataUrl?.length || 0) * 3 / 4)
    : 0

  const compressedSize = compressedFile.size
  const compressionPercent = originalSize > 0
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0

  // Clean up object URL
  if (originalFile) {
    URL.revokeObjectURL(URL.createObjectURL(new Blob()))
  }

  return {
    file: compressedFile,
    dataUrl,
    originalSize,
    compressedSize,
    compressionPercent: Math.max(0, compressionPercent),
    wasCompressed: compressionPercent > 0,
    width: newW,
    height: newH,
  }
}

// ============================================
// HELPERS
// ============================================
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binaryStr = atob(parts[1])
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

// ============================================
// BATCH COMPRESS
// ============================================
export async function compressImages(
  files: File[],
  options?: CompressOptions,
  onProgress?: (current: number, total: number, result: CompressResult) => void
): Promise<CompressResult[]> {
  const results: CompressResult[] = []
  for (let i = 0; i < files.length; i++) {
    const result = await compressImage(files[i], options)
    results.push(result)
    onProgress?.(i + 1, files.length, result)
  }
  return results
}

// ============================================
// PRESET OPTIONS
// ============================================
export const COMPRESS_PRESETS = {
  /** Profile photos, avatars — small, fast loading */
  avatar: { maxWidth: 400, maxHeight: 400, quality: 0.8, format: 'jpeg' as const },
  /** Vehicle photos, general images — good balance */
  standard: { maxWidth: 1920, maxHeight: 1440, quality: 0.82, format: 'jpeg' as const },
  /** Document scans, ID proofs — higher quality for text readability */
  document: { maxWidth: 2400, maxHeight: 1800, quality: 0.88, format: 'jpeg' as const },
  /** Gallery photos — slightly lower quality for gallery views */
  gallery: { maxWidth: 1600, maxHeight: 1200, quality: 0.78, format: 'jpeg' as const },
  /** Thumbnails — very small for preview cards */
  thumbnail: { maxWidth: 300, maxHeight: 300, quality: 0.75, format: 'jpeg' as const },
} as const
