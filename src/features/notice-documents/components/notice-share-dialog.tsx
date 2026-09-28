import { useState } from 'react'
import { Copy, Check, Link2, Loader2, RotateCcw, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { orpc } from '@/server/client'
import { useCurrentUser } from '@/hooks/auth'
import { useNoticeShares } from '../hooks'
import { buildShareUrl, copyToClipboard, formatDate } from '../utils'
import { visibilityConfig, type NoticeVisibility } from '../types'

interface NoticeShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noticeId: number
  noticeTitle: string
  visibility: NoticeVisibility
  onVisibilityChanged?: (visibility: NoticeVisibility) => void
}

/**
 * Manage public sharing for a notice.
 * - Public notices: create/copy/revoke share links
 * - Private notices: blocked with an inline visibility switch
 */
export function NoticeShareDialog({
  open,
  onOpenChange,
  noticeId,
  noticeTitle,
  visibility,
}: NoticeShareDialogProps) {
  const { data: currentUser } = useCurrentUser()
  const { shares, loading, reload } = useNoticeShares(open ? noticeId : null)
  const [creating, setCreating] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newLink, setNewLink] = useState<string | null>(null)

  const isPublic = visibility === 'public'

  const handleCreateLink = async () => {
    if (!currentUser) return
    setCreating(true)
    setError(null)
    try {
      const res = await orpc.noticeShares.create({
        noticeId,
        societyId: 1,
        sharedBy: currentUser.id,
      })
      setNewLink(buildShareUrl(res.token))
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async (token: string) => {
    const ok = await copyToClipboard(buildShareUrl(token))
    if (ok) {
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    }
  }

  const handleRevoke = async (id: number) => {
    try {
      await orpc.noticeShares.revoke({ id })
      reload()
    } catch (err) {
      console.error('Failed to revoke link:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Share "{noticeTitle}"
          </DialogTitle>
          <DialogDescription>
            {isPublic
              ? 'Anyone with a share link can view this notice and its public documents — no login needed.'
              : 'This notice is private and cannot be shared outside the portal.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isPublic && (
            <div className="rounded-md border bg-muted/40 p-6 text-center">
              <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">This notice cannot be shared</p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Only public notices can be shared via link. Private notices are visible to
                logged-in portal members only.
              </p>
            </div>
          )}

          {isPublic && (
            <>
              {newLink && (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Share link created</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input readOnly value={newLink} className="h-8 text-xs" onFocus={(e) => e.target.select()} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        copyToClipboard(newLink)
                        setCopiedToken('__new__')
                        setTimeout(() => setCopiedToken(null), 2000)
                      }}
                    >
                      {copiedToken === '__new__' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Share links</p>
                <Button size="sm" onClick={handleCreateLink} disabled={creating}>
                  {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}
                  Generate link
                </Button>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : shares.length === 0 ? (
                <p className="rounded-md border border-dashed py-4 text-center text-xs text-muted-foreground">
                  No share links yet. Create one to share this notice.
                </p>
              ) : (
                <div className="space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs">…{share.token.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {share.viewCount ?? 0} views
                          {share.maxViews != null && ` / ${share.maxViews} max`}
                          {share.expiresAt && ` · expires ${formatDate(share.expiresAt)}`}
                        </p>
                      </div>
                      {share.isRevoked ? (
                        <Badge variant="secondary">Revoked</Badge>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Copy link"
                            onClick={() => handleCopy(share.token)}
                          >
                            {copiedToken === share.token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Revoke"
                            onClick={() => handleRevoke(share.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
