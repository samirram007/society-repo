import { useEffect, useState } from 'react'
import { Building2, Eye, Globe, MessageSquare, Pin, Share2, StickyNote, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { NoticeAttachmentsIndicator } from '@/features/notice-documents/components/notice-attachments-indicator'
import { ReactionBar } from './notice-reaction-bar'
import {
  categoryConfig,
  priorityConfig,
  targetAudienceConfig,
  type Notice,
  type NoticeCategory,
  type NoticeTargetAudience,
} from '../types'
import type { NoticeDocument } from '@/features/notice-documents/types'

interface NoticeCardProps {
  notice: Notice
  currentUserId?: number | null
  seenCount?: number
  onEdit: (notice: Notice) => void
  onDelete: (notice: Notice) => void
  onTogglePin: (notice: Notice) => void
  onOpenComments: (notice: Notice) => void
  onOpenSeenBy: (notice: Notice) => void
  /** Share dialog: generate link (public) or "cannot be shared" (private) */
  onOpenShare: (notice: Notice) => void
  /** DMS: open the share/attachments manager for this notice */
  onOpenDocuments?: (notice: Notice) => void
  /** DMS: preview a specific document (e.g. clicked thumbnail) */
  onPreviewDocument?: (doc: NoticeDocument, notice: Notice) => void
}

/** Paper tints — notices feel like different paper stock pinned to a board */
const paperTints = [
  'bg-amber-50 dark:bg-amber-950/40',
  'bg-sky-50 dark:bg-sky-950/40',
  'bg-rose-50 dark:bg-rose-950/40',
  'bg-lime-50 dark:bg-lime-950/40',
  'bg-violet-50 dark:bg-violet-950/40',
]

/** Pin colors cycled per card for a hand-pinned look */
const pinColors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
]

/**
 * A notice styled as a physical sheet of paper pinned to a corkboard:
 * pin at top, slightly rotated card, ruled paper texture, torn bottom edge.
 */
