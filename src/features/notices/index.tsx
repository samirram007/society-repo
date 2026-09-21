import { useState, useEffect } from 'react'
import { Loader2, Megaphone, Pin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { orpc } from '@/server/client'
import { NoticesHeader } from './components/notices-header'
import { NoticesSearch } from './components/notices-search'
import { NoticeCard } from './components/notice-card'
import { NoticeCreateDialog, NoticeEditDialog } from './components/notice-dialogs'
import { NoticeDeleteDialog } from './components/notice-delete-dialog'
import type { Notice, NoticeFormData } from './types'

const emptyForm: NoticeFormData = {
  title: '',
  content: '',
  postedBy: '',
  priority: 'medium',
}

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
  const [formData, setFormData] = useState<NoticeFormData>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const updateForm = (updates: Partial<NoticeFormData>) =>
    setFormData((prev) => ({ ...prev, ...updates }))

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

  // Filtered notices (pinned first)
  const filtered = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
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
      <NoticesHeader
        onPost={() => {
          resetForm()
          setSelectedNotice(null)
          setCreateDialogOpen(true)
        }}
      />

      {/* Search */}
      <NoticesSearch value={search} onChange={setSearch} />

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
    </div>
  )
}
