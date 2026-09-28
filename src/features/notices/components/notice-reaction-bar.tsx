import { useEffect, useState } from 'react'
import { ThumbsUp, Heart, PartyPopper, Lightbulb, HandHeart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { orpc } from '@/server/client'

export type ReactionType = 'like' | 'love' | 'celebrate' | 'insightful' | 'thanks'

export const reactionConfig: Record<
  ReactionType,
  { label: string; icon: typeof ThumbsUp; activeColor: string }
> = {
  like: { label: 'Like', icon: ThumbsUp, activeColor: 'text-blue-600' },
  love: { label: 'Love', icon: Heart, activeColor: 'text-rose-600' },
  celebrate: { label: 'Celebrate', icon: PartyPopper, activeColor: 'text-violet-600' },
  insightful: { label: 'Insightful', icon: Lightbulb, activeColor: 'text-amber-600' },
  thanks: { label: 'Thanks', icon: HandHeart, activeColor: 'text-emerald-600' },
}

interface ReactionBarProps {
  noticeId: number
  userId?: number | null
  onChange?: () => void
}

/**
 * Facebook-style reaction bar: emoji picker + per-type counts.
 * Requires a logged-in user to react; renders read-only otherwise.
 */
export function ReactionBar({ noticeId, userId, onChange }: ReactionBarProps) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [namesByType, setNamesByType] = useState<Record<string, string[]>>({})
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () => {
    orpc.notices
      .listReactions({ noticeId, userId: userId ?? undefined })
      .then((res: { counts: Record<string, number>; namesByType: Record<string, string[]>; myReaction: ReactionType | null }) => {
        setCounts(res.counts || {})
        setNamesByType(res.namesByType || {})
        setMyReaction(res.myReaction || null)
      })
      .catch(() => {
        /* keep prior state on failure */
      })
  }

  useEffect(load, [noticeId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const react = async (type: ReactionType) => {
    if (!userId || busy) return
    setBusy(true)
    setPickerOpen(false)
    // Optimistic update
    const prev = myReaction
    setMyReaction((p) => (p === type ? null : type))
    try {
      await orpc.notices.react({ noticeId, userId, reactionType: type })
      load()
      onChange?.()
    } catch {
      setMyReaction(prev) // revert on failure
    } finally {
      setBusy(false)
    }
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0)

  const pickerButton = (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      disabled={!userId || busy}
      title={userId ? 'React to this notice' : 'Log in to react'}
      onClick={() => setPickerOpen((o) => !o)}
    >
      {myReaction ? (
        (() => {
          const Cfg = reactionConfig[myReaction]
          return <Cfg.icon className={cn('h-4 w-4', Cfg.activeColor)} />
        })()
      ) : (
        <ThumbsUp className="h-4 w-4" />
      )}
      {myReaction ? reactionConfig[myReaction].label : 'React'}
    </button>
  )

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        {pickerOpen && (
          <div className="absolute bottom-full left-0 z-20 mb-1.5 flex gap-1 rounded-full border bg-background p-1.5 shadow-md">
            {(Object.keys(reactionConfig) as ReactionType[]).map((type) => {
              const cfg = reactionConfig[type]
              return (
                <button
                  key={type}
                  type="button"
                  title={cfg.label}
                  className="rounded-full p-1.5 transition-transform hover:scale-125 hover:bg-muted"
                  onClick={() => react(type)}
                >
                  <cfg.icon className={cn('h-4.5 w-4.5', myReaction === type && cfg.activeColor)} />
                </button>
              )
            })}
          </div>
        )}
        {pickerButton}
      </div>

      {total > 0 && (
        <div className="flex items-center gap-1" title={Object.entries(namesByType).map(([t, names]) => `${reactionConfig[t as ReactionType]?.label ?? t}: ${names.join(', ')}`).join('\n')}>
          {Object.entries(counts).map(([type, count]) => {
            const cfg = reactionConfig[type as ReactionType]
            if (!cfg) return null
            return (
              <span
                key={type}
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium',
                  myReaction === type && 'ring-1 ring-primary/40'
                )}
              >
                <cfg.icon className={cn('h-3 w-3', cfg.activeColor)} />
                {count}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
