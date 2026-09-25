import { AlertTriangle, Clock, Info, type LucideIcon } from 'lucide-react'

export type NoticeCategory = 'general' | 'holiday' | 'maintenance' | 'event' | 'security' | 'rule'
export type NoticeTargetAudience = 'all' | 'owners' | 'tenants' | 'committee' | 'specific_tower'

export interface Notice {
  id: number
  societyId: number
  title: string
  content: string
  postedBy: number
  category: NoticeCategory | null
  priority: string
  targetAudience: NoticeTargetAudience | null
  targetTowers: string | null
  isPinned: boolean
  isActive: boolean
  createdAt: string
  commentCount?: number
}

export interface NoticeComment {
  id: number
  noticeId: number
  comment: string
  createdAt: string
  userId: number
  userName: string | null
  userRole: string | null
}

export const priorityConfig: Record<
  string,
  { color: string; icon: LucideIcon; label: string }
> = {
  high: {
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    icon: AlertTriangle,
    label: 'High',
  },
  medium: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    icon: Clock,
    label: 'Medium',
  },
  low: {
    color: 'bg-muted text-muted-foreground',
    icon: Info,
    label: 'Low',
  },
}

export const categoryConfig: Record<NoticeCategory, { color: string; label: string }> = {
  general: { color: 'bg-secondary text-secondary-foreground', label: 'General' },
  holiday: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', label: 'Holiday' },
  maintenance: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: 'Maintenance' },
  event: { color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Event' },
  security: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', label: 'Security' },
  rule: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300', label: 'Rule' },
}

export const targetAudienceConfig: Record<NoticeTargetAudience, { color: string; label: string }> = {
  all: { color: 'bg-muted text-muted-foreground', label: 'Everyone' },
  owners: { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', label: 'Owners' },
  tenants: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300', label: 'Tenants' },
  committee: { color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-300', label: 'Committee' },
  specific_tower: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', label: 'Tower' },
}

export interface NoticeFormData {
  title: string
  content: string
  postedBy: string
  category: NoticeCategory
  priority: string
  targetAudience: NoticeTargetAudience
}
