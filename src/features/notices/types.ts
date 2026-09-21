import { AlertTriangle, Clock, Info, type LucideIcon } from 'lucide-react'

export interface Notice {
  id: number
  societyId: number
  title: string
  content: string
  postedBy: number
  priority: string
  isPinned: boolean
  isActive: boolean
  createdAt: string
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

export interface NoticeFormData {
  title: string
  content: string
  postedBy: string
  priority: string
}
