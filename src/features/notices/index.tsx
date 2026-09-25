import { useState, useEffect, useMemo } from 'react'
import { Loader2, Megaphone, Pin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { orpc } from '@/server/client'
import { useCurrentUser } from '@/hooks/auth'
import { NoticesHeader } from './components/notices-header'
import { NoticesSearch } from './components/notices-search'
import { NoticeCard } from './components/notice-card'
import { NoticeCreateDialog, NoticeEditDialog } from './components/notice-dialogs'
import { NoticeDeleteDialog } from './components/notice-delete-dialog'
import { NoticeCommentsDialog } from './components/notice-comments-dialog'
import type { Notice, NoticeCategory, NoticeFormData } from './types'

const emptyForm: NoticeFormData = {
  title: '',
  content: '',
  postedBy: '',
  category: 'general',
  priority: 'medium',
  targetAudience: 'all',
}

const categoryFilters: { value: NoticeCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'event', label: 'Event' },
  { value: 'security', label: 'Security' },
  { value: 'rule', label: 'Rule' },
]

export function NoticesPage() {
  // State
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<NoticeCategory | 'all'>('all')

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  // Form state
  const [formData, setFormData] = useState<NoticeFormData>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: currentUser } = useCurrentUser()

  const updateForm = (updates: Partial<NoticeFormData>) =>
    setFormData((prev) => ({ ...prev, ...updates }))

  // Fetch notices
  const loadNotices = async () => {
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
    loadNotices()
  }, [])

  // Filtered notices (pinned first)
  const filtered = useMemo(
    () =>
      notices.filter(
        (n) =>
          (categoryFilter === 'all' || n.category === categoryFilter) &&
          (n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase()))
      ),
    [notices, search, categoryFilter]
  )
  const filteredPinned = filtered.filter((n) => n.isPinned)
  const filteredOther = filtered.filter((n) => !n.isPinned)

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
    setFormData(emptyForm)
    setFormErrors({})
  }

  // Open edit dialog
  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      postedBy: notice.postedBy?.toString() || '',
      category: notice.category || 'general',
      priority: notice.priority || 'medium',
      targetAudience: notice.targetAudience || 'all',
    })
    setFormErrors({})
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleDeleteClick = (notice: Notice) => {
    setSelectedNotice(notice)
    setDeleteDialogOpen(true)
  }

  // Open comments dialog
  const handleOpenComments = (notice: Notice) => {
    setSelectedNotice(notice)
    setCommentsDialogOpen(true)
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
        postedBy: formData.postedBy ? Number(formData.postedBy) : (currentUser?.id ?? 1),
        category: formData.category,
        priority: formData.priority as 'low' | 'medium' | 'high',
        targetAudience: formData.targetAudience,
      })
      setCreateDialogOpen(false)
      resetForm()
      loadNotices()
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
          category: formData.category,
          priority: formData.priority,
          targetAudience: formData.targetAudience,
        },
      })
      setEditDialogOpen(false)
      loadNotices()
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
      loadNotices()
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
      loadNotices()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <NoticesHeader
        onPost={() => {
          resetForm()
          setSelectedNotice(null)
          setCreateDialogOpen(true)
        }}
      />

      {/* Search + category filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <NoticesSearch value={search} onChange={setSearch} />
        </div>
        <div className="sm:w-52">
          <Select
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val as NoticeCategory | 'all')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryFilters.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                  onOpenComments={handleOpenComments}
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
                  onOpenComments={handleOpenComments}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Dialogs */}
      <NoticeCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        formData={formData}
        formErrors={formErrors}
        onChange={updateForm}
        onSubmit={handleCreateSubmit}
        submitting={submitting}
      />
      <NoticeEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        formData={formData}
        formErrors={formErrors}
        onChange={updateForm}
        onSubmit={handleEditSubmit}
        submitting={submitting}
      />
      <NoticeDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        notice={selectedNotice}
        onSubmit={handleDeleteSubmit}
        submitting={submitting}
      />
      <NoticeCommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        notice={selectedNotice}
        onCommentsChanged={loadNotices}
      />
    </div>
  )
}
