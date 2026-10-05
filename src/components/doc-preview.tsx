import { useEffect, useRef, useState } from 'react'
import {
  FileQuestion,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * In-house document preview.
 *
 * Renders files entirely client-side — no external viewer services
 * (no Google Docs viewer / Office Online), so previews stay inside
 * the app:
 *  - Images      → native <img>
 *  - PDF         → native browser PDF engine inside an <iframe> (blob URL)
 *  - Word .docx  → rendered by docx-preview (bundled, offline)
 *  - Excel/CSV   → rendered by SheetJS (bundled, offline) as sheet tabs
 *  - Text/JSON   → rendered as plain text
 *  - Video/Audio → native <video>/<audio> players
 *  - Anything else → graceful fallback with download hint
 *
 * `src` accepts a data URL (base64), an http(s) URL, or a blob URL.
 */

export type PreviewKind =
  | 'image'
  | 'pdf'
  | 'docx'
  | 'spreadsheet'
  | 'text'
  | 'video'
  | 'audio'
  | 'unknown'

const DOCX_EXT = /\.(docx)$/i
const SHEET_EXT = /\.(xlsx|xls|csv)$/i
const TEXT_EXT = /\.(txt|json|md|log|xml|html?|css|js|ts)$/i

export function getPreviewKind(mimeType?: string | null, fileName?: string | null): PreviewKind {
  const m = (mimeType || '').toLowerCase()
  const n = (fileName || '').toLowerCase()

  if (m.startsWith('image/')) return 'image'
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  if (m.includes('wordprocessingml') || DOCX_EXT.test(n)) return 'docx'
  if (
    m.includes('spreadsheetml') ||
    m.includes('ms-excel') ||
    m === 'text/csv' ||
    SHEET_EXT.test(n)
  ) {
    return 'spreadsheet'
  }
  if (m.startsWith('video/')) return 'video'
  if (m.startsWith('audio/')) return 'audio'
  if (m.startsWith('text/') || m.includes('json') || m.includes('xml') || TEXT_EXT.test(n)) return 'text'
  return 'unknown'
}

interface DocPreviewProps {
  /** Data URL (base64), http(s) URL or blob URL with the file content */
  src?: string | null
  mimeType?: string | null
  fileName?: string | null
  /** CSS height for the preview area (default 65vh) */
  className?: string
}

/** Convert a data URL into a blob URL (data: URLs are blocked in iframes) */
function dataUrlToBlobUrl(dataUrl: string, mimeType: string): string | null {
  const [meta, payload] = dataUrl.split(',')
  if (!payload) return null
  try {
    if (meta.includes(';base64')) {
      const binary = atob(payload)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      return URL.createObjectURL(new Blob([bytes], { type: mimeType || 'application/octet-stream' }))
    }
    return URL.createObjectURL(new Blob([decodeURIComponent(payload)], { type: mimeType || 'application/octet-stream' }))
  } catch {
    return null
  }
}

export function DocPreview({ src, mimeType, fileName, className }: DocPreviewProps) {
  const kind = getPreviewKind(mimeType, fileName)

  // Resolve data: URLs into blob URLs so <iframe>/fetch can read them
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoadError(null)
    if (!src) {
      setObjectUrl(null)
      return
    }
    if (!src.startsWith('data:')) {
      setObjectUrl(src)
      return
    }
    const url = dataUrlToBlobUrl(src, mimeType || 'application/octet-stream')
    if (!url) setLoadError('Could not decode file content')
    setObjectUrl(url)
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [src, mimeType])

  if (!src) {
    return <PreviewFallback message="No file content available for preview" />
  }

  return (
    <div className={cn('relative overflow-hidden rounded-md border bg-muted/30', className || 'h-[65vh]')}>
      {loadError ? (
        <PreviewFallback message={loadError} />
      ) : kind === 'image' ? (
        <img src={objectUrl || src} alt={fileName || 'Preview'} className="h-full w-full object-contain" />
      ) : kind === 'pdf' ? (
        <iframe src={objectUrl || src} title={fileName || 'PDF preview'} className="h-full w-full" />
      ) : kind === 'video' ? (
        <video src={objectUrl || src} controls className="h-full w-full bg-black" />
      ) : kind === 'audio' ? (
        <div className="flex h-full items-center justify-center p-6">
          <audio src={objectUrl || src} controls className="w-full max-w-md" />
        </div>
      ) : kind === 'docx' ? (
        <DocxViewer url={objectUrl} onError={(e) => setLoadError(e)} />
      ) : kind === 'spreadsheet' ? (
        <SpreadsheetViewer url={objectUrl} fileName={fileName} onError={(e) => setLoadError(e)} />
      ) : kind === 'text' ? (
        <TextViewer url={objectUrl} onError={(e) => setLoadError(e)} />
      ) : (
        <PreviewFallback message="Inline preview is not supported for this file type. Use the download button below." />
      )}
    </div>
  )
}

function PreviewFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
      <FileQuestion className="h-10 w-10" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ============================================
// WORD (.docx) VIEWER — docx-preview, bundled
// ============================================
function DocxViewer({ url, onError }: { url: string | null; onError: (msg: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!url || !containerRef.current) return
    setLoading(true)
    ;(async () => {
      try {
        const [{ renderAsync }, res] = await Promise.all([
          import('docx-preview'),
          fetch(url),
        ])
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
        const buffer = await res.arrayBuffer()
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = ''
        await renderAsync(buffer, containerRef.current, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          breakPages: true,
        })
      } catch (err) {
        if (!cancelled) {
          console.error('docx preview failed:', err)
          onError('Could not render this Word document')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url, onError])

  return (
    <div className="relative h-full overflow-auto bg-neutral-200 dark:bg-neutral-900">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/60 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Rendering document…
        </div>
      )}
      <div ref={containerRef} className="docx-preview-host min-h-full p-4" />
    </div>
  )
}

// ============================================
// SPREADSHEET (.xlsx/.xls/.csv) VIEWER — SheetJS, bundled
// ============================================
const MAX_PREVIEW_ROWS = 500

function SpreadsheetViewer({
  url,
  fileName,
  onError,
}: {
  url: string | null
  fileName?: string | null
  onError: (msg: string) => void
}) {
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!url) return
    setLoading(true)
    setSheets([])
    setActive(0)
    setTruncated(false)
    ;(async () => {
      try {
        const [XLSX, res] = await Promise.all([
          import('xlsx'),
          fetch(url),
        ])
        if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
        const buffer = await res.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        if (cancelled) return
        const result = wb.SheetNames.slice(0, 20).map((name) => {
          let ws = wb.Sheets[name]
          const ref = ws && ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : null
          if (ref && ref.e.r - ref.s.r + 1 > MAX_PREVIEW_ROWS) {
            const clone = { ...ws }
            clone['!ref'] = XLSX.utils.encode_range({ s: ref.s, e: { r: ref.s.r + MAX_PREVIEW_ROWS - 1, c: ref.e.c } })
            setTruncated(true)
            ws = clone
          }
          return { name, html: ws ? XLSX.utils.sheet_to_html(ws, { editable: false }) : '' }
        })
        if (cancelled) return
        setSheets(result)
      } catch (err) {
        if (!cancelled) {
          console.error('spreadsheet preview failed:', err)
          onError('Could not render this spreadsheet')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [url, onError])

  const current = sheets[active]

  return (
    <div className="flex h-full flex-col">
      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading workbook…
        </div>
      ) : current ? (
        <>
          {sheets.length > 1 && (
            <div className="flex shrink-0 flex-wrap gap-1 border-b bg-muted/50 p-1.5">
              {sheets.map((s, i) => (
                <button
                  key={s.name}
                  onClick={() => setActive(i)}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                    i === active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          {truncated && (
            <div className="shrink-0 border-b bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Showing first {MAX_PREVIEW_ROWS} rows — download to see everything.
            </div>
          )}
          <div className="flex-1 overflow-auto p-1">
            <div
              className="text-xs [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_table]:border-collapse"
              dangerouslySetInnerHTML={{ __html: current.html }}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <FileSpreadsheet className="h-8 w-8" />
          <span className="text-sm">This workbook has no readable sheets.</span>
        </div>
      )}
    </div>
  )
}

// ============================================
// TEXT VIEWER
// ============================================
function TextViewer({ url, onError }: { url: string | null; onError: (msg: string) => void }) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!url) return
    setLoading(true)
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Fetch failed (${r.status})`)
        return r.text()
      })
      .then((t) => {
        if (!cancelled) setText(t.slice(0, 200_000))
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('text preview failed:', err)
          onError('Could not load file content')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [url, onError])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading…
      </div>
    )
  }
  return (
    <pre className="h-full overflow-auto p-4 text-xs leading-relaxed whitespace-pre-wrap">{text}</pre>
  )
}
