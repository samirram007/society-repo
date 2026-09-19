import { useState, useEffect } from 'react'
import {
  Megaphone,
  Plus,
  Loader2,
  Pin,
  AlertTriangle,
  Clock,
  Info,
  Edit,
  Trash2,
  X,
  Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { orpc } from '@/server/client'
import { MemberPicker } from '@/components/member-picker'

// ============================================
// TYPES
// ============================================
interface Notice {
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

// ============================================
// CONSTANTS
// ============================================
const priorityConfig: Record<string, { color: string; icon: any; label: string }> = {
  high: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle, label: 'High' },
  medium: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300', icon: Clock, label: 'Medium' },
  low: { color: 'bg-muted text-muted-foreground', icon: Info, label: 'Low' },
}

// ============================================
// MAIN COMPONENT
// ============================================
export function NoticesPage() {
  // State
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    postedBy: '',
    priority: 'medium',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch notices
  const fetchNotices = async () => {
    try {
      const data = await orpc.notices.list({})
      setNotices(data || [])
    } catch (error) {
      console.error('Failed to fetch notices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  // Split notices
  const pinnedNotices = notices.filter((n) => n.isPinned)
  const otherNotices = notices.filter((n) => !n.isPinned)

  // Filtered notices
  const filteredPinned = pinnedNotices.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )
  const filteredOther = otherNotices.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  )

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.content.trim()) errors.content = 'Content is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Reset form
  const resetForm = () => {
    setFormData({ title: '', content: '', postedBy: '', priority: 'medium' })
    setFormErrors({})
  }

  // Open edit dialog
  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      postedBy: notice.postedBy?.toString() || '',
      priority: notice.priority || 'medium',
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (notice: Notice) => {
    setSelectedNotice(notice)
    setDeleteDialogOpen(true)
  }

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      await orpc.notices.create({
        societyId: 1,
        title: formData.title,
        content: formData.content,
        postedBy: formData.postedBy ? Number(formData.postedBy) : 1,
        priority: formData.priority as any,
      })
      setCreateDialogOpen(false)
      resetForm()
      fetchNotices()
    } catch (error) {
      console.error('Failed to create notice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm() || !selectedNotice) return
    setSubmitting(true)
    try {
      await orpc.notices.update({
        id: selectedNotice.id,
        data: {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
        },
      })
      setEditDialogOpen(false)
      fetchNotices()
    } catch (error) {
      console.error('Failed to update notice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit delete
  const handleDeleteSubmit = async () => {
    if (!selectedNotice) return
    setSubmitting(true)
    try {
      await orpc.notices.delete({ id: selectedNotice.id })
      setDeleteDialogOpen(false)
      fetchNotices()
    } catch (error) {
      console.error('Failed to delete notice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle pin
  const handleTogglePin = async (notice: Notice) => {
    try {
      await orpc.notices.update({
        id: notice.id,
        data: { isPinned: !notice.isPinned },
      })
      fetchNotices()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-muted-foreground">View and post society notices</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Post Notice
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Pinned Notices */}
          {filteredPinned.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned
              </h2>
              {filteredPinned.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          )}

          {/* Other Notices */}
          <div className="space-y-3">
            {filteredPinned.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground">All Notices</h2>
            )}
            {filteredOther.length === 0 && filteredPinned.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Megaphone className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No notices yet</p>
                </CardContent>
              </Card>
            ) : (
              filteredOther.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  onTogglePin={handleTogglePin}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Create Notice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Post Notice</DialogTitle>
            <DialogDescription>Create a new notice for society members</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notice title"
                className={formErrors.title ? 'border-destructive' : ''}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter notice content"
                className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.content ? 'border-destructive' : ''}`}
              />
              {formErrors.content && (
                <p className="text-xs text-destructive">{formErrors.content}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <MemberPicker
              value={formData.postedBy}
              onChange={(v) => setFormData({ ...formData, postedBy: v })}
              label="Posted By"
              placeholder="Select member posting this notice"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={!formData.title || !formData.content || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Notice Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>Update notice details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notice title"
                className={formErrors.title ? 'border-destructive' : ''}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter notice content"
                className={`flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${formErrors.content ? 'border-destructive' : ''}`}
              />
              {formErrors.content && (
                <p className="text-xs text-destructive">{formErrors.content}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <MemberPicker
              value={formData.postedBy}
              onChange={(v) => setFormData({ ...formData, postedBy: v })}
              label="Posted By"
              placeholder="Select member posting this notice"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!formData.title || !formData.content || submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Notice Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedNotice?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================
// NOTICE CARD COMPONENT
// ============================================
function NoticeCard({
  notice,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  notice: Notice
  onEdit: (notice: Notice) => void
  onDelete: (notice: Notice) => void
  onTogglePin: (notice: Notice) => void
}) {
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
