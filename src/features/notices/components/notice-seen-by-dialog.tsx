import { useEffect, useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { orpc } from '@/server/client'

export interface NoticeViewEntry {
  userId: number
  userName: string | null
  userRole: string | null
  viewCount: number | null
  firstViewedAt: string | null
  lastViewedAt: string | null
}

interface SeenByDialogProps {
  noticeId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called when the seen-count loads, so the card can display it */
  onCountLoaded?: (count: number) => void
}

/** Modal listing everyone who has seen a notice, with view timestamps */
export function SeenByDialog({ noticeId, open, onOpenChange, onCountLoaded }: SeenByDialogProps) {
  const [views, setViews] = useState<NoticeViewEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !noticeId) {
      setViews([])
      return
    }
    let cancelled = false
    setLoading(true)
    orpc.notices
      .listSeenBy({ noticeId })
      .then((data: NoticeViewEntry[]) => {
        if (cancelled) return
        setViews(data || [])
        onCountLoaded?.(data?.length ?? 0)
      })
      .catch(() => {
        if (!cancelled) setViews([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, noticeId])

  const formatWhen = (v: string | null) =>
    v
      ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Seen by ({views.length})
          </DialogTitle>
          <DialogDescription className="truncate">
            Everyone who has viewed this notice
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : views.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No one has seen this notice yet.
            </p>
          ) : (
            <div className="space-y-1">
              {views.map((v) => (
                <div key={v.userId} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {(v.userName || '?')
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {v.userName || `User #${v.userId}`}
                      {v.userRole && (
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {v.userRole}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatWhen(v.lastViewedAt)}
                      {(v.viewCount ?? 1) > 1 && ` · viewed ${v.viewCount}×`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
