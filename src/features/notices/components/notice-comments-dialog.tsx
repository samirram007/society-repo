import { useEffect, useState } from 'react'
import { Loader2, MessageSquare, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/hooks/auth'
import { orpc } from '@/server/client'
import type { Notice, NoticeComment } from '../types'

interface NoticeCommentsDialogProps {
  notice: Notice | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommentsChanged: () => void
}

export function NoticeCommentsDialog({
  notice,
  open,
  onOpenChange,
  onCommentsChanged,
}: NoticeCommentsDialogProps) {
  const [comments, setComments] = useState<NoticeComment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const currentUserId = currentUser?.id ?? null

  const fetchComments = async () => {
    if (!notice) return
    setLoading(true)
    try {
      const data = await orpc.notices.listComments({ noticeId: notice.id })
      setComments(data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && notice) {
      fetchComments()
    } else {
      setComments([])
      setNewComment('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notice?.id])

  const handleSubmit = async () => {
    if (!notice || !newComment.trim() || !currentUserId) return
    setSubmitting(true)
    try {
      await orpc.notices.addComment({
        noticeId: notice.id,
        userId: currentUserId,
        comment: newComment.trim(),
      })
      setNewComment('')
      await fetchComments()
      onCommentsChanged()
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await orpc.notices.deleteComment({ id })
      await fetchComments()
      onCommentsChanged()
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
          </DialogTitle>
          <DialogDescription className="truncate">
            {notice?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="h-[300px] overflow-y-auto pr-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No comments yet. Be the first to comment.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.userName || 'Unknown user'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {comment.comment}
                      </p>
                    </div>
                    {comment.userId === currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!currentUserId || !newComment.trim() || submitting}
            title={currentUserId ? 'Add comment' : 'Loading user...'}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
