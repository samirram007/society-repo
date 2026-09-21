import { Edit, Pin, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { priorityConfig, type Notice } from '../types'

interface NoticeCardProps {
  notice: Notice
  onEdit: (notice: Notice) => void
  onDelete: (notice: Notice) => void
  onTogglePin: (notice: Notice) => void
}

export function NoticeCard({ notice, onEdit, onDelete, onTogglePin }: NoticeCardProps) {
  const priority = priorityConfig[notice.priority] || priorityConfig.medium
  const PriorityIcon = priority.icon

  return (
    <Card className={notice.isPinned ? 'border-primary/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{notice.title}</h3>
              <Badge className={`${priority.color} border-0 text-xs`}>
                <PriorityIcon className="mr-1 h-3 w-3" />
                {priority.label}
              </Badge>
              {notice.isPinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{notice.content}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString('en-IN') : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onTogglePin(notice)}
              title={notice.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={`h-4 w-4 ${notice.isPinned ? 'fill-primary text-primary' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(notice)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(notice)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
