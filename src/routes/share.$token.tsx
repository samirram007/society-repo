import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Megaphone,
  Loader2,
  Download,
  FileText,
  Link as LinkIcon,
  ShieldAlert,
  CalendarDays,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { orpc } from '@/server/client'
import { triggerBrowserDownload } from '@/features/notice-documents/utils'

interface PublicDoc {
  id: number
  title: string
  fileName: string | null
  mimeType: string | null
  fileExtension: string | null
  fileSize: number | null
  docType: string | null
  createdAt: string | null
}

interface PublicNotice {
  notice: {
    id: number
    title: string
    content: string
    category: string | null
    priority: string | null
    createdAt: string | null
  }
  documents: PublicDoc[]
}

function SharePage() {
  const { token } = Route.useParams()
  const [data, setData] = useState<PublicNotice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    orpc.noticeShares
      .resolvePublic({ token })
      .then((res: PublicNotice) => {
        if (!cancelled) setData(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shared notice')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const handleDownload = async (doc: PublicDoc) => {
    try {
      const res = await orpc.noticeDocuments.download({ id: doc.id, publicToken: token })
      if (res.url) {
        window.open(res.url, '_blank')
      } else if (res.data) {
        triggerBrowserDownload(res.data, doc.fileName || doc.title, doc.mimeType || 'application/octet-stream')
      }
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
          <Megaphone className="h-5 w-5 text-primary" />
          <span className="font-semibold">Society Notice</span>
          <Badge variant="secondary" className="ml-2">Shared</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error || !data ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/50" />
              <p className="font-medium">Link unavailable</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {error || 'This share link is invalid, expired or has been revoked.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {data.notice.category && (
                    <Badge variant="secondary" className="capitalize">{data.notice.category}</Badge>
                  )}
                  {data.notice.priority === 'high' && (
                    <Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">High priority</Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {data.notice.createdAt ? new Date(data.notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  </span>
                </div>
                <h1 className="text-2xl font-bold">{data.notice.title}</h1>
                <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{data.notice.content}</p>
              </CardContent>
            </Card>

            {data.documents.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Attached documents</h2>
                {data.documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : 'File'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <LinkIcon className="h-3 w-3" />
              Shared via a secure link from the society portal
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export const Route = createFileRoute('/share/$token')({
  component: SharePage,
})
