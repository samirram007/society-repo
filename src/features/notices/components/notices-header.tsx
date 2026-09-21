import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NoticesHeader({ onPost }: { onPost: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
        <p className="text-muted-foreground">View and post society notices</p>
      </div>
      <Button onClick={onPost}>
        <Plus className="mr-2 h-4 w-4" />
        Post Notice
      </Button>
    </div>
  )
}