export function NoticeCard({
  notice,
  currentUserId,
  seenCount,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenComments,
  onOpenSeenBy,
  onOpenShare,
  onOpenDocuments,
  onPreviewDocument,
}: NoticeCardProps) {
  const priority = priorityConfig[notice.priority] || priorityConfig.medium
  const PriorityIcon = priority.icon
  const category = notice.category ? categoryConfig[notice.category] : null
  const audience = notice.targetAudience
    ? targetAudienceConfig[notice.targetAudience as NoticeTargetAudience]
    : null

  // Deterministic rotation + tint per notice so the board looks organically messy
  const seed = notice.id % 5
  const tilt = [(-0.6), 0.5, (-0.3), 0.7, (-0.5)][seed]
  const tint = paperTints[seed]
  const pinColor = pinColors[seed]

  // Parse targeted tower IDs -> resolve to names for the badge
  const towerNames = parseTowerNames(notice.targetTowers)

  // Mark as seen once per mount (only for logged-in users) + warm tower name cache
  useEffect(() => {
    ensureTowersLoaded()
    if (!currentUserId) return
    orpcMarkSeen(notice.id, currentUserId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice.id, currentUserId])

  return (
    <div
      className="relative transition-transform duration-200 hover:z-10 hover:scale-[1.005]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {/* Push pin */}
      <div
        className={cn(
          'absolute left-1/2 top-[-9px] z-10 h-5 w-5 -translate-x-1/2 rounded-full shadow-md ring-2 ring-white/60 dark:ring-black/30',
          pinColor
        )}
      >
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      </div>

      {/* Paper sheet */}
      <div
        className={cn(
          'relative rounded-sm border border-black/10 shadow-[0_3px_10px_rgba(0,0,0,0.15)] dark:border-white/10 dark:shadow-[0_3px_12px_rgba(0,0,0,0.5)]',
          tint
        )}
        style={{
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.045) 28px)',
        }}
      >
        <div className="p-5 pt-7">
          {/* Header row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {notice.title}
            </h3>
            {category && (
              <Badge className={`${category.color} border-0 text-[10px] uppercase tracking-wide`}>
                {category.label}
              </Badge>
            )}
            <Badge className={`${priority.color} border-0 text-[10px] uppercase tracking-wide`}>
              <PriorityIcon className="mr-1 h-3 w-3" />
              {priority.label}
            </Badge>
            {audience && (
              <Badge className={`${audience.color} border-0 text-[10px] uppercase tracking-wide`}>
                {audience.label}
              </Badge>
            )}
            {notice.visibility === 'public' && (
              <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] uppercase tracking-wide">
                Public
              </Badge>
            )}
            {towerNames.length > 0 && (
              <Badge className="border-0 bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300 text-[10px]">
                <Building2 className="mr-1 h-3 w-3" />
                {towerNames.join(', ')}
              </Badge>
            )}
            {notice.isPinned && <Pin className="h-3.5 w-3.5 fill-primary text-primary" />}
          </div>

          {/* Body */}
          <p className="font-serif text-sm leading-7 text-stone-800 dark:text-stone-200 whitespace-pre-line">
            {notice.content}
          </p>

          {/* Attachment thumbnails (documents DMS) */}
          {onOpenDocuments && (
            <div className="mt-3">
              <NoticeAttachmentsIndicator
                noticeId={notice.id}
                showThumbnails
                onThumbnailClick={(doc) => onPreviewDocument?.(doc, notice)}
              />
            </div>
          )}

          {/* Footer: date + actions */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/10 pt-3 dark:border-white/10">
            <span className="text-xs italic text-stone-500 dark:text-stone-400">
              {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-1">
              {/* Seen by */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-stone-600 hover:text-foreground dark:text-stone-300"
                onClick={() => onOpenSeenBy(notice)}
                title="Who has seen this"
              >
                <Eye className="h-3.5 w-3.5" />
                {seenCount ?? 0} seen
              </Button>

              {/* Reactions */}
              <ReactionBar noticeId={notice.id} userId={currentUserId} />

              {/* Comments */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs text-stone-600 hover:text-foreground dark:text-stone-300"
                onClick={() => onOpenComments(notice)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {notice.commentCount ?? 0}
              </Button>

              {/* Documents manager */}
              {onOpenDocuments && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-stone-600 hover:text-foreground dark:text-stone-300"
                  onClick={() => onOpenDocuments(notice)}
                  title="Documents & sharing"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Manage
                </Button>
              )}

              {/* Share: generate link for public notices */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 gap-1.5 px-2 text-xs',
                  notice.visibility === 'public'
                    ? 'text-emerald-700 hover:text-emerald-800 dark:text-emerald-400'
                    : 'text-stone-600 hover:text-foreground dark:text-stone-300'
                )}
                onClick={() => onOpenShare(notice)}
                title={
                  notice.visibility === 'public'
                    ? 'Generate a public share link'
                    : 'Private notice — cannot be shared'
                }
              >
                {notice.visibility === 'public' ? (
                  <Globe className="h-3.5 w-3.5" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Torn bottom edge */}
        <div
          className="h-2 w-full"
          style={{
            backgroundColor: 'inherit',
            maskImage:
              'radial-gradient(circle at 6px -2px, transparent 5px, black 5.5px)',
            maskSize: '12px 12px',
            maskRepeat: 'repeat-x',
            WebkitMaskImage:
              'radial-gradient(circle at 6px -2px, transparent 5px, black 5.5px)',
            WebkitMaskSize: '12px 12px',
            WebkitMaskRepeat: 'repeat-x',
          }}
        />
      </div>

      {/* Edit/Delete — small sticky-note style buttons bottom-right */}
      <div className="absolute -bottom-1.5 right-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onTogglePin(notice)}
          title={notice.isPinned ? 'Unpin from top' : 'Pin to top'}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow-sm ring-1 ring-black/10 hover:bg-background dark:ring-white/10"
        >
          <Pin className={cn('h-3 w-3', notice.isPinned && 'fill-primary text-primary')} />
        </button>
        <button
          type="button"
          onClick={() => onEdit(notice)}
          title="Edit notice"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow-sm ring-1 ring-black/10 hover:bg-background dark:ring-white/10"
        >
          <StickyNote className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(notice)}
          title="Delete notice"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm ring-1 ring-black/10 hover:bg-background dark:ring-white/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

/** Parse the JSON tower ID array and map IDs to tower names via the shared cache */
function parseTowerNames(targetTowers: string | null): string[] {
  if (!targetTowers) return []
  try {
    const ids = JSON.parse(targetTowers) as number[]
    return ids
      .map((id) => towerNameCache.get(id) || `Tower #${id}`)
      .filter(Boolean)
  } catch {
    return []
  }
}

/** Simple module-level cache of tower id -> name, refreshed by any mounted card */
const towerNameCache = new Map<number, string>()
let towersCacheLoaded = false

function ensureTowersLoaded() {
  if (towersCacheLoaded) return
  towersCacheLoaded = true
  import('@/server/client')
    .then(({ orpc }) => orpc.notices.listTowers({}))
    .then((towers: { id: number; name: string }[]) => {
      for (const t of towers || []) towerNameCache.set(t.id, t.name)
      towersCacheLoaded = true
    })
    .catch(() => {
      towersCacheLoaded = false
    })
}

/** Fire-and-forget seen tracking */
function orpcMarkSeen(noticeId: number, userId: number) {
  import('@/server/client')
    .then(({ orpc }) => orpc.notices.markSeen({ noticeId, userId }))
    .catch(() => {
      /* seen tracking is best-effort */
    })
}
